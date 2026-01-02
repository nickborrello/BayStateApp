import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface RunnerAuthResult {
    runnerName: string;
    keyId?: string;
    authMethod: 'api_key' | 'hmac' | 'jwt_legacy';
}

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing Supabase configuration');
    }
    return createClient(url, key);
}

/**
 * Validates an API key from the X-API-Key header.
 * This is the primary authentication method for scraper runners.
 */
export async function validateAPIKey(
    apiKey: string | null
): Promise<RunnerAuthResult | null> {
    if (!apiKey) {
        return null;
    }

    // Validate key format (should start with bsr_)
    if (!apiKey.startsWith('bsr_')) {
        console.error('[Runner Auth] Invalid API key format');
        return null;
    }

    try {
        const supabase = getSupabaseAdmin();
        
        // Use the database function to validate and update last_used_at atomically
        const { data, error } = await supabase.rpc('validate_runner_api_key', {
            api_key: apiKey
        });

        if (error) {
            console.error('[Runner Auth] RPC error:', error.message);
            return null;
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
            console.error('[Runner Auth] Invalid or expired API key');
            return null;
        }

        const result = data[0];
        return {
            runnerName: result.runner_name,
            keyId: result.key_id,
            authMethod: 'api_key',
        };
    } catch (error) {
        console.error('[Runner Auth] Validation error:', error);
        return null;
    }
}

/**
 * Validates an HMAC signature for webhook callbacks.
 * Used as fallback when Docker container crashes and GitHub Action
 * needs to report failure directly.
 */
export async function validateHMAC(
    payload: string,
    signature: string | null,
    runnerName?: string
): Promise<RunnerAuthResult | null> {
    if (!signature) {
        return null;
    }

    const secret = process.env.SCRAPER_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[Runner Auth] SCRAPER_WEBHOOK_SECRET not configured');
        return null;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (signatureBuffer.length !== expectedBuffer.length) {
            console.error('[Runner Auth] Invalid HMAC signature length');
            return null;
        }

        if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
            console.error('[Runner Auth] HMAC signature mismatch');
            return null;
        }

        return {
            runnerName: runnerName || 'github-action-fallback',
            authMethod: 'hmac',
        };
    } catch (error) {
        console.error('[Runner Auth] HMAC validation error:', error);
        return null;
    }
}

/**
 * Legacy JWT validation for backwards compatibility during migration.
 * Will be deprecated once all runners are migrated to API keys.
 * @deprecated Use validateAPIKey instead
 */
export async function validateRunnerJWT(
    authHeader: string | null
): Promise<RunnerAuthResult | null> {
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    if (!token) {
        return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Runner Auth] Missing Supabase configuration');
        return null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('[Runner Auth] Invalid token:', userError?.message);
        return null;
    }

    const adminClient = getSupabaseAdmin();
    const { data: runner, error: runnerError } = await adminClient
        .from('scraper_runners')
        .select('name')
        .eq('auth_user_id', user.id)
        .single();

    if (runnerError || !runner) {
        console.error('[Runner Auth] No runner linked to user:', user.id);
        return null;
    }

    await adminClient
        .from('scraper_runners')
        .update({ last_auth_at: new Date().toISOString() })
        .eq('auth_user_id', user.id);

    return {
        runnerName: runner.name,
        authMethod: 'jwt_legacy',
    };
}

/**
 * Unified authentication function that tries all methods in order:
 * 1. API Key (X-API-Key header) - preferred
 * 2. HMAC signature (X-Webhook-Signature header) - for GH Action fallback
 * 3. JWT Bearer token (Authorization header) - legacy, for migration period
 */
export async function validateRunnerAuth(
    headers: {
        apiKey?: string | null;
        authorization?: string | null;
        webhookSignature?: string | null;
    },
    payload?: string,
    payloadRunnerName?: string
): Promise<RunnerAuthResult | null> {
    // 1. Try API Key first (preferred method)
    if (headers.apiKey) {
        const result = await validateAPIKey(headers.apiKey);
        if (result) return result;
    }

    // 2. Try HMAC signature (for GitHub Action crash fallback)
    if (headers.webhookSignature && payload) {
        const result = await validateHMAC(payload, headers.webhookSignature, payloadRunnerName);
        if (result) return result;
    }

    // 3. Fall back to legacy JWT (during migration period)
    if (headers.authorization) {
        const result = await validateRunnerJWT(headers.authorization);
        if (result) return result;
    }

    return null;
}

/**
 * Generates a new API key for a runner.
 * Returns the full key (only shown once) and the hash for storage.
 */
export function generateAPIKey(): { key: string; hash: string; prefix: string } {
    // Generate 32 random bytes = 256 bits of entropy
    const randomBytes = crypto.randomBytes(32);
    const keyBody = randomBytes.toString('base64url');
    
    // Prefix with bsr_ (Bay State Runner)
    const key = `bsr_${keyBody}`;
    
    // Hash for storage
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    
    // Prefix for identification
    const prefix = key.substring(0, 12);
    
    return { key, hash, prefix };
}

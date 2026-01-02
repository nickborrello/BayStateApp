import crypto from 'crypto';

/**
 * Webhook secret for validating requests from scraper runners.
 * This should be set in environment variables.
 */
const WEBHOOK_SECRET = process.env.SCRAPER_WEBHOOK_SECRET;

/**
 * Validates the HMAC-SHA256 signature from a runner.
 * Uses timing-safe comparison to prevent timing attacks.
 * 
 * @param payload - The raw request body or message to validate
 * @param signature - The signature from X-Webhook-Signature header
 * @returns true if signature is valid, false otherwise
 */
export function validateSignature(payload: string, signature: string | null): boolean {
    if (!WEBHOOK_SECRET || !signature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * Creates an HMAC-SHA256 signature for a payload.
 * Used for testing and by the coordinator when calling runners.
 * 
 * @param payload - The message to sign
 * @returns The hex-encoded signature
 */
export function createSignature(payload: string): string {
    if (!WEBHOOK_SECRET) {
        throw new Error('SCRAPER_WEBHOOK_SECRET not configured');
    }
    
    return crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
}

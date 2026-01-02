import { createClient } from '@supabase/supabase-js';

export interface RunnerAuthResult {
    userId: string;
    runnerName: string;
    runnerId: string;
}

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing Supabase configuration');
    }
    return createClient(url, key);
}

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
        userId: user.id,
        runnerName: runner.name,
        runnerId: runner.name,
    };
}

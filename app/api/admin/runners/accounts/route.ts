import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing Supabase configuration');
    }
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

function generatePassword(length = 24): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);
    return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

interface CreateRunnerRequest {
    runner_name: string;
}

export async function GET() {
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const { data: runners, error } = await admin
        .from('scraper_runners')
        .select(`
            name,
            status,
            last_seen_at,
            last_auth_at,
            auth_user_id,
            current_job_id,
            metadata,
            created_at
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Runner Accounts] Failed to fetch runners:', error);
        return NextResponse.json({ error: 'Failed to fetch runners' }, { status: 500 });
    }

    const runnersWithAuthInfo = await Promise.all(
        (runners || []).map(async (runner) => {
            let email: string | null = null;
            if (runner.auth_user_id) {
                const { data: authUser } = await admin.auth.admin.getUserById(runner.auth_user_id);
                email = authUser?.user?.email || null;
            }
            return {
                ...runner,
                email,
                has_credentials: !!runner.auth_user_id,
            };
        })
    );

    return NextResponse.json({ runners: runnersWithAuthInfo });
}

export async function POST(request: NextRequest) {
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateRunnerRequest = await request.json();
    
    if (!body.runner_name || typeof body.runner_name !== 'string') {
        return NextResponse.json({ error: 'runner_name is required' }, { status: 400 });
    }

    const runnerName = body.runner_name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (runnerName.length < 3 || runnerName.length > 50) {
        return NextResponse.json({ error: 'runner_name must be 3-50 characters' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: existing } = await admin
        .from('scraper_runners')
        .select('name, auth_user_id')
        .eq('name', runnerName)
        .single();

    if (existing?.auth_user_id) {
        return NextResponse.json({ error: 'Runner already has credentials. Delete first to regenerate.' }, { status: 409 });
    }

    const email = `runner-${runnerName}@scraper.local`;
    const password = generatePassword();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { runner_name: runnerName, type: 'scraper_runner' }
    });

    if (authError) {
        console.error('[Runner Accounts] Failed to create auth user:', authError);
        return NextResponse.json({ error: `Failed to create credentials: ${authError.message}` }, { status: 500 });
    }

    const { error: upsertError } = await admin
        .from('scraper_runners')
        .upsert({
            name: runnerName,
            auth_user_id: authData.user.id,
            status: 'offline',
            created_at: existing ? undefined : new Date().toISOString(),
        }, { onConflict: 'name' });

    if (upsertError) {
        console.error('[Runner Accounts] Failed to link runner:', upsertError);
        await admin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Failed to link runner account' }, { status: 500 });
    }

    console.log(`[Runner Accounts] Created credentials for runner: ${runnerName}`);

    return NextResponse.json({
        runner_name: runnerName,
        email,
        password,
        message: 'Save these credentials now. The password cannot be retrieved again.',
    });
}

export async function DELETE(request: NextRequest) {
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const runnerName = searchParams.get('runner_name');

    if (!runnerName) {
        return NextResponse.json({ error: 'runner_name query parameter required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: runner, error: fetchError } = await admin
        .from('scraper_runners')
        .select('auth_user_id')
        .eq('name', runnerName)
        .single();

    if (fetchError || !runner) {
        return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    if (runner.auth_user_id) {
        const { error: deleteAuthError } = await admin.auth.admin.deleteUser(runner.auth_user_id);
        if (deleteAuthError) {
            console.error('[Runner Accounts] Failed to delete auth user:', deleteAuthError);
        }
    }

    const { error: updateError } = await admin
        .from('scraper_runners')
        .update({ auth_user_id: null, last_auth_at: null })
        .eq('name', runnerName);

    if (updateError) {
        console.error('[Runner Accounts] Failed to unlink runner:', updateError);
        return NextResponse.json({ error: 'Failed to remove credentials' }, { status: 500 });
    }

    console.log(`[Runner Accounts] Deleted credentials for runner: ${runnerName}`);

    return NextResponse.json({ success: true, message: `Credentials removed for ${runnerName}` });
}

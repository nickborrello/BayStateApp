import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateRunnerAuth } from '@/lib/scraper-auth';

function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing Supabase configuration');
    }
    return createClient(url, key);
}

interface HeartbeatRequest {
    runner_name?: string;
    status?: 'idle' | 'busy' | 'polling';
    current_job_id?: string;
    jobs_completed?: number;
    memory_usage_mb?: number;
}

export async function POST(request: NextRequest) {
    try {
        const runner = await validateRunnerAuth({
            apiKey: request.headers.get('X-API-Key'),
            authorization: request.headers.get('Authorization'),
        });

        if (!runner) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: HeartbeatRequest = await request.json();
        const runnerName = body.runner_name || runner.runnerName;
        const supabase = getSupabaseAdmin();

        const updatePayload: Record<string, unknown> = {
            last_seen_at: new Date().toISOString(),
            status: body.status || 'idle',
        };

        if (body.current_job_id !== undefined) {
            updatePayload.current_job_id = body.current_job_id;
        }
        if (body.jobs_completed !== undefined) {
            updatePayload.jobs_completed = body.jobs_completed;
        }
        if (body.memory_usage_mb !== undefined) {
            updatePayload.memory_usage_mb = body.memory_usage_mb;
        }

        const { error } = await supabase
            .from('scraper_runners')
            .update(updatePayload)
            .eq('name', runnerName);

        if (error) {
            console.error(`[Heartbeat] Failed to update runner ${runnerName}:`, error);
            return NextResponse.json(
                { error: 'Failed to update heartbeat' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            acknowledged: true,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Heartbeat] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

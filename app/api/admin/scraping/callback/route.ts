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

interface ScrapedData {
    [scraperName: string]: {
        price?: number;
        title?: string;
        description?: string;
        images?: string[];
        availability?: string;
        ratings?: number;
        reviews_count?: number;
        url?: string;
        scraped_at?: string;
    };
}

interface CallbackPayload {
    job_id: string;
    status: 'running' | 'completed' | 'failed';
    runner_name?: string;
    error_message?: string;
    results?: {
        skus_processed?: number;
        scrapers_run?: string[];
        data?: Record<string, ScrapedData>;
    };
}

export async function POST(request: NextRequest) {
    try {
        // Read body as text first for HMAC validation
        const bodyText = await request.text();
        let payload: CallbackPayload;
        
        try {
            payload = JSON.parse(bodyText);
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON payload' },
                { status: 400 }
            );
        }

        // Validate authentication using unified auth function
        const runner = await validateRunnerAuth(
            {
                apiKey: request.headers.get('X-API-Key'),
                authorization: request.headers.get('Authorization'),
                webhookSignature: request.headers.get('X-Webhook-Signature'),
            },
            bodyText,
            payload.runner_name
        );

        if (!runner) {
            console.error('[Callback] Authentication failed - no valid credentials');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log(`[Callback] Authenticated via ${runner.authMethod}: ${runner.runnerName}`);

        if (!payload.job_id || !payload.status) {
            return NextResponse.json(
                { error: 'Missing required fields: job_id, status' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Update job status
        const updateData: Record<string, unknown> = {
            status: payload.status,
        };

        if (payload.status === 'completed' || payload.status === 'failed') {
            updateData.completed_at = new Date().toISOString();
        }

        if (payload.error_message) {
            updateData.error_message = payload.error_message;
        }

        const { error: updateError } = await supabase
            .from('scrape_jobs')
            .update(updateData)
            .eq('id', payload.job_id);

        if (updateError) {
            console.error('[Callback] Failed to update job:', updateError);
            return NextResponse.json(
                { error: 'Failed to update job' },
                { status: 500 }
            );
        }

        // Update runner status
        const runnerName = payload.runner_name || runner.runnerName;
        const runnerStatus = payload.status === 'running' ? 'busy' : 'online';
        const currentJobId = payload.status === 'running' ? payload.job_id : null;

        await supabase
            .from('scraper_runners')
            .update({
                status: runnerStatus,
                last_seen_at: new Date().toISOString(),
                current_job_id: currentJobId,
                metadata: { 
                    last_ip: request.headers.get('x-forwarded-for') || 'unknown',
                    auth_method: runner.authMethod,
                }
            })
            .eq('name', runnerName);

        // Process scraped data if job completed successfully
        if (payload.status === 'completed' && payload.results?.data) {
            const skus = Object.keys(payload.results.data);

            for (const sku of skus) {
                const scrapedData = payload.results.data[sku];

                const { data: product } = await supabase
                    .from('products_ingestion')
                    .select('sources')
                    .eq('sku', sku)
                    .single();

                const existingSources = (product?.sources as Record<string, unknown>) || {};
                const updatedSources = {
                    ...existingSources,
                    ...scrapedData,
                    _last_scraped: new Date().toISOString(),
                };

                const { error: productError } = await supabase
                    .from('products_ingestion')
                    .update({
                        sources: updatedSources,
                        pipeline_status: 'scraped',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('sku', sku);

                if (productError) {
                    console.error(`[Callback] Failed to update product ${sku}:`, productError);
                }
            }

            console.log(`[Callback] Updated ${skus.length} products with scraped data`);
        }

        // Store full results for audit/debugging
        if (payload.status === 'completed' && payload.results) {
            const { error: insertError } = await supabase
                .from('scrape_results')
                .insert({
                    job_id: payload.job_id,
                    runner_name: runnerName,
                    data: payload.results,
                });

            if (insertError) {
                console.error('[Callback] Failed to insert results:', insertError);
            }
        }

        console.log(`[Callback] Job ${payload.job_id} updated to ${payload.status} by ${runnerName}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Callback] Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateSignature } from '@/lib/scraper-auth';

// Create Supabase admin client lazily (runtime only, not at build)
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
        data?: Record<string, ScrapedData>; // SKU -> scraper results
    };
}

/**
 * POST /api/admin/scraping/callback
 * 
 * Receives status updates and results from self-hosted runners.
 * Runners have NO database credentials - they report back here.
 * 
 * When scraping completes:
 * 1. Updates products_ingestion.sources with scraped data
 * 2. Moves products to 'scraped' status
 * 3. Marks job as completed
 */
export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature validation
        const rawBody = await request.text();
        const signature = request.headers.get('X-Webhook-Signature');

        // Validate signature
        if (!validateSignature(rawBody, signature)) {
            console.error('[Callback] Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse payload
        const payload: CallbackPayload = JSON.parse(rawBody);

        // Validate required fields
        if (!payload.job_id || !payload.status) {
            return NextResponse.json(
                { error: 'Missing required fields: job_id, status' },
                { status: 400 }
            );
        }

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

        const { error: updateError } = await getSupabaseAdmin()
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

        // If completed with results, update product sources and status
        if (payload.status === 'completed' && payload.results?.data) {
            const skus = Object.keys(payload.results.data);

            for (const sku of skus) {
                const scrapedData = payload.results.data[sku];

                // Get current product to merge sources
                const { data: product } = await getSupabaseAdmin()
                    .from('products_ingestion')
                    .select('sources')
                    .eq('sku', sku)
                    .single();

                // Merge new scraped data with existing sources
                const existingSources = (product?.sources as Record<string, unknown>) || {};
                const updatedSources = {
                    ...existingSources,
                    ...scrapedData,
                    _last_scraped: new Date().toISOString(),
                };

                // Update product with scraped data and move to 'scraped' status
                const { error: productError } = await getSupabaseAdmin()
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

        // Store results in scrape_results table for audit
        if (payload.status === 'completed' && payload.results) {
            const { error: insertError } = await getSupabaseAdmin()
                .from('scrape_results')
                .insert({
                    job_id: payload.job_id,
                    runner_name: payload.runner_name || 'unknown',
                    data: payload.results,
                });

            if (insertError) {
                console.error('[Callback] Failed to insert results:', insertError);
            }
        }

        console.log(`[Callback] Job ${payload.job_id} updated to ${payload.status}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Callback] Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateRunnerJWT } from '@/lib/scraper-auth';

function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing Supabase configuration');
    }
    return createClient(url, key);
}

interface ScraperConfig {
    name: string;
    disabled: boolean;
    base_url?: string;
    search_url_template?: string;
    selectors?: Record<string, unknown>;
    options?: Record<string, unknown>;
    test_skus?: string[];
}

interface JobConfigResponse {
    job_id: string;
    skus: string[];
    scrapers: ScraperConfig[];
    test_mode: boolean;
    max_workers: number;
}

export async function GET(request: NextRequest) {
    try {
        const runner = await validateRunnerJWT(request.headers.get('Authorization'));
        if (!runner) {
            console.error('[Scraper API] Invalid or missing JWT');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');

        if (!jobId) {
            return NextResponse.json(
                { error: 'Missing required parameter: job_id' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            console.error(`[Scraper API] Job not found: ${jobId}`, jobError);
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        let scraperQuery = supabase
            .from('scrapers')
            .select('*')
            .eq('disabled', false);

        if (job.scrapers && job.scrapers.length > 0) {
            scraperQuery = scraperQuery.in('name', job.scrapers);
        }

        const { data: scrapers, error: scrapersError } = await scraperQuery;

        if (scrapersError) {
            console.error(`[Scraper API] Failed to fetch scrapers:`, scrapersError);
            return NextResponse.json(
                { error: 'Failed to fetch scraper configurations' },
                { status: 500 }
            );
        }

        let skus: string[] = job.skus || [];
        if (skus.length === 0) {
            const { data: stagingProducts } = await supabase
                .from('products')
                .select('sku')
                .eq('pipeline_status', 'staging')
                .limit(500);

            if (stagingProducts) {
                skus = stagingProducts.map(p => p.sku);
            }
        }

        const response: JobConfigResponse = {
            job_id: job.id,
            skus,
            scrapers: (scrapers || []).map(s => ({
                name: s.name,
                disabled: s.disabled || false,
                base_url: s.base_url,
                search_url_template: s.search_url_template,
                selectors: s.selectors,
                options: s.options,
                test_skus: s.test_skus,
            })),
            test_mode: job.test_mode || false,
            max_workers: job.max_workers || 3,
        };

        console.log(`[Scraper API] Job ${jobId} config sent to ${runner.runnerName}: ${skus.length} SKUs, ${scrapers?.length || 0} scrapers`);

        return NextResponse.json(response);
    } catch (error) {
        console.error('[Scraper API] Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

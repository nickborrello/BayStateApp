import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateSignature } from '@/lib/scraper-auth';

/**
 * Create Supabase admin client lazily (runtime only, not at build)
 */
function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing Supabase configuration');
    }
    return createClient(url, key);
}

/**
 * Scraper configuration as stored in the database
 */
interface ScraperConfig {
    name: string;
    disabled: boolean;
    base_url?: string;
    search_url_template?: string;
    selectors?: Record<string, unknown>;
    options?: Record<string, unknown>;
    test_skus?: string[];
}

/**
 * Job configuration response sent to runners
 */
interface JobConfigResponse {
    job_id: string;
    skus: string[];
    scrapers: ScraperConfig[];
    test_mode: boolean;
    max_workers: number;
}

/**
 * GET /api/scraper/v1/job
 * 
 * Runners call this endpoint to fetch job details and scraper configurations.
 * This eliminates the need for runners to have direct database access.
 * 
 * Authentication: HMAC-SHA256 signature on the job_id
 * - Header: X-Webhook-Signature = HMAC(job_id, SCRAPER_WEBHOOK_SECRET)
 * 
 * Query params:
 * - job_id: The UUID of the scrape job to fetch
 * 
 * Returns:
 * - job_id: The job identifier
 * - skus: Array of SKUs to scrape (or empty for all staging products)
 * - scrapers: Array of scraper configs with selectors and options
 * - test_mode: Whether this is a test run
 * - max_workers: Maximum concurrent workers
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');

        // Validate required job_id parameter
        if (!jobId) {
            return NextResponse.json(
                { error: 'Missing required parameter: job_id' },
                { status: 400 }
            );
        }

        // Validate signature - runner must sign the job_id
        const signature = request.headers.get('X-Webhook-Signature');
        if (!validateSignature(jobId, signature)) {
            console.error(`[Scraper API] Invalid signature for job ${jobId}`);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Fetch the job
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

        // Fetch scraper configurations
        // If job specifies scrapers, fetch those; otherwise fetch all enabled
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

        // If job has no SKUs specified, fetch staging products
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

        // Build response
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

        console.log(`[Scraper API] Job ${jobId} config sent: ${skus.length} SKUs, ${scrapers?.length || 0} scrapers`);

        return NextResponse.json(response);
    } catch (error) {
        console.error('[Scraper API] Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

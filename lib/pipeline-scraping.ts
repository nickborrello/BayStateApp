'use server';

import { createClient } from '@/lib/supabase/server';
import { getGitHubClient } from '@/lib/admin/scraping/github-client';

/**
 * Options for scraping jobs with chunking support.
 */
export interface ScrapeOptions {
    /** Size of each chunk (default: 50 SKUs per chunk) */
    chunkSize?: number;
    /** Maximum runners to dispatch (default: 3) */
    maxRunners?: number;
    /** Workers per runner (default: 3) */
    maxWorkers?: number;
    /** Run in test mode */
    testMode?: boolean;
    /** Specific scrapers to use (empty = all) */
    scrapers?: string[];
}

export interface ScrapeResult {
    success: boolean;
    jobId?: string;
    chunksCreated?: number;
    runnersDispatched?: number;
    error?: string;
}

/**
 * Default chunk size - balances memory usage with efficiency.
 * 50 SKUs × 10 scrapers = 500 operations per chunk ≈ 25-30 min
 */
const DEFAULT_CHUNK_SIZE = 50;

/**
 * Triggers a scraping job for selected products in the pipeline.
 * 
 * For large SKU lists, this function:
 * 1. Creates a parent job record
 * 2. Splits SKUs into chunks (default 50 per chunk)
 * 3. Creates chunk records in scrape_job_chunks table
 * 4. Dispatches multiple GitHub workflow runs (one per runner)
 * 
 * Each runner operates in "chunk_worker" mode:
 * - Claims pending chunks atomically
 * - Processes each chunk
 * - Reports results back via callback
 * - Repeats until no chunks remain
 */
export async function scrapeProducts(
    skus: string[],
    options?: ScrapeOptions
): Promise<ScrapeResult> {
    if (!skus || skus.length === 0) {
        return { success: false, error: 'No SKUs provided' };
    }

    const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const maxRunners = options?.maxRunners ?? 3;
    const maxWorkers = options?.maxWorkers ?? 3;
    const testMode = options?.testMode ?? false;
    const scrapers = options?.scrapers ?? [];

    const supabase = await createClient();

    // Create parent job record
    const { data: job, error: insertError } = await supabase
        .from('scrape_jobs')
        .insert({
            skus: skus,
            scrapers: scrapers,
            test_mode: testMode,
            max_workers: maxWorkers,
            status: 'pending',
        })
        .select('id')
        .single();

    if (insertError || !job) {
        console.error('[Pipeline Scraping] Failed to create job:', insertError);
        return { success: false, error: 'Failed to create scraping job' };
    }

    // Determine if we should use chunking
    // For small jobs (< chunk size), use legacy single-runner mode
    const useChunking = skus.length > chunkSize;

    if (!useChunking) {
        // Legacy mode: single runner processes everything
        console.log(`[Pipeline Scraping] Small job (${skus.length} SKUs), using single runner mode`);
        
        try {
            const githubClient = getGitHubClient();
            await githubClient.triggerWorkflow({
                job_id: job.id,
                skus: skus.join(','),
                scrapers: scrapers.join(','),
                test_mode: testMode,
                max_workers: maxWorkers,
            });

            return { 
                success: true, 
                jobId: job.id,
                chunksCreated: 0,
                runnersDispatched: 1,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to trigger workflow';
            await supabase
                .from('scrape_jobs')
                .update({ status: 'failed', error_message: errorMessage })
                .eq('id', job.id);

            return { success: false, error: errorMessage };
        }
    }

    // Chunking mode: split SKUs and dispatch multiple runners
    console.log(`[Pipeline Scraping] Large job (${skus.length} SKUs), using chunking mode`);

    // Split SKUs into chunks
    const chunks: { job_id: string; chunk_index: number; skus: string[]; scrapers: string[] }[] = [];
    for (let i = 0; i < skus.length; i += chunkSize) {
        chunks.push({
            job_id: job.id,
            chunk_index: chunks.length,
            skus: skus.slice(i, i + chunkSize),
            scrapers: scrapers,
        });
    }

    // Insert all chunks
    const { error: chunksError } = await supabase
        .from('scrape_job_chunks')
        .insert(chunks);

    if (chunksError) {
        console.error('[Pipeline Scraping] Failed to create chunks:', chunksError);
        await supabase
            .from('scrape_jobs')
            .update({ status: 'failed', error_message: 'Failed to create job chunks' })
            .eq('id', job.id);
        return { success: false, error: 'Failed to create job chunks' };
    }

    console.log(`[Pipeline Scraping] Created ${chunks.length} chunks for job ${job.id}`);

    // Dispatch runners (up to maxRunners or number of chunks, whichever is smaller)
    const runnersToDispatch = Math.min(maxRunners, chunks.length);
    let runnersDispatched = 0;

    try {
        const githubClient = getGitHubClient();

        // Dispatch multiple workflow runs
        const dispatchPromises = [];
        for (let i = 0; i < runnersToDispatch; i++) {
            dispatchPromises.push(
                githubClient.triggerWorkflow({
                    job_id: job.id,
                    mode: 'chunk_worker',
                    max_workers: maxWorkers,
                    test_mode: testMode,
                })
            );
        }

        // Wait for all dispatches with error tolerance
        const results = await Promise.allSettled(dispatchPromises);
        runnersDispatched = results.filter(r => r.status === 'fulfilled').length;

        if (runnersDispatched === 0) {
            throw new Error('Failed to dispatch any runners');
        }

        console.log(`[Pipeline Scraping] Dispatched ${runnersDispatched}/${runnersToDispatch} runners for job ${job.id}`);

        // Update job status to running
        await supabase
            .from('scrape_jobs')
            .update({ status: 'running' })
            .eq('id', job.id);

        return {
            success: true,
            jobId: job.id,
            chunksCreated: chunks.length,
            runnersDispatched,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to trigger workflows';
        console.error('[Pipeline Scraping] Dispatch error:', errorMessage);
        
        // Don't fail completely if some runners were dispatched
        if (runnersDispatched > 0) {
            await supabase
                .from('scrape_jobs')
                .update({ status: 'running' })
                .eq('id', job.id);

            return {
                success: true,
                jobId: job.id,
                chunksCreated: chunks.length,
                runnersDispatched,
                error: `Partial dispatch: ${runnersDispatched}/${runnersToDispatch} runners`,
            };
        }

        await supabase
            .from('scrape_jobs')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('id', job.id);

        return { success: false, error: errorMessage };
    }
}

/**
 * Gets the status of a scraping job for the pipeline.
 * For chunked jobs, includes chunk-level progress.
 */
export async function getScrapeJobStatus(jobId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    completedAt?: string;
    error?: string;
    progress?: {
        totalChunks: number;
        completedChunks: number;
        failedChunks: number;
        skusProcessed: number;
        skusSuccessful: number;
        skusFailed: number;
    };
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('scrape_jobs')
        .select('status, completed_at, error_message')
        .eq('id', jobId)
        .single();

    if (error || !data) {
        return { status: 'failed', error: 'Job not found' };
    }

    // Check for chunk progress
    const { data: chunks } = await supabase
        .from('scrape_job_chunks')
        .select('status, skus_processed, skus_successful, skus_failed')
        .eq('job_id', jobId);

    let progress;
    if (chunks && chunks.length > 0) {
        progress = {
            totalChunks: chunks.length,
            completedChunks: chunks.filter(c => c.status === 'completed').length,
            failedChunks: chunks.filter(c => c.status === 'failed').length,
            skusProcessed: chunks.reduce((sum, c) => sum + (c.skus_processed || 0), 0),
            skusSuccessful: chunks.reduce((sum, c) => sum + (c.skus_successful || 0), 0),
            skusFailed: chunks.reduce((sum, c) => sum + (c.skus_failed || 0), 0),
        };
    }

    return {
        status: data.status,
        completedAt: data.completed_at,
        error: data.error_message,
        progress,
    };
}

/**
 * Check if there are any runners available for scraping.
 */
export async function checkRunnersAvailable(): Promise<boolean> {
    try {
        const githubClient = getGitHubClient();
        const status = await githubClient.getRunnerStatus();
        return status?.available ?? false;
    } catch {
        return false;
    }
}

/**
 * Get count of available online runners.
 */
export async function getAvailableRunnerCount(): Promise<number> {
    try {
        const githubClient = getGitHubClient();
        const status = await githubClient.getRunnerStatus();
        // Count online runners that are not busy
        return status?.runners?.filter(r => r.status === 'online' && !r.busy).length ?? 0;
    } catch {
        return 0;
    }
}

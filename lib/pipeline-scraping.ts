'use server';

import { createClient } from '@/lib/supabase/server';

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
 * This function creates a job record in the database. Daemon runners
 * will poll for pending jobs and process them automatically.
 * 
 * For large SKU lists, this function:
 * 1. Creates a parent job record
 * 2. Splits SKUs into chunks (default 50 per chunk)
 * 3. Creates chunk records in scrape_job_chunks table
 * 
 * Runners operate in "chunk_worker" mode:
 * - Claims pending chunks atomically via RPC
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
    const maxWorkers = options?.maxWorkers ?? 3;
    const testMode = options?.testMode ?? false;
    const scrapers = options?.scrapers ?? [];

    const supabase = await createClient();

    // Create parent job record with status 'pending'
    // Daemon runners will poll and claim this job
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

    // For small jobs (< chunk size), no chunking needed
    // Runners will process the job directly
    const useChunking = skus.length > chunkSize;

    if (!useChunking) {
        console.log(`[Pipeline Scraping] Created job ${job.id} with ${skus.length} SKUs (pending for daemon pickup)`);
        
        return { 
            success: true, 
            jobId: job.id,
            chunksCreated: 0,
        };
    }

    // Chunking mode: split SKUs for parallel processing by multiple runners
    console.log(`[Pipeline Scraping] Large job (${skus.length} SKUs), creating chunks`);

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

    console.log(`[Pipeline Scraping] Created job ${job.id} with ${chunks.length} chunks (pending for daemon pickup)`);

    return {
        success: true,
        jobId: job.id,
        chunksCreated: chunks.length,
    };
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
 * Checks if any daemon runners are available to process jobs.
 * Looks for runners that have checked in within the last 5 minutes.
 */
export async function checkRunnersAvailable(): Promise<boolean> {
    const count = await getAvailableRunnerCount();
    return count > 0;
}

/**
 * Gets the count of available daemon runners.
 * Only counts runners seen within the last 5 minutes with active status.
 */
export async function getAvailableRunnerCount(): Promise<number> {
    const supabase = await createClient();
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
        .from('scraper_runners')
        .select('*', { count: 'exact', head: true })
        .gt('last_seen_at', fiveMinutesAgo)
        .in('status', ['online', 'polling', 'idle', 'running']);
        
    if (error) {
        console.error('[Pipeline Scraping] Failed to check runners:', error);
        return 0;
    }
    
    return count || 0;
}

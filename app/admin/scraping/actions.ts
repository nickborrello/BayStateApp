'use server';

import { createClient } from '@/lib/supabase/server';
import { getGitHubClient, type RunnerStatus, type TriggerWorkflowInputs } from '@/lib/admin/scraping/github-client';
import { revalidatePath } from 'next/cache';

export interface ScrapeJob {
    id: string;
    skus: string[] | null;
    scrapers: string[] | null;
    test_mode: boolean;
    max_workers: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    github_run_id: number | null;
    created_at: string;
    completed_at: string | null;
    error_message: string | null;
}

export interface ScrapeResult {
    id: string;
    job_id: string;
    data: Record<string, unknown>;
    runner_name: string | null;
    created_at: string;
}

export interface StartJobParams {
    skus?: string[];
    scrapers?: string[];
    testMode?: boolean;
    maxWorkers?: number;
}

/**
 * Get the current status of self-hosted runners
 */
export async function getRunnerStatus(): Promise<RunnerStatus | null> {
    try {
        const client = getGitHubClient();
        return await client.getRunnerStatus();
    } catch (error) {
        console.error('Failed to get runner status:', error);
        return null;
    }
}

/**
 * Check if runners are available for scraping
 */
export async function hasRunnersAvailable(): Promise<boolean> {
    const status = await getRunnerStatus();
    return status?.available ?? false;
}

/**
 * Start a new scraping job
 */
export async function startScrapeJob(
    params: StartJobParams
): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
        const supabase = await createClient();

        // Verify runner availability
        const runnersAvailable = await hasRunnersAvailable();
        if (!runnersAvailable) {
            return {
                success: false,
                error: 'No self-hosted runners are currently available',
            };
        }

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Create job record
        const { data: job, error: insertError } = await supabase
            .from('scrape_jobs')
            .insert({
                skus: params.skus || null,
                scrapers: params.scrapers || null,
                test_mode: params.testMode ?? false,
                max_workers: params.maxWorkers ?? 3,
                status: 'pending',
                created_by: user.id,
            })
            .select('id')
            .single();

        if (insertError || !job) {
            console.error('Failed to create job:', insertError);
            return { success: false, error: 'Failed to create scraping job' };
        }

        // Trigger GitHub workflow
        const client = getGitHubClient();
        const workflowInputs: TriggerWorkflowInputs = {
            job_id: job.id,
            skus: params.skus?.join(','),
            scrapers: params.scrapers?.join(','),
            test_mode: params.testMode,
            max_workers: params.maxWorkers,
        };
        await client.triggerWorkflow(workflowInputs);

        revalidatePath('/admin/scraping');
        return { success: true, jobId: job.id };
    } catch (error) {
        console.error('Failed to start scrape job:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get all scraping jobs with optional pagination
 */
export async function getScrapeJobs(
    limit = 20,
    offset = 0
): Promise<{ jobs: ScrapeJob[]; total: number }> {
    const supabase = await createClient();

    const [{ data: jobs, error }, { count }] = await Promise.all([
        supabase
            .from('scrape_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1),
        supabase
            .from('scrape_jobs')
            .select('*', { count: 'exact', head: true }),
    ]);

    if (error) {
        console.error('Failed to fetch jobs:', error);
        return { jobs: [], total: 0 };
    }

    return {
        jobs: (jobs as ScrapeJob[]) || [],
        total: count || 0,
    };
}

/**
 * Get results for a specific job
 */
export async function getScrapeResults(
    jobId: string
): Promise<ScrapeResult[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('scrape_results')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch results:', error);
        return [];
    }

    return (data as ScrapeResult[]) || [];
}

/**
 * Get a single job by ID
 */
export async function getScrapeJob(jobId: string): Promise<ScrapeJob | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (error) {
        console.error('Failed to fetch job:', error);
        return null;
    }

    return data as ScrapeJob;
}

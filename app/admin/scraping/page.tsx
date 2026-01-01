import { getRunnerStatus, getScrapeJobs, getScrapeResults } from './actions';
import { RunnerStatusCard } from '@/components/admin/scraping/runner-status';
import { JobForm } from '@/components/admin/scraping/job-form';
import { JobTable } from '@/components/admin/scraping/job-table';

export const dynamic = 'force-dynamic';

export default async function ScrapingPage() {
    const [runnerStatus, { jobs }] = await Promise.all([
        getRunnerStatus(),
        getScrapeJobs(20),
    ]);

    // Fetch results for completed jobs
    const completedJobIds = jobs
        .filter((job) => job.status === 'completed')
        .map((job) => job.id);

    const resultsMap: Record<string, Awaited<ReturnType<typeof getScrapeResults>>> = {};
    await Promise.all(
        completedJobIds.map(async (jobId) => {
            resultsMap[jobId] = await getScrapeResults(jobId);
        })
    );

    const isAvailable = runnerStatus?.available ?? false;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Scraping</h1>
                <p className="text-gray-600">
                    Run web scrapers on self-hosted runners to collect product data.
                </p>
            </div>

            {/* Runner Status + Job Form */}
            <div className="grid gap-6 lg:grid-cols-2">
                <RunnerStatusCard initialStatus={runnerStatus} />
                <JobForm disabled={!isAvailable} />
            </div>

            {/* Job History */}
            <JobTable jobs={jobs} results={resultsMap} />
        </div>
    );
}

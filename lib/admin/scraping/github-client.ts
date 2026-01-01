/**
 * GitHub API Client for Self-Hosted Runner Management
 *
 * Provides typed access to GitHub Actions API for managing
 * self-hosted runners and triggering workflows.
 */

export interface GitHubRunner {
    id: number;
    name: string;
    os: string;
    status: 'online' | 'offline';
    busy: boolean;
    labels: Array<{ id: number; name: string; type: string }>;
}

export interface GitHubRunnersResponse {
    total_count: number;
    runners: GitHubRunner[];
}

export interface WorkflowRun {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
    html_url: string;
    created_at: string;
    updated_at: string;
}

export interface WorkflowRunsResponse {
    total_count: number;
    workflow_runs: WorkflowRun[];
}

export interface TriggerWorkflowInputs {
    job_id: string;
    skus?: string;
    scrapers?: string;
    test_mode?: boolean;
    max_workers?: number;
}

export interface RunnerStatus {
    available: boolean;
    onlineCount: number;
    offlineCount: number;
    totalCount: number;
    runners: GitHubRunner[];
}

class GitHubClient {
    private readonly baseUrl = 'https://api.github.com';
    private readonly token: string;
    private readonly owner: string;
    private readonly repo: string;

    constructor() {
        const token = process.env.GITHUB_PAT;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;

        if (!token || !owner || !repo) {
            throw new Error(
                'Missing GitHub configuration. Required: GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO'
            );
        }

        this.token = token;
        this.owner = owner;
        this.repo = repo;
    }

    private async fetch<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${this.token}`,
                'X-GitHub-Api-Version': '2022-11-28',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${error}`);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    /**
     * Get all self-hosted runners for the repository
     */
    async getRunners(): Promise<GitHubRunnersResponse> {
        return this.fetch<GitHubRunnersResponse>(
            `/repos/${this.owner}/${this.repo}/actions/runners`
        );
    }

    /**
     * Get runner availability status
     */
    async getRunnerStatus(): Promise<RunnerStatus> {
        const response = await this.getRunners();

        const onlineRunners = response.runners.filter((r) => r.status === 'online');
        const offlineRunners = response.runners.filter(
            (r) => r.status === 'offline'
        );

        return {
            available: onlineRunners.length > 0,
            onlineCount: onlineRunners.length,
            offlineCount: offlineRunners.length,
            totalCount: response.total_count,
            runners: response.runners,
        };
    }

    /**
     * Check if at least one runner is available
     */
    async hasAvailableRunners(): Promise<boolean> {
        const status = await this.getRunnerStatus();
        return status.available;
    }

    /**
     * Trigger the scraping workflow
     */
    async triggerWorkflow(inputs: TriggerWorkflowInputs): Promise<void> {
        await this.fetch(
            `/repos/${this.owner}/${this.repo}/actions/workflows/scrape.yml/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs,
                }),
            }
        );
    }

    /**
     * Get a specific workflow run
     */
    async getWorkflowRun(runId: number): Promise<WorkflowRun> {
        return this.fetch<WorkflowRun>(
            `/repos/${this.owner}/${this.repo}/actions/runs/${runId}`
        );
    }

    /**
     * Get recent workflow runs for the scrape workflow
     */
    async getWorkflowRuns(limit = 10): Promise<WorkflowRunsResponse> {
        return this.fetch<WorkflowRunsResponse>(
            `/repos/${this.owner}/${this.repo}/actions/workflows/scrape.yml/runs?per_page=${limit}`
        );
    }
}

// Export singleton instance getter
let clientInstance: GitHubClient | null = null;

export function getGitHubClient(): GitHubClient {
    if (!clientInstance) {
        clientInstance = new GitHubClient();
    }
    return clientInstance;
}

// Export for testing with custom config
export { GitHubClient };

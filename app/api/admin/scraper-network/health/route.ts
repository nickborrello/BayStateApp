import { NextResponse } from 'next/server';
import { getGitHubClient } from '@/lib/admin/scraping/github-client';

export const dynamic = 'force-dynamic';

interface ConfigCheck {
    name: string;
    status: 'ok' | 'error' | 'warning';
    message: string;
}

export async function GET() {
    const checks: ConfigCheck[] = [];

    // Check environment variables
    const hasAppId = !!process.env.GITHUB_APP_ID;
    const hasPrivateKey = !!process.env.GITHUB_APP_PRIVATE_KEY;
    const hasInstallationId = !!process.env.GITHUB_APP_INSTALLATION_ID;
    const hasOwner = !!process.env.GITHUB_OWNER;
    const hasRepo = !!process.env.GITHUB_REPO;
    const hasWebhookSecret = !!process.env.SCRAPER_WEBHOOK_SECRET;

    // GitHub App Config
    if (hasAppId && hasPrivateKey && hasInstallationId) {
        checks.push({
            name: 'GitHub App',
            status: 'ok',
            message: 'App ID, Private Key, and Installation ID configured',
        });
    } else {
        const missing = [];
        if (!hasAppId) missing.push('GITHUB_APP_ID');
        if (!hasPrivateKey) missing.push('GITHUB_APP_PRIVATE_KEY');
        if (!hasInstallationId) missing.push('GITHUB_APP_INSTALLATION_ID');
        checks.push({
            name: 'GitHub App',
            status: 'error',
            message: `Missing: ${missing.join(', ')}`,
        });
    }

    // Repository Config
    if (hasOwner && hasRepo) {
        checks.push({
            name: 'Repository',
            status: 'ok',
            message: `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`,
        });
    } else {
        checks.push({
            name: 'Repository',
            status: 'error',
            message: 'Missing GITHUB_OWNER or GITHUB_REPO',
        });
    }

    // Webhook Secret
    if (hasWebhookSecret) {
        checks.push({
            name: 'Webhook Secret',
            status: 'ok',
            message: 'Callback authentication configured',
        });
    } else {
        checks.push({
            name: 'Webhook Secret',
            status: 'warning',
            message: 'SCRAPER_WEBHOOK_SECRET not set - callbacks will fail',
        });
    }

    // Test GitHub API connection
    try {
        const client = getGitHubClient();
        const status = await client.getRunnerStatus();
        checks.push({
            name: 'GitHub API',
            status: 'ok',
            message: `Connected - ${status.totalCount} runner(s) registered`,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Connection failed';
        const isPermissionError = message.includes("Missing 'Administration' permission");

        checks.push({
            name: 'GitHub API',
            status: isPermissionError ? 'warning' : 'error',
            message: message,
        });
    }

    return NextResponse.json({ checks });
}

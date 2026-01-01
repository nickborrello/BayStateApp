'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScrapeJob, ScrapeResult } from '@/app/admin/scraping/actions';

interface JobTableProps {
    jobs: ScrapeJob[];
    results?: Record<string, ScrapeResult[]>;
}

function StatusBadge({ status }: { status: ScrapeJob['status'] }) {
    const variants: Record<
        ScrapeJob['status'],
        'default' | 'secondary' | 'destructive' | 'outline'
    > = {
        pending: 'secondary',
        running: 'default',
        completed: 'outline',
        failed: 'destructive',
    };

    const labels: Record<ScrapeJob['status'], string> = {
        pending: '⏳ Pending',
        running: '🔄 Running',
        completed: '✅ Completed',
        failed: '❌ Failed',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function formatDuration(start: string, end: string | null): string {
    if (!end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
}

function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
}

function formatArray(arr: string[] | null): string {
    if (!arr || arr.length === 0) return 'All';
    if (arr.length <= 3) return arr.join(', ');
    return `${arr.slice(0, 3).join(', ')} +${arr.length - 3} more`;
}

export function JobTable({ jobs, results = {} }: JobTableProps) {
    const [expandedJob, setExpandedJob] = useState<string | null>(null);

    if (jobs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Scraping Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No scraping jobs yet. Create your first job above.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Scraping Jobs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>SKUs</TableHead>
                            <TableHead>Scrapers</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <>
                                <TableRow
                                    key={job.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                        setExpandedJob(expandedJob === job.id ? null : job.id)
                                    }
                                >
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                                            {expandedJob === job.id ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm">
                                            {formatArray(job.skus)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm">
                                            {formatArray(job.scrapers)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={job.status} />
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatTime(job.created_at)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDuration(job.created_at, job.completed_at)}
                                    </TableCell>
                                </TableRow>

                                {expandedJob === job.id && (
                                    <TableRow key={`${job.id}-details`}>
                                        <TableCell colSpan={6} className="bg-muted/30">
                                            <div className="p-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                                            SKUs
                                                        </div>
                                                        <code className="text-sm">
                                                            {job.skus?.join(', ') || 'All'}
                                                        </code>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                                            Scrapers
                                                        </div>
                                                        <code className="text-sm">
                                                            {job.scrapers?.join(', ') || 'All'}
                                                        </code>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <Badge variant="outline">
                                                        Workers: {job.max_workers}
                                                    </Badge>
                                                    {job.test_mode && (
                                                        <Badge variant="secondary">Test Mode</Badge>
                                                    )}
                                                </div>

                                                {job.error_message && (
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                                            Error
                                                        </div>
                                                        <div className="text-sm text-red-600">
                                                            {job.error_message}
                                                        </div>
                                                    </div>
                                                )}

                                                {results[job.id] && results[job.id].length > 0 && (
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                                            Results ({results[job.id].length})
                                                        </div>
                                                        <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-48">
                                                            {JSON.stringify(results[job.id][0].data, null, 2)}
                                                        </pre>
                                                        {results[job.id][0].runner_name && (
                                                            <div className="text-xs text-muted-foreground mt-2">
                                                                Executed on: {results[job.id][0].runner_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {job.status === 'completed' &&
                                                    (!results[job.id] ||
                                                        results[job.id].length === 0) && (
                                                        <div className="text-sm text-muted-foreground">
                                                            No results data available.
                                                        </div>
                                                    )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

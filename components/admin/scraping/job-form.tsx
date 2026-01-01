'use client';

import { useState, useTransition } from 'react';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { startScrapeJob } from '@/app/admin/scraping/actions';

interface JobFormProps {
    disabled?: boolean;
    onJobCreated?: (jobId: string) => void;
}

export function JobForm({ disabled = false, onJobCreated }: JobFormProps) {
    const [skus, setSkus] = useState('');
    const [scrapers, setScrapers] = useState('');
    const [testMode, setTestMode] = useState(false);
    const [maxWorkers, setMaxWorkers] = useState(3);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        startTransition(async () => {
            const result = await startScrapeJob({
                skus: skus.trim() ? skus.split(',').map((s) => s.trim()) : undefined,
                scrapers: scrapers.trim() ? scrapers.split(',').map((s) => s.trim()) : undefined,
                testMode,
                maxWorkers,
            });

            if (result.success && result.jobId) {
                setFeedback({
                    type: 'success',
                    message: 'Scraping job has been queued and will run on the next available runner.',
                });
                setSkus('');
                setScrapers('');
                setTestMode(false);
                onJobCreated?.(result.jobId);
            } else {
                setFeedback({
                    type: 'error',
                    message: result.error || 'An unexpected error occurred',
                });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">New Scraping Job</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {feedback && (
                        <div
                            className={`flex items-center gap-2 p-3 rounded-md text-sm ${feedback.type === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                        >
                            {feedback.type === 'success' ? (
                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            ) : (
                                <XCircle className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span>{feedback.message}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="skus">SKUs (comma-separated)</Label>
                        <Input
                            id="skus"
                            type="text"
                            value={skus}
                            onChange={(e) => setSkus(e.target.value)}
                            placeholder="SKU001, SKU002, SKU003"
                            disabled={disabled || isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty to scrape all products
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="scrapers">Scrapers (comma-separated)</Label>
                        <Input
                            id="scrapers"
                            type="text"
                            value={scrapers}
                            onChange={(e) => setScrapers(e.target.value)}
                            placeholder="amazon, chewy, petsmart"
                            disabled={disabled || isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty to run all scrapers
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxWorkers">Max Workers</Label>
                            <Input
                                id="maxWorkers"
                                type="number"
                                min={1}
                                max={10}
                                value={maxWorkers}
                                onChange={(e) => setMaxWorkers(Number(e.target.value))}
                                disabled={disabled || isPending}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-6">
                            <Checkbox
                                id="testMode"
                                checked={testMode}
                                onCheckedChange={(checked) => setTestMode(checked === true)}
                                disabled={disabled || isPending}
                            />
                            <Label htmlFor="testMode" className="cursor-pointer">
                                Test Mode
                            </Label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={disabled || isPending}
                        className="w-full"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Starting...
                            </>
                        ) : disabled ? (
                            'Scraping Unavailable'
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Scraping
                            </>
                        )}
                    </Button>

                    {disabled && (
                        <p className="text-sm text-muted-foreground text-center">
                            No self-hosted runners are currently online.
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}

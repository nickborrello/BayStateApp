'use client';

import { useEffect, useState, useTransition } from 'react';
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRunnerStatus } from '@/app/admin/scraping/actions';
import type { RunnerStatus } from '@/lib/admin/scraping/github-client';

interface RunnerStatusCardProps {
    initialStatus: RunnerStatus | null;
    onStatusChange?: (available: boolean) => void;
}

export function RunnerStatusCard({
    initialStatus,
    onStatusChange,
}: RunnerStatusCardProps) {
    const [status, setStatus] = useState<RunnerStatus | null>(initialStatus);
    const [isPending, startTransition] = useTransition();
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const refresh = () => {
        startTransition(async () => {
            const newStatus = await getRunnerStatus();
            setStatus(newStatus);
            setLastUpdated(new Date());
            onStatusChange?.(newStatus?.available ?? false);
        });
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, []);

    const isAvailable = status?.available ?? false;

    return (
        <Card className={isAvailable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {isAvailable ? (
                            <Wifi className="h-5 w-5 text-green-600" />
                        ) : (
                            <WifiOff className="h-5 w-5 text-red-600" />
                        )}
                        Runner Status
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refresh}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {status === null ? (
                    <div className="text-sm text-muted-foreground">
                        Unable to fetch runner status. Check GitHub PAT configuration.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Badge variant={isAvailable ? 'default' : 'destructive'}>
                                    {status.onlineCount} Online
                                </Badge>
                                {status.offlineCount > 0 && (
                                    <Badge variant="secondary">
                                        {status.offlineCount} Offline
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {!isAvailable && (
                            <div className="text-sm text-red-700 font-medium">
                                ⚠️ Scraping is unavailable – no runners are online
                            </div>
                        )}

                        {status.runners.length > 0 && (
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                    Registered Runners
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {status.runners.map((runner) => (
                                        <Badge
                                            key={runner.id}
                                            variant={runner.status === 'online' ? 'outline' : 'secondary'}
                                            className={
                                                runner.status === 'online'
                                                    ? 'border-green-300 text-green-700'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {runner.name}
                                            {runner.busy && ' (busy)'}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

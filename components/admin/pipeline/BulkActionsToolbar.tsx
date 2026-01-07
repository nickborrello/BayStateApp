'use client';

import { Bot, Loader2, Sparkles } from 'lucide-react';
import type { PipelineStatus } from '@/lib/pipeline';

interface BulkActionsToolbarProps {
    selectedCount: number;
    currentStatus: PipelineStatus;
    onAction: (action: 'approve' | 'publish' | 'reject' | 'consolidate') => void;
    onScrape?: () => void;
    isScraping?: boolean;
    runnersAvailable?: boolean;
    onConsolidate?: () => void;
    isConsolidating?: boolean;
    onClearSelection: () => void;
}

const nextStatusMap: Record<PipelineStatus, { action: string; nextStatus: PipelineStatus }[]> = {
    staging: [],
    scraped: [
        { action: 'consolidate', nextStatus: 'consolidated' },
    ],
    consolidated: [
        { action: 'approve', nextStatus: 'approved' },
        { action: 'reject', nextStatus: 'staging' },
    ],
    approved: [
        { action: 'publish', nextStatus: 'published' },
        { action: 'reject', nextStatus: 'consolidated' },
    ],
    published: [],
};

const actionLabels: Record<string, string> = {
    consolidate: 'Prepare for Review',
    approve: 'Verify Data',
    publish: 'Make Live',
    reject: 'Move Back',
};

export function BulkActionsToolbar({
    selectedCount,
    currentStatus,
    onAction,
    onScrape,
    isScraping = false,
    runnersAvailable = false,
    onConsolidate,
    isConsolidating = false,
    onClearSelection,
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    const actions = nextStatusMap[currentStatus];
    const showScrapeButton = currentStatus === 'staging' && onScrape;

    const visibleActions = onConsolidate 
        ? actions.filter(a => a.action !== 'consolidate')
        : actions;

    const showConsolidateButton = onConsolidate && currentStatus === 'scraped';

    return (
        <div className="flex items-center gap-4 rounded-lg bg-gray-900 px-4 py-3 text-white">
            <span className="text-sm">
                {selectedCount} product{selectedCount > 1 ? 's' : ''} selected
            </span>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
                {showScrapeButton && (
                    <button
                        onClick={onScrape}
                        disabled={isScraping || !runnersAvailable || isConsolidating}
                        className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${runnersAvailable
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : 'bg-gray-600 cursor-not-allowed'
                            } disabled:opacity-50`}
                        title={!runnersAvailable ? 'No scraping runners available' : undefined}
                    >
                        {isScraping ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Bot className="h-4 w-4" />
                        )}
                        {isScraping ? 'Scraping...' : 'Enhance Data'}
                    </button>
                )}

                {showConsolidateButton && (
                    <button
                        onClick={onConsolidate}
                        disabled={isConsolidating || isScraping}
                        className="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isConsolidating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        {isConsolidating ? 'Consolidating...' : 'AI Consolidate'}
                    </button>
                )}

                {visibleActions.map(({ action }) => (
                    <button
                        key={action}
                        onClick={() => onAction(action as 'approve' | 'publish' | 'reject' | 'consolidate')}
                        disabled={isScraping || isConsolidating}
                        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${action === 'reject'
                            ? 'bg-red-600 hover:bg-red-700'
                            : action === 'publish'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {actionLabels[action] || action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                ))}

                <button
                    onClick={onClearSelection}
                    disabled={isScraping || isConsolidating}
                    className="rounded px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

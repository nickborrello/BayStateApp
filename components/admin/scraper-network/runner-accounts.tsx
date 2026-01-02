'use client';

import { useState, useEffect } from 'react';
import { Key, Trash2, Loader2, Plus, RefreshCw, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RunnerAccountModal } from './runner-account-modal';

interface RunnerAccount {
    name: string;
    status: 'online' | 'offline' | 'busy';
    last_seen_at: string | null;
    last_auth_at: string | null;
    has_credentials: boolean;
    current_job_id: string | null;
    created_at: string;
}

export function RunnerAccounts() {
    const [runners, setRunners] = useState<RunnerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchRunners = async (silent = false) => {
        try {
            if (!silent && runners.length === 0) setLoading(true);
            const res = await fetch('/api/admin/runners/accounts');
            if (!res.ok) throw new Error('Failed to fetch runners');
            const data = await res.json();
            setRunners(data.runners || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchRunners();
    }, [fetchRunners]);

    const handleDelete = async (runnerName: string) => {
        if (!confirm(`Remove credentials for ${runnerName}? The runner will no longer be able to authenticate.`)) {
            return;
        }

        setDeleting(runnerName);
        try {
            const res = await fetch(`/api/admin/runners/accounts?runner_name=${encodeURIComponent(runnerName)}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }

            toast.success(`Credentials removed for ${runnerName}`);
            fetchRunners();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete';
            toast.error(message);
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Runner Accounts</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchRunners()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => setShowModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Account
                    </Button>
                </div>
            </div>

            {runners.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <Key className="mx-auto h-12 w-12 text-gray-400" />
                    <h4 className="mt-4 text-lg font-medium text-gray-900">No Runner Accounts</h4>
                    <p className="mt-2 text-sm text-gray-500">
                        Create API keys to allow runners to authenticate.
                    </p>
                    <Button className="mt-4" onClick={() => setShowModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Account
                    </Button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Runner
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Last Auth
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Last Seen
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {runners.map((runner) => (
                                <tr key={runner.name} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {runner.has_credentials ? (
                                                <ShieldCheck className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <ShieldX className="h-5 w-5 text-gray-400" />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{runner.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    {runner.has_credentials ? 'API key configured' : 'No API key'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${runner.status === 'online'
                                                ? 'bg-green-100 text-green-800'
                                                : runner.status === 'busy'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {runner.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                        {formatDate(runner.last_auth_at)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                        {formatDate(runner.last_seen_at)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {runner.has_credentials && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(runner.name)}
                                                disabled={deleting === runner.name}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                {deleting === runner.name ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <RunnerAccountModal
                    onClose={() => setShowModal(false)}
                    onSave={() => fetchRunners(true)}
                />
            )}
        </div>
    );
}

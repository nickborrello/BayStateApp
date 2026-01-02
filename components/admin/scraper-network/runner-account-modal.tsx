'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Key, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RunnerAccountModalProps {
    onClose: () => void;
    onSave: () => void;
}

interface CreatedCredentials {
    runner_name: string;
    email: string;
    password: string;
}

export function RunnerAccountModal({ onClose, onSave }: RunnerAccountModalProps) {
    const [runnerName, setRunnerName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
    const [copied, setCopied] = useState<'email' | 'password' | 'all' | null>(null);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !credentials) {
                onClose();
            }
        },
        [onClose, credentials]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleCreate = async () => {
        if (!runnerName.trim()) {
            setError('Runner name is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/runners/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runner_name: runnerName.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create account');
            }

            setCredentials(data);
            onSave();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create account';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = async (text: string, field: 'email' | 'password' | 'all') => {
        await navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const copyAllCredentials = () => {
        if (!credentials) return;
        const text = `RUNNER_EMAIL=${credentials.email}\nRUNNER_PASSWORD=${credentials.password}`;
        copyToClipboard(text, 'all');
    };

    if (credentials) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <div className="flex items-center gap-3">
                            <Key className="h-6 w-6 text-green-600" />
                            <div>
                                <h2 className="text-lg font-semibold">Credentials Created</h2>
                                <p className="text-sm text-gray-500">{credentials.runner_name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                            <strong>Save these credentials now.</strong> The password cannot be retrieved again.
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="flex gap-2">
                                <Input value={credentials.email} readOnly className="font-mono text-sm" />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(credentials.email, 'email')}
                                >
                                    {copied === 'email' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Password</Label>
                            <div className="flex gap-2">
                                <Input value={credentials.password} readOnly className="font-mono text-sm" />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(credentials.password, 'password')}
                                >
                                    {copied === 'password' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full" onClick={copyAllCredentials}>
                            {copied === 'all' ? (
                                <>
                                    <Check className="mr-2 h-4 w-4 text-green-600" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy as Environment Variables
                                </>
                            )}
                        </Button>

                        <div className="pt-4 border-t space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900">Next Steps:</h4>
                            <ul className="text-sm text-gray-600 space-y-2 list-disc ml-5">
                                <li>Copy the credentials above and save them securely.</li>
                                <li>Update your runner's <code>.env</code> file or export them.</li>
                                <li>Restart your runner container.</li>
                                <li>The runner will appear as <strong>Online</strong> once it authenticates.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t bg-gray-50 px-6 py-4">
                        <Button className="w-full" onClick={onClose}>
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Key className="h-6 w-6 text-purple-600" />
                        <h2 className="text-lg font-semibold">Create Runner Account</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="runnerName">Runner Name *</Label>
                        <Input
                            id="runnerName"
                            value={runnerName}
                            onChange={(e) => setRunnerName(e.target.value)}
                            placeholder="e.g. home-server-1"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500">
                            Lowercase letters, numbers, and hyphens only. 3-50 characters.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={saving || !runnerName.trim()}>
                        <Key className="mr-2 h-4 w-4" />
                        {saving ? 'Creating...' : 'Generate Credentials'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncUploadedXmlAction } from '@/app/admin/migration/actions';
import { SyncResult } from '@/lib/admin/migration/types';

export function ManualXmlUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [syncType, setSyncType] = useState<'products' | 'orders' | 'customers'>('products');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SyncResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('xmlFile', file);
            formData.append('syncType', syncType);

            const res = await syncUploadedXmlAction(formData);
            setResult(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <FileUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <CardTitle>Manual XML Upload</CardTitle>
                        <CardDescription>
                            Import ShopSite data from a local XML file
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="syncType">Data Type</Label>
                        <Select
                            value={syncType}
                            onValueChange={(val: any) => setSyncType(val)}
                        >
                            <SelectTrigger id="syncType">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="products">Products</SelectItem>
                                <SelectItem value="orders">Orders</SelectItem>
                                <SelectItem value="customers">Customers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="xmlFile">XML File</Label>
                        <Input
                            id="xmlFile"
                            type="file"
                            accept=".xml,.dtd"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !file}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Upload and Sync'
                        )}
                    </Button>
                </form>

                {error && (
                    <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {result && (
                    <div className={`mt-4 p-3 rounded-md border flex flex-col gap-2 ${result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center gap-2">
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-yellow-800'}`}>
                                {result.success ? 'Sync Completed' : 'Sync Completed with Errors'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Processed:</span>
                                <span className="font-semibold">{result.processed}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created:</span>
                                <span className="font-semibold">{result.created}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Updated:</span>
                                <span className="font-semibold">{result.updated}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Failed:</span>
                                <span className="font-semibold text-red-600">{result.failed}</span>
                            </div>
                        </div>
                        {result.errors.length > 0 && (
                            <div className="mt-2 border-t pt-2">
                                <p className="text-xs font-semibold mb-1">Errors:</p>
                                <div className="max-h-24 overflow-y-auto space-y-1">
                                    {result.errors.slice(0, 5).map((err, idx) => (
                                        <p key={idx} className="text-[10px] text-red-700 leading-tight">
                                            {err.record}: {err.error}
                                        </p>
                                    ))}
                                    {result.errors.length > 5 && (
                                        <p className="text-[10px] text-muted-foreground italic">
                                            Showing 5 of {result.errors.length} errors...
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

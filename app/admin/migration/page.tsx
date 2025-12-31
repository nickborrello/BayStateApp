import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getCredentials, saveCredentialsAction, syncProductsFormAction, syncCustomersFormAction, syncOrdersFormAction } from './actions';

export default async function AdminMigrationPage() {
    const credentials = await getCredentials();
    const hasCredentials = credentials !== null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Data Migration</h1>
                <p className="text-muted-foreground">
                    Sync products, customers, and orders from ShopSite
                </p>
            </div>

            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${hasCredentials ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Database className={`h-5 w-5 ${hasCredentials ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                            <CardTitle>ShopSite Connection</CardTitle>
                            <CardDescription>
                                Configure your ShopSite API credentials for data synchronization
                            </CardDescription>
                        </div>
                        <Badge variant={hasCredentials ? 'default' : 'secondary'}>
                            {hasCredentials ? 'Configured' : 'Not Configured'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={saveCredentialsAction} className="space-y-6">
                        {/* Store URL */}
                        <div className="space-y-2">
                            <Label htmlFor="storeUrl">ShopSite Store URL</Label>
                            <Input
                                id="storeUrl"
                                name="storeUrl"
                                type="url"
                                defaultValue={credentials?.storeUrl || ''}
                                placeholder="https://yourstore.shopsite.com"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                The base URL of your ShopSite store
                            </p>
                        </div>

                        {/* Merchant ID */}
                        <div className="space-y-2">
                            <Label htmlFor="merchantId">Merchant ID</Label>
                            <Input
                                id="merchantId"
                                name="merchantId"
                                defaultValue={credentials?.merchantId || ''}
                                placeholder="Your ShopSite Merchant ID"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">API Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                defaultValue={credentials?.password || ''}
                                placeholder="Your ShopSite API password"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                This is stored securely and used for API authentication
                            </p>
                        </div>

                        <Button type="submit" size="lg">
                            Save Credentials
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Sync Operations - Coming Soon */}
            {hasCredentials && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <RefreshCw className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Sync Operations</CardTitle>
                                <CardDescription>
                                    Download and import data from your ShopSite store
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Products Sync */}
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">Products</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Import product catalog from ShopSite
                                </p>
                                <form action={syncProductsFormAction}>
                                    <Button type="submit" variant="default" size="sm">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Sync Now
                                    </Button>
                                </form>
                            </div>

                            {/* Customers Sync */}
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">Customers</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Import registered customers
                                </p>
                                <form action={syncCustomersFormAction}>
                                    <Button type="submit" variant="default" size="sm">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Sync Now
                                    </Button>
                                </form>
                            </div>

                            {/* Orders Sync */}
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">Orders</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Import historical orders
                                </p>
                                <form action={syncOrdersFormAction}>
                                    <Button type="submit" variant="default" size="sm">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Sync Now
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

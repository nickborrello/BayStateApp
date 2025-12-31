'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, Image, Star, Clock } from 'lucide-react';

export function HomepageTab() {
    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                            <Image className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <CardTitle>Hero Section</CardTitle>
                            <CardDescription>
                                Customize the main hero banner on the homepage
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Hero Customization Coming Soon</p>
                        <p className="text-sm">Upload hero images, set headlines, and customize CTAs</p>
                    </div>
                </CardContent>
            </Card>

            {/* Featured Products */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                            <Star className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <CardTitle>Featured Products</CardTitle>
                            <CardDescription>
                                Choose which products to highlight on the homepage
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Featured Products Coming Soon</p>
                        <p className="text-sm">Select and order featured products for the homepage</p>
                    </div>
                </CardContent>
            </Card>

            {/* Store Hours */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                            <Clock className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>Store Hours & Info</CardTitle>
                            <CardDescription>
                                Update store hours displayed on the homepage
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Store Hours Coming Soon</p>
                        <p className="text-sm">Set business hours, holiday schedules, and store announcements</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

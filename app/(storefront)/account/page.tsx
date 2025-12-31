import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/roles'
import { getFrequentlyBoughtProducts, getRecentOrders } from '@/lib/account/reorder'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BuyAgainSection } from '@/components/account/buy-again-section'
import Link from 'next/link'
import { Package, User, MapPin, Clock } from 'lucide-react'

export default async function AccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profile, frequentProducts, recentOrders] = await Promise.all([
        getProfile(user.id),
        getFrequentlyBoughtProducts(6),
        getRecentOrders(5)
    ])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {profile?.full_name || user.email}</p>
            </div>

            {/* Buy Again Section */}
            <BuyAgainSection products={frequentProducts} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Profile Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">Profile</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="grid gap-1">
                            <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                            <span>{profile?.full_name || 'Not provided'}</span>
                        </div>
                        <div className="grid gap-1">
                            <span className="text-sm font-medium text-muted-foreground">Email</span>
                            <span className="truncate">{user.email}</span>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/account/profile">Edit Profile</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Orders Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">Recent Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        {recentOrders.length > 0 ? (
                            <div className="space-y-3">
                                {recentOrders.slice(0, 3).map((order: any) => (
                                    <div key={order.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-medium">#{order.order_number}</span>
                                            <span className="text-muted-foreground ml-2">{order.status}</span>
                                        </div>
                                        <span>${Number(order.total).toFixed(2)}</span>
                                    </div>
                                ))}
                                <Button asChild variant="link" className="px-0">
                                    <Link href="/account/orders">View All Orders</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                <p>No orders yet</p>
                                <Button asChild variant="link" className="mt-2 text-primary">
                                    <Link href="/products">Start Shopping</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Addresses Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">Addresses</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-4">Manage your shipping and billing addresses.</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/account/addresses">Manage Addresses</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

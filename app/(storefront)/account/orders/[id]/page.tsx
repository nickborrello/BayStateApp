import { getOrderById } from '@/lib/orders'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"

interface Props {
    params: Promise<{
        id: string
    }>
}

export const metadata = {
    title: 'Order Details | Bay State Pet & Garden',
}

export default async function OrderDetailsPage({ params }: Props) {
    const { id } = await params
    const order = await getOrderById(id)

    if (!order) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/account/orders">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Orders</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Order #{order.order_number}</h1>
                    <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="ml-auto">
                    <Badge variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'cancelled' ? 'destructive' : 'secondary'
                    }>
                        {order.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                                        <div>
                                            <p className="font-medium">{item.item_name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium">${Number(item.total_price).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${Number(order.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span>${Number(order.tax).toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                                <span>Total</span>
                                <span>${Number(order.total).toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="grid gap-1">
                                <span className="font-medium">Contact Info</span>
                                <span className="text-muted-foreground">{order.customer_email}</span>
                                {order.customer_phone && <span className="text-muted-foreground">{order.customer_phone}</span>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

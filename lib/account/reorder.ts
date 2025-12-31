'use server'

import { createClient } from '@/lib/supabase/server'

export interface FrequentProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    order_count: number;
}

/**
 * Get products that the current user has ordered multiple times.
 * Returns products sorted by order frequency (most ordered first).
 */
export async function getFrequentlyBoughtProducts(limit = 6): Promise<FrequentProduct[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Query: Count how many times each product appears in user's orders
    // Join order_items -> orders -> products
    const { data, error } = await supabase
        .from('order_items')
        .select(`
            product_id,
            orders!inner (user_id),
            products!inner (id, name, slug, price, images)
        `)
        .eq('orders.user_id', user.id)

    if (error) {
        console.error('Error fetching order history:', error)
        return []
    }

    if (!data || data.length === 0) return []

    // Aggregate: Count occurrences per product
    const productCounts = new Map<string, { product: any; count: number }>()

    for (const item of data) {
        const product = item.products
        if (!product) continue

        const existing = productCounts.get(product.id)
        if (existing) {
            existing.count++
        } else {
            productCounts.set(product.id, { product, count: 1 })
        }
    }

    // Filter: Only products ordered more than once, sorted by frequency
    const frequentProducts = Array.from(productCounts.values())
        .filter(entry => entry.count > 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(entry => ({
            id: entry.product.id,
            name: entry.product.name,
            slug: entry.product.slug,
            price: entry.product.price,
            images: entry.product.images || [],
            order_count: entry.count
        }))

    return frequentProducts
}

/**
 * Get the user's most recent orders for display.
 */
export async function getRecentOrders(limit = 5) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching recent orders:', error)
        return []
    }

    return data || []
}

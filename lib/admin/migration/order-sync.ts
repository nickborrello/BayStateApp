/**
 * Order Synchronization Utilities
 * 
 * Handles transformation and sync of orders from ShopSite to Supabase.
 */

import { ShopSiteOrder, ShopSiteOrderItem } from './types';

/**
 * Transform a ShopSite order into the Supabase orders table format.
 */
export function transformShopSiteOrder(
    order: ShopSiteOrder,
    profileIdMap: Map<string, string>, // email -> profile id
    productIdMap: Map<string, string>  // sku -> product id
): {
    order: {
        legacy_order_number: string;
        user_id: string | null;
        status: string;
        subtotal: number;
        tax: number;
        shipping: number;
        total: number;
        created_at: string;
        is_legacy_import: boolean;
    };
    items: Array<{
        product_id: string | null;
        quantity: number;
        unit_price: number;
        legacy_sku: string;
    }>;
} {
    // Try to find the profile by email
    const userId = order.customerEmail
        ? profileIdMap.get(order.customerEmail.toLowerCase().trim()) || null
        : null;

    // Calculate subtotal (total - tax - shipping)
    const subtotal = order.grandTotal - order.tax - order.shippingTotal;

    // Transform order items
    const items = order.items.map((item: ShopSiteOrderItem) => ({
        product_id: productIdMap.get(item.sku) || null,
        quantity: item.quantity,
        unit_price: item.price,
        legacy_sku: item.sku,
    }));

    return {
        order: {
            legacy_order_number: order.orderNumber,
            user_id: userId,
            status: 'completed', // Historical orders are assumed completed
            subtotal: subtotal > 0 ? subtotal : 0,
            tax: order.tax,
            shipping: order.shippingTotal,
            total: order.grandTotal,
            created_at: order.orderDate || new Date().toISOString(),
            is_legacy_import: true,
        },
        items,
    };
}

/**
 * Batch orders into chunks for efficient processing.
 */
export function batchOrders<T>(orders: T[], batchSize: number = 50): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < orders.length; i += batchSize) {
        batches.push(orders.slice(i, i + batchSize));
    }
    return batches;
}

import { createClient } from '@/lib/supabase/server';
import { type CartItem } from '@/lib/cart-store';

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: 'product' | 'service';
  item_id: string;
  item_name: string;
  item_slug: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  items: CartItem[];
}

/**
 * Creates a new order in the database.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order | null> {
  const supabase = await createClient();

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0625; // 6.25% MA sales tax
  const total = subtotal + tax;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || null,
      notes: input.notes || null,
      subtotal,
      tax,
      total,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error('Error creating order:', orderError);
    return null;
  }

  // Create order items
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    item_type: item.id.startsWith('service-') ? 'service' : 'product',
    item_id: item.id.replace('service-', ''),
    item_name: item.name,
    item_slug: item.slug,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Order was created, but items failed - return order anyway
  }

  return order as Order;
}

/**
 * Fetches an order by ID.
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data as Order;
}

/**
 * Fetches an order by order number.
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('order_number', orderNumber)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data as Order;
}

/**
 * Fetches all orders with optional filtering.
 */
export async function getOrders(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; count: number }> {
  const supabase = await createClient();
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit && options.limit > 1000) {
    const finalLimit = options.limit;
    const initialOffset = options.offset || 0;
    let allData: Order[] = [];
    let currentOffset = initialOffset;
    const PAGE_SIZE = 1000;

    while (allData.length < finalLimit) {
      const remaining = finalLimit - allData.length;
      const currentLimit = Math.min(remaining, PAGE_SIZE);

      let batchQuery = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      if (options?.status) {
        batchQuery = batchQuery.eq('status', options.status);
      }

      batchQuery = batchQuery.order('created_at', { ascending: false });
      batchQuery = batchQuery.range(currentOffset, currentOffset + currentLimit - 1);

      const { data: batchData, error: batchError, count: batchCount } = await batchQuery;

      if (batchError) {
        console.error('Error fetching orders batch:', batchError);
        return { orders: allData, count: batchCount || allData.length };
      }

      if (!batchData || batchData.length === 0) {
        return { orders: allData, count: batchCount || allData.length };
      }

      allData.push(...(batchData as Order[]));
      currentOffset += batchData.length;

      if (batchData.length < currentLimit) {
        return { orders: allData, count: batchCount || allData.length };
      }
    }

    // Get the total count one last time if we didn't get it
    const { count: finalCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    return { orders: allData, count: finalCount || allData.length };
  }

  if (options?.limit) {
    const offset = options.offset || 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], count: 0 };
  }

  return { orders: data as Order[] || [], count: count || 0 };
}

/**
 * Updates order status.
 */
export async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }

  return true;
}

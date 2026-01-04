import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/admin/api-auth';

export interface AnalyticsData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  revenue: {
    total: number;
    orderCount: number;
    averageOrderValue: number;
  };
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

/**
 * GET /api/admin/analytics
 * Fetches analytics data with date range filtering.
 *
 * Query params:
 * - range: 'today' | '7days' | '30days' | 'custom'
 * - start: ISO date string (required for custom range)
 * - end: ISO date string (required for custom range)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const range = searchParams.get('range') || '7days';
  let startDate: Date;
  let endDate = new Date();
  let label = '';

  // Calculate date range
  const now = new Date();
  switch (range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      label = 'Today';
      break;
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = 'Last 7 days';
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = 'Last 30 days';
      break;
    case 'custom': {
      const customStart = searchParams.get('start');
      const customEnd = searchParams.get('end');
      if (!customStart || !customEnd) {
        return NextResponse.json(
          { error: 'start and end dates required for custom range' },
          { status: 400 }
        );
      }
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      label = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      break;
    }
    case 'all':
      startDate = new Date(0); // Epoch start
      label = 'All Time';
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = 'Last 7 days';
  }

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  try {
    // Fetch all orders in date range using pagination to bypass the 1000-row limit
    let allOrders: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('orders')
        .select('id, status, total, created_at')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (batchError) {
        console.error('Error fetching orders batch:', batchError);
        return NextResponse.json(
          { error: 'Failed to fetch orders' },
          { status: 500 }
        );
      }

      if (!batch || batch.length === 0) {
        hasMore = false;
      } else {
        allOrders.push(...batch);
        hasMore = batch.length === PAGE_SIZE;
        page++;
      }

      // Safety cap to avoid infinite loops or extreme memory usage
      if (allOrders.length >= 200000) break;
    }

    const ordersList = allOrders;
    const totalRevenue = ordersList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const orderCount = ordersList.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Group revenue by day
    const revenueByDayMap = new Map<string, { revenue: number; orders: number }>();

    // Initialize all days in range
    const currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const dateKey = currentDay.toISOString().split('T')[0];
      revenueByDayMap.set(dateKey, { revenue: 0, orders: 0 });
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Fill with actual data
    for (const order of ordersList) {
      const dateKey = new Date(order.created_at).toISOString().split('T')[0];
      const existing = revenueByDayMap.get(dateKey) || { revenue: 0, orders: 0 };
      revenueByDayMap.set(dateKey, {
        revenue: existing.revenue + (Number(order.total) || 0),
        orders: existing.orders + 1,
      });
    }

    const revenueByDay = Array.from(revenueByDayMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Orders by status
    const statusCounts = new Map<string, number>();
    for (const order of ordersList) {
      const status = order.status || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    }

    const ordersByStatus = Array.from(statusCounts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Fetch top products from order items
    const orderIds = ordersList.map((o) => o.id);
    let topProducts: AnalyticsData['topProducts'] = [];

    if (true) {
      let allItems: any[] = [];
      let itemPage = 0;
      const ITEM_PAGE_SIZE = 1000;
      let itemsHasMore = true;

      while (itemsHasMore) {
        const { data: itemBatch, error: itemError } = await supabase
          .from('order_items')
          .select('item_name, quantity, total_price, orders!inner(created_at)')
          .gte('orders.created_at', startIso)
          .lte('orders.created_at', endIso)
          .range(itemPage * ITEM_PAGE_SIZE, (itemPage + 1) * ITEM_PAGE_SIZE - 1);

        if (itemError) {
          console.error('Error fetching order items batch:', itemError);
          break; // Stop fetching but proceed with what we have
        }

        if (!itemBatch || itemBatch.length === 0) {
          itemsHasMore = false;
        } else {
          allItems.push(...itemBatch);
          itemsHasMore = itemBatch.length === ITEM_PAGE_SIZE;
          itemPage++;
        }

        // Safety cap for items
        if (allItems.length >= 500000) break;
      }

      if (allItems.length > 0) {
        const productMap = new Map<string, { quantity: number; revenue: number }>();

        for (const item of allItems) {
          const name = item.item_name || 'Unknown';
          const existing = productMap.get(name) || { quantity: 0, revenue: 0 };
          productMap.set(name, {
            quantity: existing.quantity + (Number(item.quantity) || 0),
            revenue: existing.revenue + (Number(item.total_price) || 0),
          });
        }

        topProducts = Array.from(productMap.entries())
          .map(([name, data]) => ({
            name,
            quantity: data.quantity,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
      }
    }

    const analyticsData: AnalyticsData = {
      period: {
        start: startIso,
        end: endIso,
        label,
      },
      revenue: {
        total: totalRevenue,
        orderCount,
        averageOrderValue,
      },
      revenueByDay,
      ordersByStatus,
      topProducts,
    };

    return NextResponse.json(analyticsData);
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

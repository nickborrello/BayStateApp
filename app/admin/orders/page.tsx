import { getOrders } from '@/lib/orders';
import { AdminOrdersClient } from '@/components/admin/orders/AdminOrdersClient';

export default async function AdminOrdersPage() {
  const { orders, count } = await getOrders({ limit: 500 });
  const ordersList = orders || [];

  return (
    <AdminOrdersClient
      initialOrders={ordersList}
      totalCount={count}
    />
  );
}

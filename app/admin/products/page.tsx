import { createClient } from '@/lib/supabase/server';
import { AdminProductsClient } from '@/components/admin/products/AdminProductsClient';
import { PublishedProduct } from '@/components/admin/products/ProductEditModal';

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  // Cast to PublishedProduct because we know the shape matches but types might be loose 
  // from the select('*')
  const clientProducts = (products || []) as unknown as PublishedProduct[];

  return (
    <AdminProductsClient
      initialProducts={clientProducts}
      totalCount={count || 0}
    />
  );
}


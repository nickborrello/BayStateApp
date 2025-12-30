import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Product detail page showing full product information.
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);

  const stockStatusLabel = {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    pre_order: 'Pre-Order',
  }[product.stock_status];

  const stockStatusColor = {
    in_stock: 'bg-green-100 text-green-800',
    out_of_stock: 'bg-red-100 text-red-800',
    pre_order: 'bg-blue-100 text-blue-800',
  }[product.stock_status];

  return (
    <div className="w-full px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                No image available
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-lg bg-zinc-100"
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {product.brand && (
            <Link
              href={`/products?brand=${product.brand.slug}`}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              {product.brand.name}
            </Link>
          )}

          <h1 className="text-3xl font-bold text-zinc-900">{product.name}</h1>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-zinc-900">
              {formattedPrice}
            </span>
            <Badge className={stockStatusColor}>{stockStatusLabel}</Badge>
          </div>

          {product.description && (
            <p className="text-zinc-600">{product.description}</p>
          )}

          {/* Add to Cart */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <AddToCartButton product={product} />
          </div>

          {/* Product Details */}
          <div className="border-t pt-6">
            <h2 className="mb-4 font-semibold text-zinc-900">Product Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">SKU</dt>
                <dd className="font-medium text-zinc-900">{product.slug}</dd>
              </div>
              {product.brand && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Brand</dt>
                  <dd className="font-medium text-zinc-900">{product.brand.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500">Availability</dt>
                <dd className="font-medium text-zinc-900">{stockStatusLabel}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

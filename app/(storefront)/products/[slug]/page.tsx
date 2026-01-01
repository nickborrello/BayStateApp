import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { type Metadata } from 'next';
import { getProductBySlug } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { ProductImageCarousel } from '@/components/storefront/product-image-carousel';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for SEO.
 */
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Bay State Pet & Garden',
    };
  }

  const description = product.description
    ? product.description.slice(0, 160)
    : `Shop ${product.name} at Bay State Pet & Garden Supply.`;

  return {
    title: `${product.name} | Bay State Pet & Garden`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
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
        <ProductImageCarousel
          images={product.images || []}
          productName={product.name}
        />

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

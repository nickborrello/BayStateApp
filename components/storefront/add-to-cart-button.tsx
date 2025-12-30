'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images?: string[];
    stock_status: 'in_stock' | 'out_of_stock' | 'pre_order';
  };
}

/**
 * AddToCartButton - Button to add products to cart with feedback.
 */
export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.images?.[0] || null,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (product.stock_status === 'out_of_stock') {
    return (
      <Button size="lg" className="h-14 flex-1 text-lg" disabled>
        Out of Stock
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="h-14 flex-1 text-lg"
      onClick={handleAddToCart}
      disabled={isAdded}
    >
      {isAdded ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          {product.stock_status === 'pre_order' ? 'Pre-Order Now' : 'Add to Cart'}
        </>
      )}
    </Button>
  );
}

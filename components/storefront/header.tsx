'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/components/storefront/search-provider';
import { useCartStore } from '@/lib/cart-store';
import { CartDrawer } from '@/components/storefront/cart-drawer';

import { User } from '@supabase/supabase-js';
import { UserMenu } from '@/components/auth/user-menu';

/**
 * StorefrontHeader - Main navigation header for the customer-facing storefront.
 * Features mobile-first design with 44px+ touch targets.
 */
export function StorefrontHeader({ user, userRole }: { user: User | null, userRole: string | null }) {
  const { openSearch } = useSearch();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="max-md:hidden sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-md border border-zinc-200 relative">
              <Image
                src="/icon.svg"
                alt="Bay State Pet & Garden Supply Logo"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight tracking-tight text-zinc-900">
                Bay State
              </span>
              <span className="hidden text-xs text-zinc-500 sm:inline leading-none">
                Pet & Garden Supply
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/products"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Products
            </Link>
            <Link
              href="/services"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Services
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              About
            </Link>
            {(userRole === 'admin' || userRole === 'staff') && (
              <Link
                href="/admin"
                className="text-sm font-medium text-red-600 transition-colors hover:text-red-900"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Action Buttons - 44px+ touch targets */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label="Search"
              onClick={openSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11"
              aria-label="Shopping cart"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                {itemCount}
              </span>
            </Button>

            {/* User Menu */}
            <UserMenu user={user} />

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 md:hidden"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

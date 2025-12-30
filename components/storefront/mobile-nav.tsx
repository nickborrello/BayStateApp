'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/categories', label: 'Browse', icon: Grid3X3 },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/account', label: 'Account', icon: User },
];

/**
 * MobileNav - Bottom navigation bar for mobile devices.
 * Features 44px+ touch targets for "barn-ready" usability.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-lg transition-colors',
                isActive
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}

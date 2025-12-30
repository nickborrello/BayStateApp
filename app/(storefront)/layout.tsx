import { StorefrontHeader } from '@/components/storefront/header';
import { StorefrontFooter } from '@/components/storefront/footer';
import { MobileNav } from '@/components/storefront/mobile-nav';

/**
 * StorefrontLayout - Layout wrapper for all customer-facing pages.
 * Includes header, footer, and mobile bottom navigation.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <StorefrontFooter />
      <MobileNav />
    </div>
  );
}

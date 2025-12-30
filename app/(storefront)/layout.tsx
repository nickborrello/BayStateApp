import { StorefrontHeader } from '@/components/storefront/header';
import { StorefrontFooter } from '@/components/storefront/footer';
import { MobileNav } from '@/components/storefront/mobile-nav';
import { CampaignBanner } from '@/components/storefront/campaign-banner';
import { SearchProvider } from '@/components/storefront/search-provider';
import { StickyCart } from '@/components/storefront/sticky-cart';
import { getProducts, getActiveServices, getBrands } from '@/lib/data';

/**
 * StorefrontLayout - Layout wrapper for all customer-facing pages.
 * Includes header, footer, and mobile bottom navigation.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch search data for the command bar
  const [{ products }, services, brands] = await Promise.all([
    getProducts({ limit: 100 }),
    getActiveServices(),
    getBrands(),
  ]);

  return (
    <SearchProvider initialData={{ products, services, brands }}>
      <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
        <CampaignBanner
          message="🌱 Spring Garden Sale — Save 20% on all seeds and planters!"
          linkText="Shop Now"
          linkHref="/products?category=garden"
          variant="seasonal"
        />
        <StorefrontHeader />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <StorefrontFooter />
        <StickyCart />
        <MobileNav />
      </div>
    </SearchProvider>
  );
}

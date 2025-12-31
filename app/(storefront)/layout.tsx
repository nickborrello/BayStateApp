import { StorefrontHeader } from '@/components/storefront/header';
import { StorefrontFooter } from '@/components/storefront/footer';
import { MobileNav } from '@/components/storefront/mobile-nav';
import { CampaignBanner } from '@/components/storefront/campaign-banner';
import { SearchProvider } from '@/components/storefront/search-provider';
import { StickyCart } from '@/components/storefront/sticky-cart';
import { getProducts, getActiveServices, getBrands } from '@/lib/data';
import { getCampaignBanner } from '@/lib/settings';

import { createClient } from '@/lib/supabase/server';

/**
 * StorefrontLayout - Layout wrapper for all customer-facing pages.
 * Includes header, footer, and mobile bottom navigation.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Fetch search data, campaign settings, and user session
  const [{ data: { user } }, { products }, services, brands, campaignBanner] = await Promise.all([
    supabase.auth.getUser(),
    getProducts({ limit: 100 }),
    getActiveServices(),
    getBrands(),
    getCampaignBanner(),
  ]);

  // JSON-LD structured data for local business
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Bay State Pet & Garden Supply',
    description: 'Your local source for pet supplies, garden tools, and farm products.',
    url: 'https://baystatepetgarden.com',
    telephone: '+1-555-123-4567',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Main Street',
      addressLocality: 'Anytown',
      addressRegion: 'MA',
      postalCode: '01234',
      addressCountry: 'US',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '17:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
  };

  return (
    <SearchProvider initialData={{ products, services, brands }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col w-full">
        {campaignBanner.enabled && campaignBanner.messages.length > 0 && (
          <CampaignBanner
            messages={campaignBanner.messages}
            variant={campaignBanner.variant}
            cycleInterval={campaignBanner.cycleInterval}
          />
        )}
        <StorefrontHeader user={user} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <StorefrontFooter />
        <StickyCart />
        <MobileNav />
      </div>
    </SearchProvider>
  );
}

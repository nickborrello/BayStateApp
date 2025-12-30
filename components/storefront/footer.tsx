import Link from 'next/link';

/**
 * StorefrontFooter - Footer for the customer-facing storefront.
 * Contains store info, contact details, and useful links.
 */
export function StorefrontFooter() {
  return (
    <footer className="border-t bg-zinc-50">
      <div className="container px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Store Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-zinc-900">
              Bay State Pet & Garden
            </h3>
            <p className="text-sm text-zinc-600">
              Your local source for pet supplies, garden tools, and farm
              products.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/brands"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Brands
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Services
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/services/propane"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Propane Refill
                </Link>
              </li>
              <li>
                <Link
                  href="/services/knife-sharpening"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Knife Sharpening
                </Link>
              </li>
              <li>
                <Link
                  href="/services/rentals"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Equipment Rentals
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li>123 Main Street</li>
              <li>Anytown, MA 01234</li>
              <li>
                <a href="tel:+15551234567" className="hover:text-zinc-900">
                  (555) 123-4567
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t pt-8 text-center text-sm text-zinc-500">
          <p>
            © {new Date().getFullYear()} Bay State Pet & Garden Supply. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

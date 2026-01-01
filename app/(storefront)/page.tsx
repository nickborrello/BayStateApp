import { ArrowRight, Leaf, Dog, Flame } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeaturedProducts } from '@/components/storefront/featured-products';
import { PetRecommendations } from '@/components/storefront/pet-recommendations';
import { getFeaturedProducts } from '@/lib/data';

/**
 * Homepage - Main landing page for Bay State Pet & Garden Supply.
 * Features a bento-grid layout with category highlights and value proposition.
 */
export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(6);

  return (
    <div className="w-full max-w-none px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Bay State Pet & Garden
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600">
          Your local source for pet supplies, garden tools, and farm products.
          Quality brands, expert advice, and neighborly service since 1985.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button size="lg" className="h-12 px-8" asChild>
            <Link href="/products">
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8" asChild>
            <Link href="/services">Our Services</Link>
          </Button>
        </div>
      </section>

      {/* Bento Grid Categories */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-zinc-900">
          Shop by Category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Pet Supplies - Large Card */}
          <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex h-full min-h-[280px] flex-col items-center justify-between p-6">
              <div className="mb-4 rounded-full bg-amber-100 p-4 flex items-center justify-center w-12 h-12 flex-none">
                <Dog className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-900">
                Pet Supplies
              </h3>
              <p className="mb-4 text-center text-sm text-zinc-600">
                Food, treats, toys, and essentials.
              </p>
              <Button variant="ghost" className="group-hover:bg-zinc-100">
                Browse Pets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Garden Tools */}
          <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex h-full min-h-[280px] flex-col items-center justify-between p-6">
              <div className="mb-3 rounded-full bg-green-100 p-3 flex items-center justify-center w-12 h-12 flex-none">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-zinc-900">
                Garden & Lawn
              </h3>
              <p className="text-center text-sm text-zinc-600">
                Tools, seeds, and supplies
              </p>
              <Button variant="ghost" className="group-hover:bg-zinc-100">
                Browse Garden
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Propane & Grilling */}
          <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex h-full min-h-[280px] flex-col items-center justify-between p-6">
              <div className="mb-3 rounded-full bg-orange-100 p-3 flex items-center justify-center w-12 h-12 flex-none">
                <Flame className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-zinc-900">
                Propane & Grilling
              </h3>
              <p className="text-center text-sm text-zinc-600">
                Tanks, refills, and accessories
              </p>
              <Button variant="ghost" className="group-hover:bg-zinc-100">
                Browse Propane
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Personalized Pet Recommendations (for logged-in users with pets) */}
      <PetRecommendations />

      {/* Featured Products */}
      <FeaturedProducts products={featuredProducts} />

      {/* Services Callout */}
      <section className="rounded-xl bg-zinc-900 p-8 text-center text-white">
        <h2 className="mb-4 text-2xl font-semibold">Local Services</h2>
        <p className="mx-auto mb-6 max-w-xl text-zinc-300">
          Propane refills, equipment rentals, and more.
          Stop by or reserve online.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="h-12 px-8"
          asChild
        >
          <Link href="/services">View All Services</Link>
        </Button>
      </section>
    </div>
  );
}

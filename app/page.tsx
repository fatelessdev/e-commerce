import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { Hero } from "@/components/features/hero";
import { ComboSection } from "@/components/features/combo-section";
import { Dec2024GalleryBand } from "@/components/features/dec2024-gallery-band";
import { ProductGrid } from "@/components/features/product-grid";
import { RealReviews } from "@/components/features/real-reviews";
import { DirectionalMarquee } from "@/components/effects/directional-marquee";
import { getActiveCombosWithProducts } from "@/lib/combos";
import { getCatalogProducts } from "@/lib/product-catalog";
import {
  JsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/components/seo/structured-data";
import { normalizeSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const ShopTheReels = nextDynamic(() =>
  import("@/components/features/shop-the-reels").then((mod) => mod.ShopTheReels),
  {
    loading: () => (
      <section className="min-h-[560px] border-t border-border/60 bg-background px-6 py-16 md:min-h-[650px] md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto h-8 w-64 animate-pulse bg-muted" />
          <div className="mt-10 flex gap-4 overflow-hidden">
            {[0, 1, 2].map((item) => (
              <div key={item} className="aspect-[9/16] w-[245px] flex-none animate-pulse bg-muted md:w-[260px]" />
            ))}
          </div>
        </div>
      </section>
    ),
  }
);

export const metadata: Metadata = {
  title: "Home | Premium Streetwear for Gen-Z",
  description:
    "Shop next-gen streetwear essentials, premium basics, oversized tees, cargos, and bold drops from XILAR. Free shipping above ₹999.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "XILAR | The Future Wear — Premium Streetwear India",
    description:
      "Shop next-gen streetwear essentials, premium basics, oversized tees, cargos, and bold drops from XILAR. Free shipping above ₹999.",
    url: "/",
  },
};

function HomeSectionsFallback() {
  return (
    <div aria-hidden="true">
      <section className="bg-background px-6 py-16 md:px-12 md:py-24">
        <div className="flex flex-col items-center mb-10 md:mb-14">
          <div className="h-12 w-56 animate-pulse bg-muted md:h-16 md:w-72" />
          <div className="mt-8 flex items-center gap-8">
            <div className="h-4 w-20 animate-pulse bg-muted" />
            <div className="h-4 w-20 animate-pulse bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="space-y-3">
              <div className="aspect-[3/4] animate-pulse bg-muted" />
              <div className="space-y-2 px-1">
                <div className="h-3 w-3/4 animate-pulse bg-muted" />
                <div className="h-3 w-1/2 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-background px-6 py-16 md:px-12 md:py-24">
        <div className="mb-8 flex flex-col items-center md:mb-12">
          <div className="h-3 w-28 animate-pulse bg-muted" />
          <div className="mt-4 h-12 w-44 animate-pulse bg-muted md:h-16 md:w-56" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="border border-border/60 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-[3/4] animate-pulse bg-muted" />
                <div className="aspect-[3/4] animate-pulse bg-muted" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-2/3 animate-pulse bg-muted" />
                <div className="h-3 w-1/2 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function HomeMerchandisingSections() {
  const [{ products }, combos] = await Promise.all([
    getCatalogProducts(),
    getActiveCombosWithProducts(4),
  ]);
  const galleryBandItems = products.flatMap((product) =>
    product.images.slice(0, 1).map((image) => ({
      src: image,
      alt: product.name,
    })),
  );

  return (
    <>
      <ProductGrid title="Best Sellers" isFeatured initialProducts={products} />
      <ComboSection limit={4} interactive={false} mobileLimit={3} initialCombos={combos} />
      <ProductGrid title="New Arrivals" isNew viewAllHref="/new" viewAllLabel="Shop all new arrivals" initialProducts={products} />
      <ProductGrid
        title="Premium"
        isPremium
        viewAllHref="/collections/premium"
        viewAllLabel="Explore premium collection"
        initialProducts={products}
        hideWhenEmpty
      />
      <DirectionalMarquee />
      <ShopTheReels />
      <ProductGrid title="Accessories" fixedCategory="accessory" viewAllHref="/shop/accessories" initialProducts={products} />
      <Dec2024GalleryBand items={galleryBandItems} />
      <RealReviews />
    </>
  );
}

export default function Home() {
  const baseUrl = normalizeSiteUrl();

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [organizationJsonLd(baseUrl), webSiteJsonLd(baseUrl)],
        }}
      />
      <Hero />
      <Suspense fallback={<HomeSectionsFallback />}>
        <HomeMerchandisingSections />
      </Suspense>
    </div>
  );
}

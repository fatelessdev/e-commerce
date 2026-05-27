import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero } from "@/components/features/hero";
import { ComboSection } from "@/components/features/combo-section";
import { ProductGrid } from "@/components/features/product-grid";
import { RealReviews } from "@/components/features/real-reviews";
import { getActiveCombosWithProducts } from "@/lib/combos";
import { getCatalogProducts } from "@/lib/product-catalog";
import {
  JsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/components/seo/structured-data";

const ShopTheReels = dynamic(() =>
  import("@/components/features/shop-the-reels").then((mod) => mod.ShopTheReels),
  {
    loading: () => (
      <section className="border-t border-border/60 bg-background px-6 py-16 md:px-12 md:py-24">
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

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [{ products }, combos] = await Promise.all([
    getCatalogProducts(),
    getActiveCombosWithProducts(4),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [organizationJsonLd(baseUrl), webSiteJsonLd(baseUrl)],
        }}
      />
      <Hero />
      <ProductGrid title="Best Sellers" isFeatured initialProducts={products} />
      <ComboSection limit={4} interactive={false} mobileLimit={3} initialCombos={combos} />
      <ProductGrid title="New Arrivals" isNew initialProducts={products} />
      <ShopTheReels />
      <ProductGrid title="Accessories" fixedCategory="accessory" viewAllHref="/shop/accessories" initialProducts={products} />
      <RealReviews />
    </div>
  );
}

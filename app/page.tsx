import type { Metadata } from "next";
import { Hero } from "@/components/features/hero";
import { ComboSection } from "@/components/features/combo-section";
import { ProductGrid } from "@/components/features/product-grid";
import { ShopTheReels } from "@/components/features/shop-the-reels";
import { RealReviews } from "@/components/features/real-reviews";
import {
  JsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/components/seo/structured-data";

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

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [organizationJsonLd(baseUrl), webSiteJsonLd(baseUrl)],
        }}
      />
      <Hero />
      <ProductGrid title="Best Sellers" isFeatured />
      <ComboSection limit={4} interactive={false} mobileLimit={3} />
      <ProductGrid title="New Arrivals" isNew />
      <ShopTheReels />
      <ProductGrid title="Accessories" fixedCategory="accessory" viewAllHref="/shop/accessories" />
      <RealReviews />
    </div>
  );
}

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { buildGoogleMerchantFeed } from "@/lib/seo-merchant-feed";
import { normalizeSiteUrl } from "@/lib/seo";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      images: products.images,
      sellingPrice: products.sellingPrice,
      mrp: products.mrp,
      stock: products.stock,
      category: products.category,
      gender: products.gender,
    })
    .from(products)
    .where(eq(products.isActive, true));

  return new Response(
    buildGoogleMerchantFeed({
      baseUrl: normalizeSiteUrl(),
      products: rows,
    }),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
        "X-Robots-Tag": "noindex, follow",
      },
    }
  );
}

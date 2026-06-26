import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { buildAbsoluteUrl, buildProductPath, CATEGORY_SEO, normalizeSiteUrl } from "@/lib/seo";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = normalizeSiteUrl();
  const staticModified = new Date("2026-06-01T00:00:00.000Z");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: buildAbsoluteUrl("/", baseUrl),
      lastModified: staticModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: buildAbsoluteUrl("/shop", baseUrl),
      lastModified: staticModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: buildAbsoluteUrl("/shop/men", baseUrl),
      lastModified: staticModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl("/shop/women", baseUrl),
      lastModified: staticModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl("/new", baseUrl),
      lastModified: staticModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl("/collections/premium", baseUrl),
      lastModified: staticModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl("/gallery", baseUrl),
      lastModified: staticModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl("/collections/summer-26", baseUrl),
      lastModified: staticModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl("/about", baseUrl),
      lastModified: staticModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: buildAbsoluteUrl("/policies", baseUrl),
      lastModified: staticModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: buildAbsoluteUrl("/policies/exchange", baseUrl),
      lastModified: staticModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: buildAbsoluteUrl("/policies/returns", baseUrl),
      lastModified: staticModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: buildAbsoluteUrl("/policies/refunds", baseUrl),
      lastModified: staticModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: buildAbsoluteUrl("/policies/shipping", baseUrl),
      lastModified: staticModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_SEO.map((category) => ({
    url: buildAbsoluteUrl(`/shop/${category.slug}`, baseUrl),
    lastModified: staticModified,
    changeFrequency: "weekly",
    priority: category.category === "accessory" ? 0.6 : 0.75,
  }));

  let productRows: Array<{ slug: string; updatedAt: Date | null }> = [];

  try {
    productRows = await db
      .select({
        slug: products.slug,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.isActive, true));
  } catch {
    return [...staticRoutes, ...categoryRoutes];
  }

  const productRoutes: MetadataRoute.Sitemap = productRows.map((product) => ({
    url: buildAbsoluteUrl(buildProductPath(product.slug), baseUrl),
    lastModified: product.updatedAt ?? staticModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

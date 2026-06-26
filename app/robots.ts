import type { MetadataRoute } from "next";
import { normalizeSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = normalizeSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/checkout",
          "/orders",
          "/wishlist",
          "/unsubscribe",
          "/unsubscribe/*",
          "/api/",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/products", "/api/products/*", "/api/auth/get-session"],
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/checkout",
          "/orders",
          "/wishlist",
          "/api/",
          "/api/auth/*",
          "/api/coupons/*",
          "/api/orders/*",
          "/api/razorpay/*",
          "/api/upload/*",
          "/api/bargain/*",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

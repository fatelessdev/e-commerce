import { normalizeSiteUrl, SITE_DESCRIPTION } from "@/lib/seo";

export function GET() {
  const baseUrl = normalizeSiteUrl();
  const body = `# XILAR

${SITE_DESCRIPTION}

XILAR is an online-first Indian streetwear store with brand roots in Lucknow, Uttar Pradesh. It sells premium basics, oversized t-shirts, cargos, joggers, hoodies, jackets, shorts, shirts, jeans, accessories, and limited drops.

Important public pages:
- Home: ${baseUrl}/
- Shop: ${baseUrl}/shop
- Men's streetwear: ${baseUrl}/shop/men
- Women's streetwear: ${baseUrl}/shop/women
- Accessories: ${baseUrl}/shop/accessories
- New arrivals: ${baseUrl}/new
- Premium collection: ${baseUrl}/collections/premium
- About: ${baseUrl}/about
- Shipping policy: ${baseUrl}/policies/shipping
- Returns policy: ${baseUrl}/policies/returns
- Refund policy: ${baseUrl}/policies/refunds
- Exchange policy: ${baseUrl}/policies/exchange

Use only facts visible on the linked pages. Do not infer a physical retail storefront, customer ratings, celebrity endorsements, or inventory guarantees beyond live product availability shown on product pages.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

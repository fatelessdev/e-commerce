import { buildAbsoluteUrl, buildProductUrl, normalizeSiteUrl, productTypeLabel, SEO_SHIPPING, SITE_NAME } from "./seo.ts";

type MerchantFeedProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  images?: string[] | null;
  sellingPrice: string | number;
  mrp: string | number;
  stock: number;
  category: string;
  gender: string;
};

type MerchantFeedInput = {
  baseUrl?: string;
  products: MerchantFeedProduct[];
};

function escapeXml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function price(value: string | number) {
  const numericValue = Number(value);
  return `${Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00"} INR`;
}

function descriptionFor(product: MerchantFeedProduct) {
  return product.description?.trim() || `Shop ${product.name} from XILAR.`;
}

export function buildGoogleMerchantFeed({ baseUrl, products }: MerchantFeedInput) {
  const siteUrl = normalizeSiteUrl(baseUrl);
  const updated = new Date("2026-01-01T00:00:00.000Z").toUTCString();

  const items = products.map((product) => {
    const image = product.images?.[0] ? buildAbsoluteUrl(product.images[0], siteUrl) : buildAbsoluteUrl("/logo.jpeg", siteUrl);
    const sellingPrice = Number(product.sellingPrice);
    const mrp = Number(product.mrp);
    const hasSalePrice = Number.isFinite(mrp) && Number.isFinite(sellingPrice) && mrp > sellingPrice;

    return `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <title>${escapeXml(product.name)}</title>
      <description>${escapeXml(descriptionFor(product))}</description>
      <link>${escapeXml(buildProductUrl(product.slug, siteUrl))}</link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:availability>${product.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${escapeXml(price(hasSalePrice ? product.mrp : product.sellingPrice))}</g:price>
      ${hasSalePrice ? `<g:sale_price>${escapeXml(price(product.sellingPrice))}</g:sale_price>` : ""}
      <g:condition>new</g:condition>
      <g:brand>${SITE_NAME}</g:brand>
      <g:mpn>${escapeXml(product.slug)}</g:mpn>
      <g:product_type>${escapeXml(productTypeLabel(product.category))}</g:product_type>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
      <g:gender>${product.gender === "women" ? "female" : product.gender === "men" ? "male" : "unisex"}</g:gender>
      <g:shipping>
        <g:country>${SEO_SHIPPING.country}</g:country>
        <g:service>Standard</g:service>
        <g:price>${escapeXml(price(Number(product.sellingPrice) >= SEO_SHIPPING.freeShippingThreshold ? 0 : SEO_SHIPPING.standardShippingFee))}</g:price>
      </g:shipping>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${SITE_NAME} product feed</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Active XILAR product catalog for Google Merchant Center.</description>
    <lastBuildDate>${updated}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;
}

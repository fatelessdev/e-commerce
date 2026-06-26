import type { Metadata } from "next";
import { GalleryClient, type XilarGalleryItem } from "@/components/features/gallery-client";
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data";
import { getCatalogProducts } from "@/lib/product-catalog";
import { normalizeProductImage } from "@/lib/image";
import { buildProductPath, normalizeSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Gallery — XILAR Product Field",
  description:
    "Visual drop of XILAR products. Explore oversized streetwear basics, cargos, joggers, and accessories in Lucknow.",
  alternates: {
    canonical: "/gallery",
  },
};

export default async function GalleryPage() {
  const baseUrl = normalizeSiteUrl();
  const { products } = await getCatalogProducts({ limit: 24 });
  const galleryItems: XilarGalleryItem[] = products.map((product) => ({
    id: product.id,
    title: product.name,
    src: normalizeProductImage(product.images[0]),
    href: buildProductPath(product.slug),
    price: product.sellingPrice,
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(baseUrl, [
          { name: "Home", url: "/" },
          { name: "Gallery", url: "/gallery" },
        ])}
      />
      <JsonLd
        data={collectionJsonLd(baseUrl, {
          name: "Gallery — XILAR Product Field",
          description: "Visual lookbook and catalog grid of active products from XILAR.",
          url: "/gallery",
          products: products.map((product) => ({
            name: product.name,
            slug: product.slug,
            image: product.images[0],
            sellingPrice: product.sellingPrice,
          })),
        })}
      />
      <GalleryClient items={galleryItems} />
    </>
  );
}

import type { Metadata } from "next";
import { GalleryClient, type XilarGalleryItem } from "@/components/features/gallery-client";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data";
import { getCatalogProducts } from "@/lib/product-catalog";
import { normalizeProductImage } from "@/lib/image";

export const metadata: Metadata = {
  title: "Gallery — XILAR Product Field",
  description: "Explore XILAR drops in a draggable live product gallery built from current catalog imagery.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Gallery — XILAR Product Field",
    description: "Explore XILAR drops in a draggable live product gallery built from current catalog imagery.",
    url: "/gallery",
  },
};

export default async function GalleryPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { products } = await getCatalogProducts({ limit: 24 });
  const galleryItems: XilarGalleryItem[] = products.map((product) => ({
    id: product.id,
    title: product.name,
    src: normalizeProductImage(product.images[0]),
    href: `/product/${product.id}`,
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
      <GalleryClient items={galleryItems} />
    </>
  );
}

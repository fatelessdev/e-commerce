import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  catalog: "catalog",
  products: "products",
  combos: "combos",
  product: (id: string) => `product:${id}`,
  combo: (id: string) => `combo:${id}`,
};

export function revalidateCatalogSurfaces() {
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidateTag(CACHE_TAGS.products, "max");
}

export function revalidateProductSurfaces(productId?: string) {
  revalidateCatalogSurfaces();
  revalidateTag(CACHE_TAGS.combos, "max");

  if (productId) {
    revalidateTag(CACHE_TAGS.product(productId), "max");
  }
}

export function revalidateComboSurfaces(comboId?: string) {
  revalidateTag(CACHE_TAGS.combos, "max");

  if (comboId) {
    revalidateTag(CACHE_TAGS.combo(comboId), "max");
  }
}

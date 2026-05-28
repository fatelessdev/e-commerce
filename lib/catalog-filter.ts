import type { CatalogProduct } from "@/lib/product-catalog";

export type CatalogFilterOptions = {
  gender?: "men" | "women" | "unisex" | "all";
  fixedCategory?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  limit?: number;
};

export function productMatchesGender(
  product: Pick<CatalogProduct, "gender">,
  gender?: "men" | "women" | "unisex" | "all",
) {
  if (!gender || gender === "all") return true;
  return product.gender === gender || product.gender === "unisex";
}

export function filterCatalogProducts(
  products: CatalogProduct[],
  {
    gender,
    fixedCategory,
    isFeatured,
    isNew,
    isPremium,
    limit = 8,
  }: CatalogFilterOptions,
) {
  return products
    .filter((product) => productMatchesGender(product, gender))
    .filter((product) => !fixedCategory || product.category === fixedCategory)
    .filter((product) => !isFeatured || product.isFeatured)
    .filter((product) => !isNew || product.isNew)
    .filter((product) => !isPremium || product.isPremium)
    .slice(0, limit);
}

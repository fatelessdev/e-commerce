import { buildProductPath } from "./seo.ts";

const PUBLIC_PRODUCT_MUTATION_PATHS = [
  "/",
  "/shop",
  "/shop/men",
  "/shop/women",
  "/shop/accessories",
  "/new",
  "/collections/premium",
  "/collections/summer-26",
  "/gallery",
  "/sitemap.xml",
  "/feeds/google-merchant.xml",
] as const;

const PUBLIC_COMBO_MUTATION_PATHS = [
  "/",
  "/shop/men",
  "/shop/women",
] as const;

function uniquePaths(paths: string[]) {
  return Array.from(new Set(paths));
}

export function getPublicProductMutationPaths({
  nextSlug,
  previousSlug,
}: {
  nextSlug?: string | null;
  previousSlug?: string | null;
}) {
  return uniquePaths([
    ...PUBLIC_PRODUCT_MUTATION_PATHS,
    ...(nextSlug ? [buildProductPath(nextSlug)] : []),
    ...(previousSlug ? [buildProductPath(previousSlug)] : []),
  ]);
}

export function getPublicComboMutationPaths(comboId?: string | null) {
  return uniquePaths([
    ...PUBLIC_COMBO_MUTATION_PATHS,
    ...(comboId ? [`/combo/${comboId}`] : []),
  ]);
}

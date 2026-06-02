import { createHash } from "node:crypto";

export const PRODUCT_SEARCH_EMBEDDING_MODEL = "gemini-embedding-001";
export const PRODUCT_SEARCH_EMBEDDING_DIMENSIONS = 1536;
export const PRODUCT_SEARCH_HASH_VERSION = "product-search-v1";

export type ProductSearchSource = {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  gender?: string | null;
  tags?: string[] | null;
  fabric?: string | null;
  careInstructions?: string[] | null;
  features?: string[] | null;
  sizes?: string[] | null;
  colors?: { name?: string | null; hex?: string | null; images?: string[] }[] | null;
};

function appendText(parts: string[], value: string | null | undefined) {
  const normalized = value?.trim();
  if (normalized) parts.push(normalized);
}

function appendTextList(parts: string[], values: string[] | null | undefined) {
  values?.forEach((value) => appendText(parts, value));
}

export function buildProductSearchText(product: ProductSearchSource) {
  const parts: string[] = [];

  appendText(parts, product.name);
  appendText(parts, product.description);
  appendText(parts, product.category);
  appendText(parts, product.gender);
  appendTextList(parts, product.tags);
  appendText(parts, product.fabric);
  appendTextList(parts, product.features);
  appendTextList(parts, product.careInstructions);
  appendTextList(parts, product.sizes);

  product.colors?.forEach((color) => {
    appendText(parts, color.name);
    appendText(parts, color.hex);
  });

  return parts.join("\n");
}

export function createProductSearchHash(searchText: string) {
  return createHash("sha256")
    .update(PRODUCT_SEARCH_HASH_VERSION)
    .update("\0")
    .update(PRODUCT_SEARCH_EMBEDDING_MODEL)
    .update("\0")
    .update(String(PRODUCT_SEARCH_EMBEDDING_DIMENSIONS))
    .update("\0")
    .update(searchText)
    .digest("hex");
}

export async function resolveProductSearchEmbedding({
  searchText,
  currentHash,
  currentEmbedding,
  embedSearchText,
}: {
  searchText: string;
  currentHash?: string | null;
  currentEmbedding?: number[] | null;
  embedSearchText: (searchText: string) => Promise<number[]>;
}) {
  const hash = createProductSearchHash(searchText);

  if (currentHash === hash && currentEmbedding && currentEmbedding.length > 0) {
    return {
      searchText,
      hash,
      embedding: currentEmbedding,
      replaced: false,
    };
  }

  return {
    searchText,
    hash,
    embedding: await embedSearchText(searchText),
    replaced: true,
  };
}

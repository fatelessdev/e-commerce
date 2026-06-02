import { createHash } from "node:crypto";

export const PRODUCT_SEARCH_EMBEDDING_MODEL = "gemini-embedding-2";
export const PRODUCT_SEARCH_EMBEDDING_DIMENSIONS = 1536;
export const PRODUCT_SEARCH_HASH_VERSION = "product-search-v2";
export const PRODUCT_SEARCH_TEXT_MAX_DISTANCE = 0.38;
export const PRODUCT_SEARCH_IMAGE_MAX_DISTANCE = 0.35;

export type ProductSearchSource = {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  gender?: string | null;
  tags?: string[] | null;
  fabric?: string | null;
  careInstructions?: string[] | null;
  features?: string[] | null;
  images?: string[] | null;
  sizes?: string[] | null;
  colors?: { name?: string | null; hex?: string | null; images?: string[] }[] | null;
};

export type ProductSearchImageRow = {
  imageUrl: string;
  imageIndex: number;
  imageEmbeddingHash?: string | null;
  imageEmbedding?: number[] | null;
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

export function prepareProductQueryEmbeddingInput(query: string) {
  return `task: search result | query: ${query.trim()}`;
}

export function prepareProductDocumentEmbeddingInput({
  title,
  searchText,
}: {
  title?: string | null;
  searchText: string;
}) {
  return `title: ${title?.trim() || "Untitled product"} | text: ${searchText}`;
}

export function createProductImageSearchHash(imageUrl: string) {
  return createHash("sha256")
    .update(`${PRODUCT_SEARCH_HASH_VERSION}:image`)
    .update("\0")
    .update(PRODUCT_SEARCH_EMBEDDING_MODEL)
    .update("\0")
    .update(String(PRODUCT_SEARCH_EMBEDDING_DIMENSIONS))
    .update("\0")
    .update(imageUrl.trim())
    .digest("hex");
}

function normalizeComparableText(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") || "";
}

function textListIncludes(values: string[] | null | undefined, query: string) {
  return Boolean(values?.some((value) => normalizeComparableText(value).includes(query)));
}

export function getLexicalMatchTier(query: string, product: ProductSearchSource) {
  const normalizedQuery = normalizeComparableText(query);
  if (!normalizedQuery) return null;

  const name = normalizeComparableText(product.name);
  if (name === normalizedQuery) return 1;
  if (name.startsWith(normalizedQuery)) return 2;
  if (name.includes(normalizedQuery)) return 3;
  if (textListIncludes(product.tags, normalizedQuery)) return 3;
  if (normalizeComparableText(product.category).includes(normalizedQuery)) return 3;
  if (normalizeComparableText(product.gender).includes(normalizedQuery)) return 3;
  if (normalizeComparableText(product.fabric).includes(normalizedQuery)) return 4;
  if (textListIncludes(product.features, normalizedQuery)) return 4;
  if (textListIncludes(product.careInstructions, normalizedQuery)) return 4;

  return null;
}

function semanticThreshold(kind: "text" | "image") {
  const envKey = kind === "text"
    ? process.env.PRODUCT_SEARCH_TEXT_MAX_DISTANCE
    : process.env.PRODUCT_SEARCH_IMAGE_MAX_DISTANCE;
  const parsed = Number(envKey);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 2) return parsed;
  return kind === "text" ? PRODUCT_SEARCH_TEXT_MAX_DISTANCE : PRODUCT_SEARCH_IMAGE_MAX_DISTANCE;
}

export function semanticDistanceWithinThreshold(distance: number, kind: "text" | "image") {
  return Number.isFinite(distance) && distance <= semanticThreshold(kind);
}

export function getProductSearchSemanticDistanceThresholds() {
  return {
    text: semanticThreshold("text"),
    image: semanticThreshold("image"),
  };
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

function normalizeImageUrls(images: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  images.forEach((image) => {
    const imageUrl = image.trim();
    if (!imageUrl || seen.has(imageUrl)) return;
    seen.add(imageUrl);
    normalized.push(imageUrl);
  });

  return normalized;
}

export async function resolveProductSearchImageEmbeddings({
  images,
  currentRows = [],
  embedImage,
}: {
  images: string[];
  currentRows?: ProductSearchImageRow[];
  embedImage: (imageUrl: string) => Promise<number[]>;
}) {
  const nextImages = normalizeImageUrls(images);
  const currentByUrl = new Map(currentRows.map((row) => [row.imageUrl, row]));
  const nextImageSet = new Set(nextImages);

  const upserts = await Promise.all(
    nextImages.map(async (imageUrl, imageIndex) => {
      const current = currentByUrl.get(imageUrl);
      const imageEmbeddingHash = createProductImageSearchHash(imageUrl);

      if (
        current?.imageEmbeddingHash === imageEmbeddingHash &&
        current.imageEmbedding &&
        current.imageEmbedding.length > 0
      ) {
        return {
          imageUrl,
          imageIndex,
          imageEmbeddingHash,
          imageEmbedding: current.imageEmbedding,
          replaced: false,
        };
      }

      return {
        imageUrl,
        imageIndex,
        imageEmbeddingHash,
        imageEmbedding: await embedImage(imageUrl),
        replaced: true,
      };
    }),
  );

  return {
    upserts,
    deleteImageUrls: currentRows
      .map((row) => row.imageUrl)
      .filter((imageUrl) => !nextImageSet.has(imageUrl)),
  };
}

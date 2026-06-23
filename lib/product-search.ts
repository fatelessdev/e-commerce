import { createHash } from "node:crypto";

export const PRODUCT_SEARCH_EMBEDDING_MODEL = "gemini-embedding-2";
export const PRODUCT_SEARCH_EMBEDDING_DIMENSIONS = 1536;
export const PRODUCT_SEARCH_HASH_VERSION = "product-search-pinecone-v1";
export const PRODUCT_SEARCH_TEXT_MIN_SCORE = 0.62;
export const PRODUCT_SEARCH_IMAGE_MIN_SCORE = 0.65;

export type ProductSearchSource = {
  id?: string | null;
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
  isActive?: boolean | null;
  isNew?: boolean | null;
  isFeatured?: boolean | null;
  isPremium?: boolean | null;
  stock?: number | null;
  sellingPrice?: string | null;
};

export type PineconeSearchKind = "text" | "image";

export type ProductSearchVectorMetadata = {
  productId: string;
  kind: PineconeSearchKind;
  hash: string;
  model: string;
  dimension: number;
  name: string;
  category: string;
  gender: string;
  isActive: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  stock: number;
  price: number;
  imageUrl?: string;
  imageIndex?: number;
};

export type SemanticProductCandidate = {
  productId: string;
  kind: PineconeSearchKind;
  rank: number;
  score: number;
};

export type SearchCandidateSource =
  | "exact"
  | "prefix"
  | "substring"
  | "keyword"
  | "typo"
  | "text_semantic"
  | "image_semantic";

export type SearchCandidate = {
  id: string;
  source: SearchCandidateSource;
  rank: number;
};

const SCORE_WEIGHTS: Record<SearchCandidateSource, { base: number; weight: number }> = {
  exact: { base: 100, weight: 1 },
  prefix: { base: 80, weight: 1 },
  substring: { base: 60, weight: 1 },
  keyword: { base: 30, weight: 1.3 },
  typo: { base: 20, weight: 0.9 },
  text_semantic: { base: 10, weight: 1 },
  image_semantic: { base: 8, weight: 0.8 },
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

function sha256(parts: string[]) {
  const hash = createHash("sha256");
  parts.forEach((part) => {
    hash.update(part);
    hash.update("\0");
  });
  return hash.digest("hex");
}

export function createProductSearchHash(searchText: string) {
  return sha256([
    PRODUCT_SEARCH_HASH_VERSION,
    PRODUCT_SEARCH_EMBEDDING_MODEL,
    String(PRODUCT_SEARCH_EMBEDDING_DIMENSIONS),
    searchText,
  ]);
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

export function normalizeProductImageUrls(images: string[] | null | undefined) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  images?.forEach((image) => {
    const imageUrl = image.trim();
    if (!imageUrl || seen.has(imageUrl)) return;
    seen.add(imageUrl);
    normalized.push(imageUrl);
  });

  return normalized;
}

export function createProductImageSearchHash(imageUrl: string) {
  return sha256([
    `${PRODUCT_SEARCH_HASH_VERSION}:image`,
    PRODUCT_SEARCH_EMBEDDING_MODEL,
    String(PRODUCT_SEARCH_EMBEDDING_DIMENSIONS),
    imageUrl.trim(),
  ]);
}

export function getProductTextVectorId(productId: string) {
  return `product:${productId}:text`;
}

export function getProductImageVectorId(productId: string, imageUrl: string) {
  const imageHash = sha256(["image-vector-id", imageUrl.trim()]).slice(0, 24);
  return `product:${productId}:image:${imageHash}`;
}

export function getProductImageHashMap(images: string[] | null | undefined) {
  return Object.fromEntries(
    normalizeProductImageUrls(images).map((imageUrl) => [imageUrl, createProductImageSearchHash(imageUrl)]),
  );
}

export function shouldReplaceProductSearchTextEmbedding(currentHash: string | null | undefined, nextHash: string) {
  return currentHash !== nextHash;
}

export function getStaleProductImageUrls(
  currentImageHashes: Record<string, string> | null | undefined,
  nextImageHashes: Record<string, string>,
) {
  return Object.keys(currentImageHashes || {}).filter((imageUrl) => !(imageUrl in nextImageHashes));
}

function parseScoreEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= -1 && parsed <= 1 ? parsed : fallback;
}

export function getProductSearchSemanticScoreThresholds() {
  return {
    text: parseScoreEnv(process.env.PRODUCT_SEARCH_TEXT_MIN_SCORE, PRODUCT_SEARCH_TEXT_MIN_SCORE),
    image: parseScoreEnv(process.env.PRODUCT_SEARCH_IMAGE_MIN_SCORE, PRODUCT_SEARCH_IMAGE_MIN_SCORE),
  };
}

export function semanticScoreWithinThreshold(score: number, kind: PineconeSearchKind) {
  const thresholds = getProductSearchSemanticScoreThresholds();
  return Number.isFinite(score) && score >= thresholds[kind];
}

export function fuseSearchCandidates(candidates: SearchCandidate[]) {
  const scores = new Map<string, number>();

  candidates.forEach((candidate) => {
    const config = SCORE_WEIGHTS[candidate.source];
    const rank = Number.isFinite(candidate.rank) && candidate.rank > 0 ? candidate.rank : 999;
    const nextScore = config.base + config.weight / (60 + rank);
    scores.set(candidate.id, (scores.get(candidate.id) || 0) + nextScore);
  });

  return Array.from(scores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

export function buildProductVectorMetadata({
  product,
  kind,
  hash,
  imageUrl,
  imageIndex,
}: {
  product: ProductSearchSource & { id: string };
  kind: PineconeSearchKind;
  hash: string;
  imageUrl?: string;
  imageIndex?: number;
}): ProductSearchVectorMetadata {
  return {
    productId: product.id,
    kind,
    hash,
    model: PRODUCT_SEARCH_EMBEDDING_MODEL,
    dimension: PRODUCT_SEARCH_EMBEDDING_DIMENSIONS,
    name: product.name || "",
    category: product.category || "",
    gender: product.gender || "",
    isActive: product.isActive !== false,
    isNew: Boolean(product.isNew),
    isFeatured: Boolean(product.isFeatured),
    isPremium: Boolean(product.isPremium),
    stock: product.stock || 0,
    price: Number(product.sellingPrice || 0),
    ...(imageUrl ? { imageUrl } : {}),
    ...(typeof imageIndex === "number" ? { imageIndex } : {}),
  };
}

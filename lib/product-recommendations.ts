import { db } from "./db/index.ts";
import { productRecommendations, productSearchIndexState } from "./db/schema.ts";
import { getPineconeProductIndex } from "./pinecone.ts";
import {
  getProductTextVectorId,
  PRODUCT_SEARCH_EMBEDDING_MODEL,
  type ProductSearchVectorMetadata,
} from "./product-search.ts";
import { eq } from "drizzle-orm";

export const PRODUCT_RECOMMENDATION_LIMIT = 16;
export const PRODUCT_RECOMMENDATION_QUERY_TOP_K = 16;
export const PRODUCT_RECOMMENDATION_MIN_SCORE = -1;

export type ProductRecommendationCandidate = {
  productId: string;
  score: number;
  rank: number;
};

type ProductRecommendationMatch = {
  metadata?: Partial<ProductSearchVectorMetadata> | null;
  score?: number | null;
};
type ProductRecommendationPineconeQuery = ReturnType<typeof buildProductRecommendationPineconeQuery>;

function parseScoreEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= -1 && parsed <= 1 ? parsed : fallback;
}

function parsePositiveIntegerEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getProductRecommendationMinScore() {
  return parseScoreEnv(
    process.env.PRODUCT_RECOMMENDATION_MIN_SCORE,
    PRODUCT_RECOMMENDATION_MIN_SCORE,
  );
}

export function getProductRecommendationQueryTopK() {
  return parsePositiveIntegerEnv(
    process.env.PRODUCT_RECOMMENDATION_QUERY_TOP_K,
    PRODUCT_RECOMMENDATION_QUERY_TOP_K,
  );
}

export function buildProductRecommendationPineconeQuery(sourceProductId: string) {
  return {
    id: getProductTextVectorId(sourceProductId),
    topK: getProductRecommendationQueryTopK(),
    includeMetadata: true,
    includeValues: false,
    filter: {
      $and: [
        { kind: { $eq: "text" } },
        { isActive: { $eq: true } },
        { productId: { $ne: sourceProductId } },
      ],
    },
  } as const;
}

export function selectProductRecommendationCandidates({
  sourceProductId,
  matches,
  minScore = getProductRecommendationMinScore(),
  limit = PRODUCT_RECOMMENDATION_LIMIT,
}: {
  sourceProductId: string;
  matches: ProductRecommendationMatch[];
  minScore?: number;
  limit?: number;
}) {
  const seen = new Set<string>();
  const candidates: ProductRecommendationCandidate[] = [];

  for (const match of matches) {
    const productId = match.metadata?.productId;
    const score = match.score ?? 0;

    if (!productId || productId === sourceProductId || seen.has(productId)) continue;
    if (match.metadata?.isActive !== true) continue;
    if (!Number.isFinite(score) || score < minScore) continue;

    seen.add(productId);
    candidates.push({
      productId,
      score,
      rank: candidates.length + 1,
    });

    if (limit !== undefined && candidates.length >= limit) break;
  }

  return candidates;
}

export function mergeRelatedProductIds({
  storedIds,
  heuristicIds,
  newestIds,
  excludedIds,
  limit = PRODUCT_RECOMMENDATION_LIMIT,
}: {
  storedIds: string[];
  heuristicIds: string[];
  newestIds: string[];
  excludedIds: Set<string>;
  limit?: number;
}) {
  const seen = new Set(excludedIds);
  const merged: string[] = [];

  for (const productId of [...storedIds, ...heuristicIds, ...newestIds]) {
    if (seen.has(productId)) continue;
    seen.add(productId);
    merged.push(productId);
    if (limit !== undefined && merged.length >= limit) break;
  }

  return merged;
}

export async function queryProductRecommendationCandidates({
  sourceProductId,
  query,
}: {
  sourceProductId: string;
  query?: (options: ProductRecommendationPineconeQuery) => Promise<{ matches: ProductRecommendationMatch[] }>;
}) {
  const queryProductIndex = query ?? ((options) => getPineconeProductIndex().query(options));
  const results = await queryProductIndex(buildProductRecommendationPineconeQuery(sourceProductId));

  return selectProductRecommendationCandidates({
    sourceProductId,
    matches: results.matches,
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function markRecommendationRefreshFailed(productId: string, error: unknown) {
  await db
    .insert(productSearchIndexState)
    .values({
      productId,
      status: "failed",
      lastError: errorMessage(error).slice(0, 1000),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: productSearchIndexState.productId,
      set: {
        status: "failed",
        lastError: errorMessage(error).slice(0, 1000),
        updatedAt: new Date(),
      },
    });
}

export async function replaceProductRecommendations({
  sourceProductId,
  candidates,
  sourceHash,
}: {
  sourceProductId: string;
  candidates: ProductRecommendationCandidate[];
  sourceHash?: string | null;
}) {
  await db.transaction(async (tx) => {
    await tx
      .delete(productRecommendations)
      .where(eq(productRecommendations.sourceProductId, sourceProductId));

    if (candidates.length === 0) return;

    await tx.insert(productRecommendations).values(
      candidates.map((candidate) => ({
        sourceProductId,
        recommendedProductId: candidate.productId,
        rank: candidate.rank,
        score: candidate.score.toFixed(6),
        model: PRODUCT_SEARCH_EMBEDDING_MODEL,
        sourceHash: sourceHash || null,
        updatedAt: new Date(),
      })),
    );
  });
}

export async function refreshProductRecommendations(productId: string) {
  const [state] = await db
    .select({ sourceHash: productSearchIndexState.searchTextHash })
    .from(productSearchIndexState)
    .where(eq(productSearchIndexState.productId, productId));

  const candidates = await queryProductRecommendationCandidates({ sourceProductId: productId });

  await replaceProductRecommendations({
    sourceProductId: productId,
    candidates,
    sourceHash: state?.sourceHash ?? null,
  });

  return {
    productId,
    status: "synced" as const,
    recommendations: candidates.length,
  };
}

export async function refreshProductRecommendationsAfterMutation(productId: string) {
  try {
    return await refreshProductRecommendations(productId);
  } catch (error) {
    await markRecommendationRefreshFailed(productId, error);
    console.warn("Product saved, but recommendations are pending retry:", errorMessage(error));
    return { productId, status: "failed" as const, error: errorMessage(error) };
  }
}

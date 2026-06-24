import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildProductRecommendationPineconeQuery,
  mergeRelatedProductIds,
  queryProductRecommendationCandidates,
  selectProductRecommendationCandidates,
} from "./product-recommendations.ts";
import { getProductTextVectorId } from "./product-search.ts";

type RecommendationQueryMatch = {
  metadata: {
    productId: string;
    isActive: boolean;
  };
  score: number;
};

test("product recommendation candidates exclude source, inactive, weak, and duplicate matches", () => {
  const candidates = selectProductRecommendationCandidates({
    sourceProductId: "source-product",
    minScore: 0.72,
    limit: 3,
    matches: [
      { metadata: { productId: "source-product", isActive: true }, score: 0.99 },
      { metadata: { productId: "inactive-product", isActive: false }, score: 0.98 },
      { metadata: { productId: "weak-product", isActive: true }, score: 0.4 },
      { metadata: { productId: "first-product", isActive: true }, score: 0.91 },
      { metadata: { productId: "first-product", isActive: true }, score: 0.9 },
      { metadata: { productId: "second-product", isActive: true }, score: 0.82 },
      { metadata: { productId: "third-product", isActive: true }, score: 0.76 },
      { metadata: { productId: "fourth-product", isActive: true }, score: 0.75 },
    ],
  });

  assert.deepEqual(candidates, [
    { productId: "first-product", score: 0.91, rank: 1 },
    { productId: "second-product", score: 0.82, rank: 2 },
    { productId: "third-product", score: 0.76, rank: 3 },
  ]);
});

test("product recommendation candidates do not filter by score by default", () => {
  const candidates = selectProductRecommendationCandidates({
    sourceProductId: "source-product",
    limit: 3,
    matches: [
      { metadata: { productId: "first-product", isActive: true }, score: 0.1 },
      { metadata: { productId: "second-product", isActive: true }, score: 0.05 },
    ],
  });

  assert.deepEqual(candidates, [
    { productId: "first-product", score: 0.1, rank: 1 },
    { productId: "second-product", score: 0.05, rank: 2 },
  ]);
});


test("product recommendation candidates keep only the top sixteen matches above the score threshold", () => {
  const matches = Array.from({ length: 20 }, (_, index) => ({
    metadata: { productId: `recommended-product-${index + 1}`, isActive: true },
    score: 0.99 - index * 0.01,
  }));

  const candidates = selectProductRecommendationCandidates({
    sourceProductId: "source-product",
    minScore: 0.8,
    matches,
  });

  assert.equal(candidates.length, 16);
  assert.deepEqual(
    candidates.map((candidate) => candidate.rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  );
});

test("product recommendation Pinecone query uses an existing text vector id without vector values", () => {
  const query = buildProductRecommendationPineconeQuery("source-product");

  assert.equal(query.id, getProductTextVectorId("source-product"));
  assert.equal("vector" in query, false);
  assert.equal(query.topK, 16);
  assert.equal(query.includeMetadata, true);
  assert.equal(query.includeValues, false);
  assert.deepEqual(query.filter, {
    $and: [
      { kind: { $eq: "text" } },
      { isActive: { $eq: true } },
      { productId: { $ne: "source-product" } },
    ],
  });
});

test("recommendation candidate query calls Pinecone once without generating embedding input", async () => {
  const calls: unknown[] = [];
  const candidates = await queryProductRecommendationCandidates({
    sourceProductId: "source-product",
    query: async (options): Promise<{ matches: RecommendationQueryMatch[] }> => {
      calls.push(options);
      return {
        matches: [
          { metadata: { productId: "recommended-product", isActive: true }, score: 0.91 },
        ],
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal("vector" in (calls[0] as Record<string, unknown>), false);
  assert.deepEqual(candidates, [
    { productId: "recommended-product", score: 0.91, rank: 1 },
  ]);
});

test("related product fallback keeps stored recommendations before heuristic and newest products", () => {
  const ids = mergeRelatedProductIds({
    storedIds: ["stored-a", "combo-product", "stored-b"],
    heuristicIds: ["stored-b", "heuristic-a"],
    newestIds: ["heuristic-a", "newest-a", "newest-b"],
    excludedIds: new Set(["source-product", "combo-product"]),
    limit: 4,
  });

  assert.deepEqual(ids, ["stored-a", "stored-b", "heuristic-a", "newest-a"]);
});

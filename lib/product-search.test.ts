import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildProductSearchText,
  createProductImageSearchHash,
  createProductSearchHash,
  fuseSearchCandidates,
  getProductImageHashMap,
  getProductImageVectorId,
  getStaleProductImageUrls,
  semanticScoreWithinThreshold,
  shouldReplaceProductSearchTextEmbedding,
} from "./product-search.ts";

test("search document includes colors and changes hash when a searchable field changes", () => {
  const searchText = buildProductSearchText({
    name: "Seoul Polo",
    category: "tshirt",
    gender: "men",
    colors: [{ name: "Ivory", hex: "#fffff0" }],
  });
  const updatedSearchText = buildProductSearchText({
    name: "Seoul Polo",
    category: "tshirt",
    gender: "men",
    colors: [{ name: "Black", hex: "#000000" }],
  });

  assert.match(searchText, /Ivory/);
  assert.notEqual(createProductSearchHash(searchText), createProductSearchHash(updatedSearchText));
});

test("unchanged search hash skips text embedding replacement", () => {
  const hash = createProductSearchHash("same search text");

  assert.equal(shouldReplaceProductSearchTextEmbedding(hash, hash), false);
  assert.equal(shouldReplaceProductSearchTextEmbedding("old", hash), true);
});

test("changed image hashes replace metadata and removed images are detected", () => {
  const current = getProductImageHashMap(["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"]);
  const next = getProductImageHashMap(["https://cdn.example.com/a.jpg", "https://cdn.example.com/c.jpg"]);

  assert.equal(current["https://cdn.example.com/a.jpg"], next["https://cdn.example.com/a.jpg"]);
  assert.notEqual(createProductImageSearchHash("https://cdn.example.com/b.jpg"), next["https://cdn.example.com/c.jpg"]);
  assert.deepEqual(getStaleProductImageUrls(current, next), ["https://cdn.example.com/b.jpg"]);
});

test("image vector IDs are stable per product and image URL", () => {
  assert.equal(
    getProductImageVectorId("product-1", "https://cdn.example.com/a.jpg"),
    getProductImageVectorId("product-1", "https://cdn.example.com/a.jpg"),
  );
  assert.notEqual(
    getProductImageVectorId("product-1", "https://cdn.example.com/a.jpg"),
    getProductImageVectorId("product-1", "https://cdn.example.com/b.jpg"),
  );
});

test("lexical and substring candidates outrank semantic-only candidates", () => {
  const ranked = fuseSearchCandidates([
    { id: "semantic", source: "text_semantic", rank: 1 },
    { id: "substring", source: "substring", rank: 20 },
    { id: "exact", source: "exact", rank: 50 },
  ]);

  assert.deepEqual(ranked.map((item) => item.id), ["exact", "substring", "semantic"]);
});

test("semantic thresholds exclude weak tail candidates", () => {
  assert.equal(semanticScoreWithinThreshold(0.7, "text"), true);
  assert.equal(semanticScoreWithinThreshold(0.2, "text"), false);
  assert.equal(semanticScoreWithinThreshold(0.7, "image"), true);
  assert.equal(semanticScoreWithinThreshold(0.2, "image"), false);
});

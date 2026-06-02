import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildProductSearchText,
  createProductImageSearchHash,
  createProductSearchHash,
  getLexicalMatchTier,
  prepareProductDocumentEmbeddingInput,
  prepareProductQueryEmbeddingInput,
  resolveProductSearchEmbedding,
  resolveProductSearchImageEmbeddings,
  semanticDistanceWithinThreshold,
  PRODUCT_SEARCH_EMBEDDING_MODEL,
  type ProductSearchSource,
} from "./product-search.ts";
import {
  createGeminiKeyRotator,
  parseGeminiApiKeys,
  shouldRetryGeminiEmbeddingError,
} from "./gemini-key-rotation.ts";

function product(overrides: Partial<ProductSearchSource> = {}): ProductSearchSource {
  return {
    name: "Oversized Polo Tee",
    description: "A breathable premium knit for summer layering.",
    category: "tshirt",
    gender: "unisex",
    tags: ["oversized", "polo"],
    fabric: "Cotton pique",
    careInstructions: ["Machine wash cold"],
    features: ["Drop shoulder"],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Washed Black", hex: "#111111" },
      { name: "Bone", hex: "#f5efe4" },
    ],
    ...overrides,
  };
}

test("buildProductSearchText includes every searchable product field in stable order", () => {
  assert.equal(
    buildProductSearchText(product()),
    [
      "Oversized Polo Tee",
      "A breathable premium knit for summer layering.",
      "tshirt",
      "unisex",
      "oversized",
      "polo",
      "Cotton pique",
      "Drop shoulder",
      "Machine wash cold",
      "S",
      "M",
      "L",
      "Washed Black",
      "#111111",
      "Bone",
      "#f5efe4",
    ].join("\n"),
  );
});

test("uses Gemini Embedding 2 retrieval prompt formatting", () => {
  const searchText = buildProductSearchText(product());

  assert.equal(PRODUCT_SEARCH_EMBEDDING_MODEL, "gemini-embedding-2");
  assert.equal(
    prepareProductQueryEmbeddingInput("washed black tee"),
    "task: search result | query: washed black tee",
  );
  assert.equal(
    prepareProductDocumentEmbeddingInput({ title: "Oversized Polo Tee", searchText }),
    `title: Oversized Polo Tee | text: ${searchText}`,
  );
});

test("createProductSearchHash changes when a searchable field changes", () => {
  const before = createProductSearchHash(buildProductSearchText(product()));
  const after = createProductSearchHash(buildProductSearchText(product({ fabric: "Heavy cotton fleece" })));

  assert.notEqual(before, after);
});

test("createProductImageSearchHash changes when image url or model changes", () => {
  const first = createProductImageSearchHash("https://cdn.example.com/a.webp");
  const changed = createProductImageSearchHash("https://cdn.example.com/b.webp");

  assert.notEqual(first, changed);
});

test("resolveProductSearchEmbedding skips unchanged search text and replaces changed embeddings", async () => {
  const searchText = buildProductSearchText(product());
  const currentHash = createProductSearchHash(searchText);
  let embedCalls = 0;

  const unchanged = await resolveProductSearchEmbedding({
    searchText,
    currentHash,
    currentEmbedding: [0.1, 0.2],
    embedSearchText: async () => {
      embedCalls += 1;
      return [0.9, 0.8];
    },
  });

  assert.equal(embedCalls, 0);
  assert.equal(unchanged.replaced, false);
  assert.deepEqual(unchanged.embedding, [0.1, 0.2]);

  const changed = await resolveProductSearchEmbedding({
    searchText,
    currentHash: "stale",
    currentEmbedding: [0.1, 0.2],
    embedSearchText: async () => {
      embedCalls += 1;
      return [0.9, 0.8];
    },
  });

  assert.equal(embedCalls, 1);
  assert.equal(changed.replaced, true);
  assert.deepEqual(changed.embedding, [0.9, 0.8]);
  assert.equal(changed.hash, currentHash);
});

test("resolveProductSearchImageEmbeddings embeds changed images and deletes removed image rows", async () => {
  const embeddedImages: string[] = [];
  const currentRows = [
    {
      imageUrl: "https://cdn.example.com/kept.webp",
      imageIndex: 4,
      imageEmbeddingHash: createProductImageSearchHash("https://cdn.example.com/kept.webp"),
      imageEmbedding: [0.1, 0.2],
    },
    {
      imageUrl: "https://cdn.example.com/removed.webp",
      imageIndex: 1,
      imageEmbeddingHash: createProductImageSearchHash("https://cdn.example.com/removed.webp"),
      imageEmbedding: [0.3, 0.4],
    },
  ];

  const result = await resolveProductSearchImageEmbeddings({
    images: ["https://cdn.example.com/kept.webp", "https://cdn.example.com/new.webp"],
    currentRows,
    embedImage: async (imageUrl) => {
      embeddedImages.push(imageUrl);
      return [0.9, 0.8];
    },
  });

  assert.deepEqual(result.deleteImageUrls, ["https://cdn.example.com/removed.webp"]);
  assert.deepEqual(embeddedImages, ["https://cdn.example.com/new.webp"]);
  assert.deepEqual(
    result.upserts.map((row) => ({
      imageUrl: row.imageUrl,
      imageIndex: row.imageIndex,
      replaced: row.replaced,
      embedding: row.imageEmbedding,
    })),
    [
      {
        imageUrl: "https://cdn.example.com/kept.webp",
        imageIndex: 0,
        replaced: false,
        embedding: [0.1, 0.2],
      },
      {
        imageUrl: "https://cdn.example.com/new.webp",
        imageIndex: 1,
        replaced: true,
        embedding: [0.9, 0.8],
      },
    ],
  );
});

test("lexical tiers rank exact and substring matches above semantic-only matches", () => {
  const source = product({
    name: "Washed Black Cargo Pants",
    category: "cargo",
    tags: ["utility"],
  });

  assert.equal(getLexicalMatchTier("Washed Black Cargo Pants", source), 1);
  assert.equal(getLexicalMatchTier("washed", source), 2);
  assert.equal(getLexicalMatchTier("cargo", source), 3);
  assert.equal(getLexicalMatchTier("wide leg", source), null);
});

test("semanticDistanceWithinThreshold excludes low relevance tail matches", () => {
  assert.equal(semanticDistanceWithinThreshold(0.37, "text"), true);
  assert.equal(semanticDistanceWithinThreshold(0.39, "text"), false);
  assert.equal(semanticDistanceWithinThreshold(0.34, "image"), true);
  assert.equal(semanticDistanceWithinThreshold(0.36, "image"), false);
});

test("parseGeminiApiKeys accepts comma-separated keys and removes blanks", () => {
  assert.deepEqual(parseGeminiApiKeys(" key-a, ,key-b ,, key-c "), ["key-a", "key-b", "key-c"]);
});

test("createGeminiKeyRotator rotates keys and retries retryable errors with the next key", async () => {
  const usedKeys: string[] = [];
  const rotator = createGeminiKeyRotator({
    keys: ["key-a", "key-b"],
    maxAttempts: 2,
  });

  const result = await rotator.run(async (apiKey) => {
    usedKeys.push(apiKey);
    if (apiKey === "key-a") {
      const error = new Error("rate limit");
      (error as Error & { statusCode?: number }).statusCode = 429;
      throw error;
    }
    return "ok";
  });

  assert.equal(result, "ok");
  assert.deepEqual(usedKeys, ["key-a", "key-b"]);
});

test("shouldRetryGeminiEmbeddingError only retries rate-limit and transient provider failures", () => {
  const rateLimit = new Error("quota exceeded") as Error & { statusCode?: number };
  rateLimit.statusCode = 429;
  const invalidRequest = new Error("bad request") as Error & { statusCode?: number };
  invalidRequest.statusCode = 400;

  assert.equal(shouldRetryGeminiEmbeddingError(rateLimit), true);
  assert.equal(shouldRetryGeminiEmbeddingError(invalidRequest), false);
});

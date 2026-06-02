import { createGoogleGenerativeAI, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { embed } from "ai";
import { createGeminiKeyRotator, parseGeminiApiKeys } from "./gemini-key-rotation.ts";
import {
  PRODUCT_SEARCH_EMBEDDING_DIMENSIONS,
  PRODUCT_SEARCH_EMBEDDING_MODEL,
} from "./product-search.ts";

const PRODUCT_SEARCH_EMBEDDING_OPTIONS = {
  outputDimensionality: PRODUCT_SEARCH_EMBEDDING_DIMENSIONS,
  taskType: "SEMANTIC_SIMILARITY",
} satisfies GoogleEmbeddingModelOptions;

export function getGeminiApiKeysFromEnv() {
  return parseGeminiApiKeys(process.env.GEMINI_API_KEYS);
}

export async function generateProductSearchEmbedding(searchText: string) {
  const keys = getGeminiApiKeysFromEnv();
  const rotator = createGeminiKeyRotator({
    keys,
    maxAttempts: Math.min(3, keys.length),
  });

  return rotator.run(async (apiKey) => {
    const google = createGoogleGenerativeAI({ apiKey });
    const { embedding } = await embed({
      model: google.embedding(PRODUCT_SEARCH_EMBEDDING_MODEL),
      value: searchText.slice(0, 8000),
      providerOptions: {
        google: PRODUCT_SEARCH_EMBEDDING_OPTIONS,
      },
    });
    return embedding;
  });
}

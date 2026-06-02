import { createGoogleGenerativeAI, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { embed } from "ai";
import { createGeminiKeyRotator, parseGeminiApiKeys } from "./gemini-key-rotation.ts";
import {
  PRODUCT_SEARCH_EMBEDDING_DIMENSIONS,
  PRODUCT_SEARCH_EMBEDDING_MODEL,
  prepareProductDocumentEmbeddingInput,
  prepareProductQueryEmbeddingInput,
} from "./product-search.ts";

const PRODUCT_SEARCH_EMBEDDING_OPTIONS = {
  outputDimensionality: PRODUCT_SEARCH_EMBEDDING_DIMENSIONS,
} satisfies GoogleEmbeddingModelOptions;

export function getGeminiApiKeysFromEnv() {
  return parseGeminiApiKeys(process.env.GEMINI_API_KEYS);
}

function inferImageMimeType(imageUrl: string) {
  const pathname = imageUrl.split("?")[0]?.toLowerCase() || "";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  return "image/webp";
}

async function runGeminiEmbedding(
  value: string,
  providerOptions: GoogleEmbeddingModelOptions = PRODUCT_SEARCH_EMBEDDING_OPTIONS,
) {
  const keys = getGeminiApiKeysFromEnv();
  const rotator = createGeminiKeyRotator({
    keys,
    maxAttempts: Math.min(3, keys.length),
  });

  return rotator.run(async (apiKey) => {
    const google = createGoogleGenerativeAI({ apiKey });
    const { embedding } = await embed({
      model: google.embedding(PRODUCT_SEARCH_EMBEDDING_MODEL),
      value: value.slice(0, 8000),
      providerOptions: {
        google: providerOptions,
      },
    });
    return embedding;
  });
}

export async function generateProductSearchEmbedding(searchText: string) {
  return runGeminiEmbedding(searchText);
}

export async function generateProductDocumentSearchEmbedding({
  title,
  searchText,
}: {
  title?: string | null;
  searchText: string;
}) {
  return runGeminiEmbedding(prepareProductDocumentEmbeddingInput({ title, searchText }));
}

export async function generateProductQuerySearchEmbedding(query: string) {
  return runGeminiEmbedding(prepareProductQueryEmbeddingInput(query));
}

export async function generateProductImageSearchEmbedding(imageUrl: string) {
  return runGeminiEmbedding("", {
    ...PRODUCT_SEARCH_EMBEDDING_OPTIONS,
    content: [
      [
        {
          fileData: {
            fileUri: imageUrl,
            mimeType: inferImageMimeType(imageUrl),
          },
        },
      ],
    ],
  });
}

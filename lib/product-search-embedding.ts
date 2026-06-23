import { Buffer } from "node:buffer";
import { GoogleGenAI, type Part } from "@google/genai";
import { createGeminiKeyRotator, parseGeminiApiKeys } from "./gemini-key-rotation";
import {
  PRODUCT_SEARCH_EMBEDDING_DIMENSIONS,
  PRODUCT_SEARCH_EMBEDDING_MODEL,
  prepareProductDocumentEmbeddingInput,
  prepareProductQueryEmbeddingInput,
} from "./product-search";

const MAX_TEXT_INPUT_LENGTH = 8000;

export function getGeminiApiKeysFromEnv() {
  return parseGeminiApiKeys(process.env.GEMINI_API_KEYS);
}

function extractEmbeddingValues(response: Awaited<ReturnType<GoogleGenAI["models"]["embedContent"]>>) {
  const values = response.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini embedding response did not include embedding values");
  }
  if (values.length !== PRODUCT_SEARCH_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Gemini embedding dimension mismatch: expected ${PRODUCT_SEARCH_EMBEDDING_DIMENSIONS}, got ${values.length}`,
    );
  }
  return values;
}

async function runGeminiEmbedding(contents: string | Part[]) {
  const keys = getGeminiApiKeysFromEnv();
  const rotator = createGeminiKeyRotator({
    keys,
    maxAttempts: Math.min(3, keys.length),
  });

  return rotator.run(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: PRODUCT_SEARCH_EMBEDDING_MODEL,
      contents,
      config: {
        outputDimensionality: PRODUCT_SEARCH_EMBEDDING_DIMENSIONS,
      },
    });
    return extractEmbeddingValues(response);
  });
}

export async function generateProductDocumentSearchEmbedding({
  title,
  searchText,
}: {
  title?: string | null;
  searchText: string;
}) {
  const value = prepareProductDocumentEmbeddingInput({ title, searchText }).slice(0, MAX_TEXT_INPUT_LENGTH);
  return runGeminiEmbedding(value);
}

export async function generateProductQuerySearchEmbedding(query: string) {
  return runGeminiEmbedding(prepareProductQueryEmbeddingInput(query).slice(0, MAX_TEXT_INPUT_LENGTH));
}

function inferImageMimeType(imageUrl: string, responseContentType?: string | null) {
  const contentType = responseContentType?.split(";")[0]?.trim().toLowerCase();
  if (contentType?.startsWith("image/")) return contentType;

  const pathname = imageUrl.split("?")[0]?.toLowerCase() || "";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export function toGeminiImageFetchUrl(imageUrl: string) {
  if (!imageUrl.includes("res.cloudinary.com") || !imageUrl.includes("/image/upload/")) {
    return imageUrl;
  }

  return imageUrl.replace("/image/upload/", "/image/upload/f_jpg,q_auto:eco,w_768,c_limit/");
}

async function fetchImagePart(imageUrl: string): Promise<Part> {
  const fetchUrl = toGeminiImageFetchUrl(imageUrl);
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch product image for embedding: ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    inlineData: {
      data: bytes.toString("base64"),
      mimeType: inferImageMimeType(fetchUrl, response.headers.get("content-type")),
    },
  };
}

export async function generateProductImageSearchEmbedding(imageUrl: string) {
  const imagePart = await fetchImagePart(imageUrl);
  return runGeminiEmbedding([
    { text: "product catalog image for visual product search" },
    imagePart,
  ]);
}

import { Pinecone } from "@pinecone-database/pinecone";
import type { ProductSearchVectorMetadata } from "@/lib/product-search";

let pineconeClient: Pinecone | null = null;

export function getPineconeIndexName() {
  const indexName = process.env.PINECONE_INDEX || "xilar-products";
  if (!indexName.trim()) {
    throw new Error("PINECONE_INDEX must be a non-empty index name");
  }
  return indexName.trim();
}

export function getPineconeNamespace() {
  return process.env.PINECONE_NAMESPACE || "products";
}

export function getPineconeClient() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY must be configured for semantic product search");
  }

  pineconeClient ??= new Pinecone({ apiKey });
  return pineconeClient;
}

export function getPineconeProductIndex() {
  return getPineconeClient()
    .index<ProductSearchVectorMetadata>(getPineconeIndexName())
    .namespace(getPineconeNamespace());
}

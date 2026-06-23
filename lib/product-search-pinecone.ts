import { getPineconeProductIndex } from "@/lib/pinecone";
import {
  getProductImageVectorId,
  getProductSearchSemanticScoreThresholds,
  getProductTextVectorId,
  semanticScoreWithinThreshold,
  type PineconeSearchKind,
  type ProductSearchVectorMetadata,
  type SemanticProductCandidate,
} from "@/lib/product-search";

export type ProductSearchVector = {
  id: string;
  values: number[];
  metadata: ProductSearchVectorMetadata;
};

export async function upsertProductSearchVectors(vectors: ProductSearchVector[]) {
  if (vectors.length === 0) return;
  const index = getPineconeProductIndex();
  const batchSize = 100;

  for (let i = 0; i < vectors.length; i += batchSize) {
    await index.upsert({
      records: vectors.slice(i, i + batchSize),
    });
  }
}

export async function deleteProductSearchVectorsByIds(ids: string[]) {
  if (ids.length === 0) return;
  const index = getPineconeProductIndex();
  const batchSize = 100;

  for (let i = 0; i < ids.length; i += batchSize) {
    await index.deleteMany({ ids: ids.slice(i, i + batchSize) });
  }
}

export async function deleteProductSearchVectors(productId: string) {
  await getPineconeProductIndex().deleteMany({
    filter: { productId: { $eq: productId } },
  });
}

function mapMatchesToCandidates(
  matches: Awaited<ReturnType<ReturnType<typeof getPineconeProductIndex>["query"]>>["matches"],
  kind: PineconeSearchKind,
) {
  const seen = new Set<string>();
  const candidates: SemanticProductCandidate[] = [];

  matches.forEach((match) => {
    const productId = match.metadata?.productId;
    const score = match.score ?? 0;
    if (!productId || seen.has(productId) || !semanticScoreWithinThreshold(score, kind)) return;
    seen.add(productId);
    candidates.push({
      productId,
      kind,
      rank: candidates.length + 1,
      score,
    });
  });

  return candidates;
}

export async function queryProductSemanticCandidates({
  embedding,
  filter,
  topK = 80,
}: {
  embedding: number[];
  filter?: object;
  topK?: number;
}) {
  const index = getPineconeProductIndex();
  const thresholds = getProductSearchSemanticScoreThresholds();
  const textFilter = filter ? { $and: [filter, { kind: { $eq: "text" } }] } : { kind: { $eq: "text" } };
  const imageFilter = filter ? { $and: [filter, { kind: { $eq: "image" } }] } : { kind: { $eq: "image" } };

  const [textResults, imageResults] = await Promise.all([
    index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
      includeValues: false,
      filter: textFilter,
    }),
    index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
      includeValues: false,
      filter: imageFilter,
    }),
  ]);

  const textCandidates = mapMatchesToCandidates(
    textResults.matches.filter((match) => (match.score ?? 0) >= thresholds.text),
    "text",
  );
  const imageCandidates = mapMatchesToCandidates(
    imageResults.matches.filter((match) => (match.score ?? 0) >= thresholds.image),
    "image",
  );

  return [...textCandidates, ...imageCandidates];
}

export function getKnownProductVectorIds(productId: string, imageUrls: string[]) {
  return [
    getProductTextVectorId(productId),
    ...imageUrls.map((imageUrl) => getProductImageVectorId(productId, imageUrl)),
  ];
}

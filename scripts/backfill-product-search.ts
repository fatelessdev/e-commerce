import "dotenv/config";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../lib/db/index.ts";
import { productSearchImages, products } from "../lib/db/schema.ts";
import {
  buildProductSearchText,
  PRODUCT_SEARCH_EMBEDDING_MODEL,
  resolveProductSearchEmbedding,
  resolveProductSearchImageEmbeddings,
} from "../lib/product-search.ts";
import {
  generateProductDocumentSearchEmbedding,
  generateProductImageSearchEmbedding,
} from "../lib/product-search-embedding.ts";

async function main() {
  const rows = await db.select().from(products);
  let updated = 0;
  let skipped = 0;

  for (const product of rows) {
    const searchText = buildProductSearchText(product);
    const currentImageRows = await db
      .select()
      .from(productSearchImages)
      .where(eq(productSearchImages.productId, product.id));
    const searchIndex = await resolveProductSearchEmbedding({
      searchText,
      currentHash: product.searchEmbeddingHash,
      currentEmbedding: product.searchEmbedding,
      embedSearchText: (value) => generateProductDocumentSearchEmbedding({
        title: product.name,
        searchText: value,
      }),
    });
    const imageIndex = await resolveProductSearchImageEmbeddings({
      images: product.images || [],
      currentRows: currentImageRows,
      embedImage: generateProductImageSearchEmbedding,
    });

    if (
      !searchIndex.replaced &&
      product.searchText === searchText &&
      imageIndex.deleteImageUrls.length === 0 &&
      imageIndex.upserts.every((image) => !image.replaced)
    ) {
      skipped += 1;
      continue;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({
          searchText: searchIndex.searchText,
          searchEmbedding: searchIndex.embedding,
          searchEmbeddingHash: searchIndex.hash,
          searchEmbeddingModel: PRODUCT_SEARCH_EMBEDDING_MODEL,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));

      if (imageIndex.deleteImageUrls.length > 0) {
        await tx
          .delete(productSearchImages)
          .where(and(
            eq(productSearchImages.productId, product.id),
            inArray(productSearchImages.imageUrl, imageIndex.deleteImageUrls),
          ));
      }

      if (imageIndex.upserts.length > 0) {
        await tx
          .insert(productSearchImages)
          .values(imageIndex.upserts.map((image) => ({
            productId: product.id,
            imageUrl: image.imageUrl,
            imageIndex: image.imageIndex,
            imageEmbedding: image.imageEmbedding,
            imageEmbeddingHash: image.imageEmbeddingHash,
            imageEmbeddingModel: PRODUCT_SEARCH_EMBEDDING_MODEL,
            updatedAt: new Date(),
          })))
          .onConflictDoUpdate({
            target: [productSearchImages.productId, productSearchImages.imageUrl],
            set: {
              imageIndex: sql`excluded.image_index`,
              imageEmbedding: sql`excluded.image_embedding`,
              imageEmbeddingHash: sql`excluded.image_embedding_hash`,
              imageEmbeddingModel: sql`excluded.image_embedding_model`,
              updatedAt: new Date(),
            },
          });
      }
    });

    updated += 1;
    console.log(
      `Indexed product ${updated}/${rows.length}: ${product.name} ` +
      `(text ${searchIndex.replaced ? "replaced" : "kept"}, images ${imageIndex.upserts.length}, removed ${imageIndex.deleteImageUrls.length})`,
    );
  }

  console.log(`Product search backfill complete. Updated: ${updated}. Skipped: ${skipped}.`);
}

main().catch((error) => {
  console.error("Product search backfill failed:", error);
  process.exitCode = 1;
});

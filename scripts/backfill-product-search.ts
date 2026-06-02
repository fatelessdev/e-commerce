import "dotenv/config";

import { eq } from "drizzle-orm";
import { db } from "../lib/db/index.ts";
import { products } from "../lib/db/schema.ts";
import {
  buildProductSearchText,
  PRODUCT_SEARCH_EMBEDDING_MODEL,
  resolveProductSearchEmbedding,
} from "../lib/product-search.ts";
import { generateProductSearchEmbedding } from "../lib/product-search-embedding.ts";

async function main() {
  const rows = await db.select().from(products);
  let updated = 0;
  let skipped = 0;

  for (const product of rows) {
    const searchText = buildProductSearchText(product);
    const searchIndex = await resolveProductSearchEmbedding({
      searchText,
      currentHash: product.searchEmbeddingHash,
      currentEmbedding: product.searchEmbedding,
      embedSearchText: generateProductSearchEmbedding,
    });

    if (!searchIndex.replaced && product.searchText === searchText) {
      skipped += 1;
      continue;
    }

    await db
      .update(products)
      .set({
        searchText: searchIndex.searchText,
        searchEmbedding: searchIndex.embedding,
        searchEmbeddingHash: searchIndex.hash,
        searchEmbeddingModel: PRODUCT_SEARCH_EMBEDDING_MODEL,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    updated += 1;
    console.log(`Indexed product ${updated}/${rows.length}: ${product.name}`);
  }

  console.log(`Product search backfill complete. Updated: ${updated}. Skipped: ${skipped}.`);
}

main().catch((error) => {
  console.error("Product search backfill failed:", error);
  process.exitCode = 1;
});

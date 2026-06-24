import "dotenv/config";

import { db } from "../lib/db/index.ts";
import { productSearchIndexState, products } from "../lib/db/schema.ts";
import { refreshProductRecommendationsAfterMutation } from "../lib/product-recommendations.ts";
import { syncProductSearchIndexAfterMutation } from "../lib/product-search-index.ts";
import { desc, eq, inArray, isNull, ne, or } from "drizzle-orm";

type BackfillArgs = {
  force: boolean;
  failedOnly: boolean;
  recommendationsOnly: boolean;
  targets: string[];
  limit?: number;
};

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function printHelp() {
  console.log(`
Usage:
  npm run search:backfill
  npm run search:backfill -- --force
  npm run search:backfill -- --failed
  npm run search:backfill -- --product <product-id-or-slug>
  npm run search:backfill -- --product <id-or-slug> --product <id-or-slug> --force
  npm run search:backfill -- --products <id-or-slug,id-or-slug> --limit 10
  npm run search:backfill -- --recommendations-only --limit 10

Options:
  --all             Backfill every product. This is the default.
  --failed          Backfill only missing, pending, or failed product index rows.
  --product VALUE   Backfill one product by exact id or slug. Can be repeated.
  --products LIST   Backfill comma-separated exact ids or slugs.
  --force           Regenerate vectors and replace existing Pinecone records.
  --recommendations-only
                    Recompute stored recommendations from existing Pinecone text vectors.
  --limit N         Limit selected products, useful for smoke tests.
`);
}

function parseArgs(argv: string[]): BackfillArgs {
  const args: BackfillArgs = {
    force: false,
    failedOnly: false,
    recommendationsOnly: false,
    targets: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--force") {
      args.force = true;
      continue;
    }

    if (arg === "--recommendations-only") {
      args.recommendationsOnly = true;
      continue;
    }

    if (arg === "--failed") {
      args.failedOnly = true;
      continue;
    }

    if (arg === "--all") {
      args.failedOnly = false;
      args.targets = [];
      continue;
    }

    if (arg === "--product" || arg === "--id" || arg === "--slug") {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} requires a value`);
      args.targets.push(...parseList(value));
      continue;
    }

    if (arg === "--products" || arg === "--ids" || arg === "--slugs") {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} requires a comma-separated value`);
      args.targets.push(...parseList(value));
      continue;
    }

    if (arg === "--limit") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--limit must be a positive integer");
      }
      args.limit = value;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    args.targets.push(...parseList(arg));
  }

  args.targets = Array.from(new Set(args.targets));
  if (args.targets.length > 0) args.failedOnly = false;

  return args;
}

async function loadProductsToBackfill(args: BackfillArgs) {
  let query = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      status: productSearchIndexState.status,
    })
    .from(products)
    .leftJoin(productSearchIndexState, eq(productSearchIndexState.productId, products.id))
    .$dynamic();

  if (args.targets.length > 0) {
    query = query.where(or(inArray(products.id, args.targets), inArray(products.slug, args.targets)));
  } else if (args.failedOnly) {
    query = query.where(
      or(isNull(productSearchIndexState.status), ne(productSearchIndexState.status, "synced")),
    );
  }

  query = query.orderBy(desc(products.displayOrder), desc(products.createdAt));

  if (args.limit) {
    query = query.limit(args.limit);
  }

  return query;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = await loadProductsToBackfill(args);

  if (rows.length === 0) {
    console.log("No products matched the requested backfill scope.");
    return;
  }

  console.log(
    `Starting product search backfill for ${rows.length} product(s). ` +
      `Mode: ${args.targets.length > 0 ? "targeted" : args.failedOnly ? "failed" : "all"}. ` +
      `Force replace: ${args.force ? "yes" : "no"}. ` +
      `Recommendations only: ${args.recommendationsOnly ? "yes" : "no"}.`,
  );

  let synced = 0;
  let recommendationsSynced = 0;
  let failed = 0;

  for (const [index, product] of rows.entries()) {
    const result = args.recommendationsOnly
      ? { productId: product.id, status: "synced" as const, upserted: 0, removed: 0 }
      : await syncProductSearchIndexAfterMutation(product.id, {
          force: args.force,
        });
    const recommendationResult = result.status === "failed"
      ? null
      : await refreshProductRecommendationsAfterMutation(product.id);

    if (result.status === "failed" || recommendationResult?.status === "failed") {
      failed += 1;
    } else {
      synced += 1;
      recommendationsSynced += recommendationResult?.recommendations ?? 0;
    }

    console.log(
      `[${index + 1}/${rows.length}] ${product.name} (${product.slug}): ${result.status}` +
        ("upserted" in result ? `, upserted ${result.upserted}, removed ${result.removed}` : "") +
        (recommendationResult && "recommendations" in recommendationResult
          ? `, recommendations ${recommendationResult.recommendations}`
          : ""),
    );
  }

  console.log(
    `Product search backfill complete. Synced: ${synced}. ` +
      `Recommendations stored: ${recommendationsSynced}. Failed: ${failed}.`,
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Product search backfill failed:", error);
  process.exitCode = 1;
});

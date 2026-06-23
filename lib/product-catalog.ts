import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { and, desc, eq, gt, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { generateProductQuerySearchEmbedding } from "@/lib/product-search-embedding";
import { queryProductSemanticCandidates } from "@/lib/product-search-pinecone";
import type { SemanticProductCandidate } from "@/lib/product-search";

export type CatalogProduct = Pick<
  typeof products.$inferSelect,
  | "id"
  | "name"
  | "slug"
  | "sellingPrice"
  | "mrp"
  | "maxBargainDiscount"
  | "category"
  | "gender"
  | "isNew"
  | "isFeatured"
  | "isPremium"
  | "stock"
> & {
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string; images?: string[] }[];
  availableSizes: string[];
};

type CatalogProductRow = Omit<CatalogProduct, "images" | "sizes" | "colors" | "availableSizes"> & {
  images: string[] | null;
  sizes: string[] | null;
  colors: { name: string; hex: string; images?: string[] }[] | null;
};

type CatalogQuery = {
  category?: string | null;
  gender?: string | null;
  search?: string | null;
  size?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  isNew?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  limit?: number;
  offset?: number;
  includeTotal?: boolean;
};

const catalogProductColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  sellingPrice: products.sellingPrice,
  mrp: products.mrp,
  maxBargainDiscount: products.maxBargainDiscount,
  images: products.images,
  category: products.category,
  gender: products.gender,
  sizes: products.sizes,
  colors: products.colors,
  isNew: products.isNew,
  isFeatured: products.isFeatured,
  isPremium: products.isPremium,
  stock: products.stock,
};

function buildCatalogConditions(query: CatalogQuery) {
  const conditions = [eq(products.isActive, true)];

  if (query.category) {
    conditions.push(eq(products.category, query.category as typeof products.category.enumValues[number]));
  }

  if (query.gender) {
    conditions.push(
      or(
        eq(products.gender, query.gender as typeof products.gender.enumValues[number]),
        eq(products.gender, "unisex")
      )!
    );
  }

  if (query.minPrice) {
    conditions.push(gte(products.sellingPrice, query.minPrice));
  }

  if (query.maxPrice) {
    conditions.push(lte(products.sellingPrice, query.maxPrice));
  }

  if (query.isNew) {
    conditions.push(eq(products.isNew, true));
  }

  if (query.isFeatured) {
    conditions.push(eq(products.isFeatured, true));
  }

  if (query.isPremium) {
    conditions.push(eq(products.isPremium, true));
  }

  if (query.size) {
    conditions.push(sql`EXISTS (
      SELECT 1
      FROM ${productVariants}
      WHERE ${productVariants.productId} = ${products.id}
        AND ${productVariants.size} = ${query.size}
        AND ${productVariants.stock} > 0
    )`);
  }

  return and(...conditions);
}

function buildCatalogSqlConditions(query: CatalogQuery) {
  const conditions: SQL[] = [sql`${products.isActive} = true`];

  if (query.category) {
    conditions.push(sql`${products.category} = ${query.category}`);
  }

  if (query.gender) {
    conditions.push(sql`(${products.gender} = ${query.gender} OR ${products.gender} = 'unisex')`);
  }

  if (query.minPrice) {
    conditions.push(sql`${products.sellingPrice} >= ${query.minPrice}`);
  }

  if (query.maxPrice) {
    conditions.push(sql`${products.sellingPrice} <= ${query.maxPrice}`);
  }

  if (query.isNew) {
    conditions.push(sql`${products.isNew} = true`);
  }

  if (query.isFeatured) {
    conditions.push(sql`${products.isFeatured} = true`);
  }

  if (query.isPremium) {
    conditions.push(sql`${products.isPremium} = true`);
  }

  if (query.size) {
    conditions.push(sql`EXISTS (
      SELECT 1
      FROM ${productVariants}
      WHERE ${productVariants.productId} = ${products.id}
        AND ${productVariants.size} = ${query.size}
        AND ${productVariants.stock} > 0
    )`);
  }

  return sql.join(conditions, sql` AND `);
}

function buildPineconeMetadataFilter(query: CatalogQuery) {
  const filters: object[] = [{ isActive: { $eq: true } }];

  if (query.category) filters.push({ category: { $eq: query.category } });
  if (query.gender) {
    filters.push({
      $or: [
        { gender: { $eq: query.gender } },
        { gender: { $eq: "unisex" } },
      ],
    });
  }
  if (query.minPrice) filters.push({ price: { $gte: Number(query.minPrice) } });
  if (query.maxPrice) filters.push({ price: { $lte: Number(query.maxPrice) } });
  if (query.isNew) filters.push({ isNew: { $eq: true } });
  if (query.isFeatured) filters.push({ isFeatured: { $eq: true } });
  if (query.isPremium) filters.push({ isPremium: { $eq: true } });

  return filters.length === 1 ? filters[0] : { $and: filters };
}

function semanticCandidateSql(candidates: SemanticProductCandidate[], where: SQL) {
  if (candidates.length === 0) return sql``;

  const values = candidates.map((candidate) => sql`(
    ${candidate.productId}::uuid,
    ${candidate.kind === "text" ? "text_semantic" : "image_semantic"}::text,
    ${candidate.rank}::bigint
  )`);

  return sql`
    UNION ALL
    SELECT semantic_candidates.id, semantic_candidates.source, semantic_candidates.rank
    FROM (VALUES ${sql.join(values, sql`, `)}) AS semantic_candidates(id, source, rank)
    INNER JOIN ${products} ON ${products.id} = semantic_candidates.id
    WHERE ${where}
  `;
}

async function addAvailableSizes(productRows: CatalogProductRow[]): Promise<CatalogProduct[]> {
  const productIds = productRows.map((product) => product.id);
  const availableVariantRows = productIds.length > 0
    ? await db
        .select({
          productId: productVariants.productId,
          size: productVariants.size,
        })
        .from(productVariants)
        .where(and(inArray(productVariants.productId, productIds), gt(productVariants.stock, 0)))
    : [];

  const availableSizesByProductId = availableVariantRows.reduce<Map<string, Set<string>>>((acc, variant) => {
    const sizes = acc.get(variant.productId) || new Set<string>();
    sizes.add(variant.size);
    acc.set(variant.productId, sizes);
    return acc;
  }, new Map());

  return productRows.map((product) => {
    const availableSizes = Array.from(availableSizesByProductId.get(product.id) || []);
    return {
      ...product,
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      availableSizes: availableSizes.length > 0
        ? availableSizes
        : product.stock > 0
          ? product.sizes || []
          : [],
    };
  });
}

export async function getCatalogProducts(query: CatalogQuery = {}) {
  const search = query.search?.trim();
  if (search) {
    return getHybridCatalogProducts({ ...query, search });
  }

  const where = buildCatalogConditions(query);
  const productQuery = db
    .select(catalogProductColumns)
    .from(products)
    .where(where)
    .orderBy(desc(products.displayOrder), desc(products.createdAt));

  const productRowsPromise: Promise<CatalogProductRow[]> = (
    query.limit === undefined
      ? productQuery
      : productQuery.limit(query.limit).offset(query.offset || 0)
  ).then((rows) => rows as CatalogProductRow[]);

  const [productRows, countRows] = await Promise.all([
    productRowsPromise,
    query.includeTotal
      ? db.select({ count: sql<number>`count(*)` }).from(products).where(where)
      : Promise.resolve([{ count: 0 }]),
  ]);

  const productsWithAvailableSizes = await addAvailableSizes(productRows);

  return {
    products: productsWithAvailableSizes,
    total: query.includeTotal ? Number(countRows[0]?.count || 0) : productsWithAvailableSizes.length,
    limit: query.limit ?? productsWithAvailableSizes.length,
    offset: query.offset || 0,
  };
}

async function getHybridCatalogProducts(query: CatalogQuery & { search: string }) {
  const limit = query.limit ?? 24;
  const offset = query.offset ?? 0;
  const where = buildCatalogSqlConditions(query);
  let semanticCandidates: SemanticProductCandidate[] = [];

  if (query.search.length >= 2) {
    try {
      const embedding = await generateProductQuerySearchEmbedding(query.search);
      semanticCandidates = await queryProductSemanticCandidates({
        embedding,
        filter: buildPineconeMetadataFilter(query),
        topK: 80,
      });
    } catch (error) {
      console.warn(
        "Semantic product search unavailable; falling back to lexical ranking.",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  const result = await db.execute<CatalogProductRow & { total: number }>(sql`
    WITH search_query AS (
      SELECT
        websearch_to_tsquery('english', ${query.search}) AS ts_query,
        lower(${query.search}) AS normalized_query,
        lower(${query.search}) || '%' AS prefix_query,
        '%' || lower(${query.search}) || '%' AS contains_query
    ),
    candidates AS (
      SELECT id, 'exact' AS source, exact_rank AS rank
      FROM (
        SELECT
          ${products.id} AS id,
          row_number() OVER (
            ORDER BY ${products.displayOrder} DESC,
                     ${products.createdAt} DESC
          ) AS exact_rank
        FROM ${products}, search_query
        WHERE ${where}
          AND (
            lower(${products.name}) = search_query.normalized_query
            OR lower(${products.category}::text) = search_query.normalized_query
            OR lower(${products.gender}::text) = search_query.normalized_query
          )
        LIMIT 80
      ) exact_matches

      UNION ALL

      SELECT id, 'prefix' AS source, prefix_rank AS rank
      FROM (
        SELECT
          ${products.id} AS id,
          row_number() OVER (
            ORDER BY ${products.displayOrder} DESC,
                     ${products.createdAt} DESC
          ) AS prefix_rank
        FROM ${products}, search_query
        WHERE ${where}
          AND lower(${products.name}) LIKE search_query.prefix_query
        LIMIT 80
      ) prefix_matches

      UNION ALL

      SELECT id, 'substring' AS source, substring_rank AS rank
      FROM (
        SELECT
          ${products.id} AS id,
          row_number() OVER (
            ORDER BY ${products.displayOrder} DESC,
                     ${products.createdAt} DESC
          ) AS substring_rank
        FROM ${products}, search_query
        WHERE ${where}
          AND lower(${products.searchText}) LIKE search_query.contains_query
        LIMIT 80
      ) substring_matches

      UNION ALL

      SELECT id, 'keyword' AS source, keyword_rank AS rank
      FROM (
        SELECT
          ${products.id} AS id,
          row_number() OVER (
            ORDER BY ts_rank_cd(${products.searchTokens}, search_query.ts_query) DESC,
                     ${products.displayOrder} DESC,
                     ${products.createdAt} DESC
          ) AS keyword_rank
        FROM ${products}, search_query
        WHERE ${where}
          AND ${products.searchTokens} @@ search_query.ts_query
        LIMIT 80
      ) keyword_matches

      UNION ALL

      SELECT id, 'typo' AS source, typo_rank AS rank
      FROM (
        SELECT
          ${products.id} AS id,
          row_number() OVER (
            ORDER BY word_similarity(${query.search}, ${products.name}) DESC,
                     similarity(${products.name}, ${query.search}) DESC,
                     ${products.displayOrder} DESC,
                     ${products.createdAt} DESC
          ) AS typo_rank
        FROM ${products}
        WHERE ${where}
          AND (
            similarity(${products.name}, ${query.search}) > 0.18
            OR word_similarity(${query.search}, ${products.name}) > 0.25
          )
        LIMIT 80
      ) typo_matches

      ${semanticCandidateSql(semanticCandidates, where)}
    ),
    fused AS (
      SELECT
        id,
        sum(
          CASE source
            WHEN 'exact' THEN 100.0 + (1.0 / (60 + rank))
            WHEN 'prefix' THEN 80.0 + (1.0 / (60 + rank))
            WHEN 'substring' THEN 60.0 + (1.0 / (60 + rank))
            WHEN 'keyword' THEN 30.0 + (1.3 / (60 + rank))
            WHEN 'typo' THEN 20.0 + (0.9 / (60 + rank))
            WHEN 'text_semantic' THEN 10.0 + (1.0 / (60 + rank))
            WHEN 'image_semantic' THEN 8.0 + (0.8 / (60 + rank))
            ELSE 0
          END
        ) AS search_score
      FROM candidates
      GROUP BY id
    ),
    ranked_products AS (
      SELECT
        ${products.id} AS id,
        ${products.name} AS name,
        ${products.slug} AS slug,
        ${products.sellingPrice} AS "sellingPrice",
        ${products.mrp} AS mrp,
        ${products.maxBargainDiscount} AS "maxBargainDiscount",
        ${products.images} AS images,
        ${products.category} AS category,
        ${products.gender} AS gender,
        ${products.sizes} AS sizes,
        ${products.colors} AS colors,
        ${products.isNew} AS "isNew",
        ${products.isFeatured} AS "isFeatured",
        ${products.isPremium} AS "isPremium",
        ${products.stock} AS stock,
        count(*) OVER() AS total
      FROM fused
      INNER JOIN ${products} ON ${products.id} = fused.id
      ORDER BY fused.search_score DESC, ${products.displayOrder} DESC, ${products.createdAt} DESC
      LIMIT ${limit}
      OFFSET ${offset}
    )
    SELECT * FROM ranked_products
  `);

  const productRows = result.rows as (CatalogProductRow & { total: number })[];
  const productsWithAvailableSizes = await addAvailableSizes(productRows);

  return {
    products: productsWithAvailableSizes,
    total: Number(productRows[0]?.total || 0),
    limit,
    offset,
  };
}


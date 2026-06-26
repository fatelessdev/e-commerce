import { db } from "@/lib/db";
import { combos, productRecommendations, products, productVariants } from "@/lib/db/schema";
import { mergeRelatedProductIds, PRODUCT_RECOMMENDATION_LIMIT } from "@/lib/product-recommendations";
import { isProductUuid } from "@/lib/seo";
import { and, asc, desc, eq, gt, inArray, or } from "drizzle-orm";
import { cache } from "react";

type ProductRow = typeof products.$inferSelect;
type ProductVariantRow = typeof productVariants.$inferSelect;
type ComboRow = typeof combos.$inferSelect;
type RelatedProductRow = Pick<
  ProductRow,
  | "id"
  | "name"
  | "slug"
  | "mrp"
  | "sellingPrice"
  | "images"
  | "sizes"
  | "stock"
  | "category"
  | "gender"
  | "displayOrder"
  | "createdAt"
>;

type RelatedCombo = ComboRow & {
  productA: ProductRow & { variants: ProductVariantRow[] };
  productB: ProductRow & { variants: ProductVariantRow[] };
};

type RelatedProduct = Pick<
  RelatedProductRow,
  "id" | "name" | "slug" | "mrp" | "sellingPrice" | "images" | "sizes" | "stock"
> & {
  availableSizes: string[];
};

export type ProductDetails = ProductRow & {
  variants: ProductVariantRow[];
  relatedCombos: RelatedCombo[];
  relatedProducts: RelatedProduct[];
};

export async function getActiveProductStaticParams() {
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.displayOrder), desc(products.createdAt));

  return rows.map((product) => ({ slug: product.slug }));
}

const relatedProductColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  mrp: products.mrp,
  sellingPrice: products.sellingPrice,
  images: products.images,
  sizes: products.sizes,
  stock: products.stock,
  category: products.category,
  gender: products.gender,
  displayOrder: products.displayOrder,
  createdAt: products.createdAt,
};

function getRelatedScore(
  target: { category: string; gender: string },
  candidate: { category: string; gender: string }
) {
  let score = 0;

  if (candidate.category === target.category) {
    score += 4;
  }

  if (candidate.gender === target.gender) {
    score += 3;
  } else if (target.gender !== "unisex" && candidate.gender === "unisex") {
    score += 2;
  }

  return score;
}

export const getProductDetails = cache(async function getProductDetails(
  id: string,
  options: { includeInactive?: boolean } = {}
): Promise<ProductDetails | null> {
  return getProductDetailsByIdUncached(id, options);
});

export const getProductDetailsBySlugOrId = cache(async function getProductDetailsBySlugOrId(
  slugOrId: string,
  options: { includeInactive?: boolean } = {}
): Promise<ProductDetails | null> {
  return getProductDetailsBySlugOrIdUncached(slugOrId, options);
});

async function getProductDetailsByIdUncached(
  id: string,
  options: { includeInactive?: boolean } = {}
): Promise<ProductDetails | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(
      options.includeInactive
        ? eq(products.id, id)
        : and(eq(products.id, id), eq(products.isActive, true))
    );

  if (!product) return null;

  const variantsPromise = db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id));

  const comboRows = await db
    .select()
    .from(combos)
    .where(
      and(
        eq(combos.isActive, true),
        or(eq(combos.productAId, id), eq(combos.productBId, id))
      )
    )
    .orderBy(desc(combos.displayOrder), desc(combos.createdAt));

  let relatedCombos: RelatedCombo[] = [];

  if (comboRows.length > 0) {
    const comboProductIds = Array.from(
      new Set(comboRows.flatMap((combo) => [combo.productAId, combo.productBId]))
    );

    const [comboProducts, comboVariants] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(inArray(products.id, comboProductIds), eq(products.isActive, true))),
      db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, comboProductIds)),
    ]);

    const productMap = new Map(comboProducts.map((row) => [row.id, row]));
    const variantsByProductId = comboVariants.reduce<Map<string, ProductVariantRow[]>>(
      (acc, variant) => {
        const existing = acc.get(variant.productId) || [];
        existing.push(variant);
        acc.set(variant.productId, existing);
        return acc;
      },
      new Map()
    );

    relatedCombos = comboRows
      .map((combo): RelatedCombo | null => {
        const productA = productMap.get(combo.productAId);
        const productB = productMap.get(combo.productBId);

        if (!productA || !productB) return null;

        return {
          ...combo,
          productA: {
            ...productA,
            images: productA.images || [],
            sizes: productA.sizes || [],
            colors: productA.colors || [],
            variants: variantsByProductId.get(productA.id) || [],
          },
          productB: {
            ...productB,
            images: productB.images || [],
            sizes: productB.sizes || [],
            colors: productB.colors || [],
            variants: variantsByProductId.get(productB.id) || [],
          },
        };
      })
      .filter((combo): combo is RelatedCombo => combo !== null);
  }

  const excludedIds = new Set([
    id,
    ...comboRows.map((combo) => (combo.productAId === id ? combo.productBId : combo.productAId)),
  ]);

  const [variants, storedRecommendationRows] = await Promise.all([
    variantsPromise,
    db
      .select({ id: products.id })
      .from(productRecommendations)
      .innerJoin(products, eq(productRecommendations.recommendedProductId, products.id))
      .where(and(
        eq(productRecommendations.sourceProductId, id),
        eq(products.isActive, true)
      ))
      .orderBy(asc(productRecommendations.rank))
      .limit(PRODUCT_RECOMMENDATION_LIMIT + excludedIds.size),
  ]);

  const storedRecommendationIds = storedRecommendationRows.map((row) => row.id);
  const hasStoredRecommendations = storedRecommendationRows.length > 0;
  let heuristicIds: string[] = [];
  let newestIds: string[] = [];

  if (!hasStoredRecommendations) {
    const fallbackProducts = await db
      .select(relatedProductColumns)
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.displayOrder), desc(products.createdAt))
      .limit(80);

    heuristicIds = fallbackProducts
      .filter((candidate) => !excludedIds.has(candidate.id) && getRelatedScore(product, candidate) > 0)
      .sort((a, b) => {
        const scoreDelta = getRelatedScore(product, b) - getRelatedScore(product, a);
        if (scoreDelta !== 0) return scoreDelta;
        if (b.displayOrder !== a.displayOrder) return b.displayOrder - a.displayOrder;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .map((candidate) => candidate.id);

    newestIds = fallbackProducts.map((candidate) => candidate.id);
  }

  const relatedProductIds = mergeRelatedProductIds({
    storedIds: storedRecommendationIds,
    heuristicIds,
    newestIds,
    excludedIds,
    limit: PRODUCT_RECOMMENDATION_LIMIT,
  });

  const relatedProductRows = relatedProductIds.length > 0
    ? await db
        .select(relatedProductColumns)
        .from(products)
        .where(and(inArray(products.id, relatedProductIds), eq(products.isActive, true)))
    : [];
  const relatedProductRowMap = new Map(relatedProductRows.map((row) => [row.id, row]));
  const relatedProducts = relatedProductIds
    .map((relatedId) => relatedProductRowMap.get(relatedId))
    .filter((row): row is RelatedProductRow => row !== undefined);
  const relatedAvailableVariantRows = relatedProductIds.length > 0
    ? await db
        .select({
          productId: productVariants.productId,
          size: productVariants.size,
        })
        .from(productVariants)
        .where(and(inArray(productVariants.productId, relatedProductIds), gt(productVariants.stock, 0)))
    : [];
  const relatedSizesByProductId = relatedAvailableVariantRows.reduce<Map<string, Set<string>>>(
    (acc, variant) => {
      const sizes = acc.get(variant.productId) || new Set<string>();
      sizes.add(variant.size);
      acc.set(variant.productId, sizes);
      return acc;
    },
    new Map()
  );
  const relatedProductsWithAvailableSizes = relatedProducts.map((row) => {
    const availableSizes = Array.from(relatedSizesByProductId.get(row.id) || []);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      mrp: row.mrp,
      sellingPrice: row.sellingPrice,
      images: row.images || [],
      sizes: row.sizes || [],
      stock: row.stock,
      availableSizes: availableSizes.length > 0
        ? availableSizes
        : row.stock > 0
          ? row.sizes || []
          : [],
    };
  });

  return { ...product, variants, relatedCombos, relatedProducts: relatedProductsWithAvailableSizes };
}

async function getProductDetailsBySlugOrIdUncached(
  slugOrId: string,
  options: { includeInactive?: boolean } = {}
) {
  const identityCondition = isProductUuid(slugOrId)
    ? or(eq(products.slug, slugOrId), eq(products.id, slugOrId))
    : eq(products.slug, slugOrId);

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      options.includeInactive
        ? identityCondition
        : and(eq(products.isActive, true), identityCondition)
    );

  if (!product) return null;
  return getProductDetailsByIdUncached(product.id, options);
}

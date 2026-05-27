import { db } from "@/lib/db";
import { combos, products, productVariants } from "@/lib/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { and, desc, eq, gt, inArray, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

type ProductRow = typeof products.$inferSelect;
type ProductVariantRow = typeof productVariants.$inferSelect;
type ComboRow = typeof combos.$inferSelect;

type RelatedCombo = ComboRow & {
  productA: ProductRow & { variants: ProductVariantRow[] };
  productB: ProductRow & { variants: ProductVariantRow[] };
};

export type ProductDetails = ProductRow & {
  variants: ProductVariantRow[];
  relatedCombos: RelatedCombo[];
  relatedProducts: (ProductRow & { availableSizes: string[] })[];
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

export async function getProductDetails(
  id: string,
  options: { includeInactive?: boolean } = {}
): Promise<ProductDetails | null> {
  if (options.includeInactive) {
    return getProductDetailsUncached(id, options);
  }

  return getCachedProductDetails(id);
}

async function getCachedProductDetails(id: string) {
  "use cache";

  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);
  cacheTag(CACHE_TAGS.product(id));

  return getProductDetailsUncached(id);
}

async function getProductDetailsUncached(
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

  const [variants, candidateProducts] = await Promise.all([
    variantsPromise,
    db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.displayOrder), desc(products.createdAt))
      .limit(80),
  ]);

  const relatedProducts = candidateProducts
    .filter((candidate) => !excludedIds.has(candidate.id))
    .sort((a, b) => getRelatedScore(product, b) - getRelatedScore(product, a))
    .slice(0, 8);
  const relatedProductIds = relatedProducts.map((row) => row.id);
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
      ...row,
      availableSizes: availableSizes.length > 0
        ? availableSizes
        : row.stock > 0
          ? row.sizes || []
          : [],
    };
  });

  return { ...product, variants, relatedCombos, relatedProducts: relatedProductsWithAvailableSizes };
}

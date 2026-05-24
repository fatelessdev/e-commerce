import { db } from "@/lib/db";
import { combos, products, productVariants } from "@/lib/db/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";

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
  relatedProducts: ProductRow[];
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

  return { ...product, variants, relatedCombos, relatedProducts };
}

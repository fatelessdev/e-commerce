import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, combos } from "@/lib/db/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { isAdmin } from "@/lib/auth-server";

type ProductRow = typeof products.$inferSelect;
type ProductVariantRow = typeof productVariants.$inferSelect;
type ComboRow = typeof combos.$inferSelect;

type RelatedCombo = ComboRow & {
  productA: ProductRow & { variants: ProductVariantRow[] };
  productB: ProductRow & { variants: ProductVariantRow[] };
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      const admin = await isAdmin();
      if (!admin) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
    }

    // Fetch variants for this product
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id));

    // Fetch combos this product is in
    let relatedCombos: RelatedCombo[] = [];

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

    if (comboRows.length > 0) {
      // Fetch all products needed for these combos
      const comboProductIds = Array.from(
        new Set(comboRows.flatMap((combo) => [combo.productAId, combo.productBId]))
      );

      const comboProducts = await db
        .select()
        .from(products)
        .where(and(inArray(products.id, comboProductIds), eq(products.isActive, true)));

      const comboVariants = await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, comboProductIds));

      const productMap = new Map(comboProducts.map((p) => [p.id, p]));
      const variantsByProductId = comboVariants.reduce<Map<string, typeof comboVariants>>(
        (acc, variant) => {
          const existing = acc.get(variant.productId) || [];
          existing.push(variant);
          acc.set(variant.productId, existing);
          return acc;
        },
        new Map()
      );

      const mappedCombos = comboRows
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
        });

      relatedCombos = mappedCombos.filter((combo): combo is RelatedCombo => combo !== null);
    }

    const excludedIds = new Set([
      id,
      ...comboRows.map((combo) => (combo.productAId === id ? combo.productBId : combo.productAId)),
    ]);

    const candidateProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.displayOrder), desc(products.createdAt))
      .limit(80);

    const fallbackProducts = candidateProducts
      .filter((candidate) => !excludedIds.has(candidate.id))
      .sort((a, b) => getRelatedScore(product, b) - getRelatedScore(product, a));

    const relatedProducts = fallbackProducts.slice(0, 8);

    return NextResponse.json({ ...product, variants, relatedCombos, relatedProducts });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { combos, products, productVariants } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [combo] = await db
      .select()
      .from(combos)
      .where(and(eq(combos.id, id), eq(combos.isActive, true)));

    if (!combo) {
      return NextResponse.json(
        { error: "Combo not found" },
        { status: 404 }
      );
    }

    const [comboProducts, variants] = await Promise.all([
      db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, [combo.productAId, combo.productBId]),
            eq(products.isActive, true)
          )
        ),
      db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, [combo.productAId, combo.productBId])),
    ]);

    // Build product map
    const productMap = new Map(comboProducts.map((product) => [product.id, product]));

    // Validate both products exist
    const productA = productMap.get(combo.productAId);
    const productB = productMap.get(combo.productBId);

    if (!productA || !productB) {
      return NextResponse.json(
        { error: "One or both products in combo are unavailable" },
        { status: 404 }
      );
    }

    // Group variants by product
    const variantsByProductId = variants.reduce<Map<string, typeof variants>>(
      (acc, variant) => {
        const existing = acc.get(variant.productId) || [];
        existing.push(variant);
        acc.set(variant.productId, existing);
        return acc;
      },
      new Map()
    );

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Failed to fetch combo:", error);
    return NextResponse.json(
      { error: "Failed to fetch combo" },
      { status: 500 }
    );
  }
}

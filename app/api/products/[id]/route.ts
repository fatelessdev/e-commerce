import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, combos } from "@/lib/db/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { isAdmin } from "@/lib/auth-server";

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

    let comboLinkedProducts: Array<typeof product> = [];

    if (product.category === "shirt") {
      const comboRows = await db
        .select({
          productAId: combos.productAId,
          productBId: combos.productBId,
        })
        .from(combos)
        .where(
          and(
            eq(combos.isActive, true),
            or(eq(combos.productAId, id), eq(combos.productBId, id))
          )
        )
        .orderBy(desc(combos.displayOrder), desc(combos.createdAt));

      const linkedIds = Array.from(
        new Set(
          comboRows.map((combo) => (combo.productAId === id ? combo.productBId : combo.productAId))
        )
      );

      if (linkedIds.length > 0) {
        const linkedProducts = await db
          .select()
          .from(products)
          .where(and(inArray(products.id, linkedIds), eq(products.isActive, true)));

        const linkedMap = new Map(linkedProducts.map((linkedProduct) => [linkedProduct.id, linkedProduct]));
        comboLinkedProducts = linkedIds
          .map((linkedId) => linkedMap.get(linkedId))
          .filter((linkedProduct): linkedProduct is typeof product => Boolean(linkedProduct));
      }
    }

    const excludedIds = new Set([id, ...comboLinkedProducts.map((linkedProduct) => linkedProduct.id)]);

    const candidateProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.displayOrder), desc(products.createdAt))
      .limit(80);

    const fallbackProducts = candidateProducts
      .filter((candidate) => !excludedIds.has(candidate.id))
      .sort((a, b) => getRelatedScore(product, b) - getRelatedScore(product, a));

    const relatedProducts = [
      ...comboLinkedProducts,
      ...fallbackProducts,
    ].slice(0, 8);

    return NextResponse.json({ ...product, variants, relatedProducts });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

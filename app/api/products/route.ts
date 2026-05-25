import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productVariants, products } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, gte, lte, sql, inArray, gt } from "drizzle-orm";
import { parsePublicProductPagination } from "@/lib/checkout-validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const category = searchParams.get("category");
    const gender = searchParams.get("gender");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const isNew = searchParams.get("isNew");
    const isFeatured = searchParams.get("isFeatured");
    const { limit, offset } = parsePublicProductPagination(
      searchParams.get("limit"),
      searchParams.get("offset")
    );

    const conditions = [eq(products.isActive, true)];

    if (category) {
      conditions.push(eq(products.category, category as typeof products.category.enumValues[number]));
    }

    if (gender) {
      // Include unisex products in both men and women filters
      conditions.push(
        or(
          eq(products.gender, gender as typeof products.gender.enumValues[number]),
          eq(products.gender, "unisex")
        )!
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )!
      );
    }

    if (minPrice) {
      conditions.push(gte(products.sellingPrice, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(products.sellingPrice, maxPrice));
    }

    if (isNew === "true") {
      conditions.push(eq(products.isNew, true));
    }

    if (isFeatured === "true") {
      conditions.push(eq(products.isFeatured, true));
    }

    // Parallelize data fetch and total count queries to reduce latency
    const [result, [{ count }]] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.displayOrder), desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions))
    ]);

    const productIds = result.map((product) => product.id);
    const availableVariantRows = productIds.length > 0
      ? await db
          .select({
            productId: productVariants.productId,
            size: productVariants.size,
          })
          .from(productVariants)
          .where(
            and(
              inArray(productVariants.productId, productIds),
              gt(productVariants.stock, 0)
            )
          )
      : [];

    const availableSizesByProductId = availableVariantRows.reduce<Map<string, Set<string>>>(
      (acc, variant) => {
        const sizes = acc.get(variant.productId) || new Set<string>();
        sizes.add(variant.size);
        acc.set(variant.productId, sizes);
        return acc;
      },
      new Map()
    );

    const productsWithAvailableSizes = result.map((product) => {
      const availableSizes = Array.from(availableSizesByProductId.get(product.id) || []);
      return {
        ...product,
        availableSizes: availableSizes.length > 0
          ? availableSizes
          : product.stock > 0
            ? product.sizes || []
            : [],
      };
    });

    return NextResponse.json({
      products: productsWithAvailableSizes,
      total: Number(count),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

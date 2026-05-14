import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, gte, lte, sql } from "drizzle-orm";
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

    return NextResponse.json({
      products: result,
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

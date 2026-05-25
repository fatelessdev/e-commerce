import { NextRequest, NextResponse } from "next/server";
import { parsePublicProductPagination } from "@/lib/checkout-validation";
import { getCatalogProducts } from "@/lib/product-catalog";

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

    const result = await getCatalogProducts({
      category,
      gender,
      search,
      minPrice,
      maxPrice,
      isNew: isNew === "true",
      isFeatured: isFeatured === "true",
      limit,
      offset,
      includeTotal: true,
    });

    return NextResponse.json({
      products: result.products,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

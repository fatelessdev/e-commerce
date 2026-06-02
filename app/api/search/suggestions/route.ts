import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getCatalogProducts } from "@/lib/product-catalog";

export async function GET(req: NextRequest) {
  await connection();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const result = await getCatalogProducts({
      search: query,
      limit: 6,
      offset: 0,
      includeTotal: false,
    });

    return NextResponse.json({ products: result.products });
  } catch (error) {
    console.error("Failed to fetch search suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch search suggestions" },
      { status: 500 },
    );
  }
}

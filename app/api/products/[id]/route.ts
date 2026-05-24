import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-server";
import { getProductDetails } from "@/lib/product-detail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await isAdmin();
    const product = await getProductDetails(id, { includeInactive: admin });

    if (!product || (!product.isActive && !admin)) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

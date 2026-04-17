import { NextRequest, NextResponse } from "next/server";
import { getActiveCombosWithProducts } from "@/lib/combos";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit") || "6");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 6;

    const comboList = await getActiveCombosWithProducts(limit);

    return NextResponse.json({
      combos: comboList,
      total: comboList.length,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch combos:", error);
    return NextResponse.json(
      { error: "Failed to fetch combos" },
      { status: 500 }
    );
  }
}

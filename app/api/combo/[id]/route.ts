import { NextRequest, NextResponse } from "next/server";
import { getComboDetails } from "@/lib/combos";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const combo = await getComboDetails(id);

    if (!combo) {
      return NextResponse.json(
        { error: "Combo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(combo);
  } catch (error) {
    console.error("Failed to fetch combo:", error);
    return NextResponse.json(
      { error: "Failed to fetch combo" },
      { status: 500 }
    );
  }
}

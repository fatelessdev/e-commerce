import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupon-validation";
import { getServerSession } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json();
    
    if (!code || orderTotal === undefined) {
      return NextResponse.json(
        { valid: false, error: "Code and order total are required" },
        { status: 400 }
      );
    }

    const session = await getServerSession();
    const userId = session?.user?.id;

    const result = await validateCoupon(code, orderTotal, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}

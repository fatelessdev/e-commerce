import { NextRequest, NextResponse } from "next/server";
import { createOrderFromQuote } from "@/lib/actions/orders";
import { getServerSession } from "@/lib/auth-server";
import { COD_ALLOWED_PINCODES } from "@/lib/constants";
import { CheckoutQuoteError, createCheckoutQuote } from "@/lib/checkout/quote";

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();

    if (body.paymentMethod !== "cod") {
      return NextResponse.json(
        { success: false, error: "Invalid payment method for this endpoint" },
        { status: 400 }
      );
    }

    // Only allow COD for specific pincodes
    if (!COD_ALLOWED_PINCODES.includes(body.shippingAddress?.pincode)) {
      return NextResponse.json(
        { success: false, error: "Cash on Delivery is not available for this pincode" },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    const session = await getServerSession();
    const quote = await createCheckoutQuote({
      items: body.items,
      couponCode: body.couponCode,
      paymentMethod: "cod",
      userId: session?.user?.id,
    });

    const result = await createOrderFromQuote({
      quote,
      shippingAddress: body.shippingAddress,
      paymentMethod: "cod",
    });

    if (!result.success) {
      const status = result.error?.toLowerCase().includes("authentication required")
        ? 401
        : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CheckoutQuoteError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import razorpay from "@/lib/razorpay";
import { getServerSession } from "@/lib/auth-server";
import { CheckoutQuoteError, createCheckoutQuote } from "@/lib/checkout/quote";

export async function POST(req: NextRequest) {
  try {
    const { items, couponCode, receipt } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    const session = await getServerSession();
    const quote = await createCheckoutQuote({
      items,
      couponCode,
      paymentMethod: "upi",
      userId: session?.user?.id,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(quote.total * 100),
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      quote: {
        subtotal: quote.subtotal,
        shippingCost: quote.shippingCost,
        discount: quote.discount,
        total: quote.total,
      },
    });
  } catch (error) {
    if (error instanceof CheckoutQuoteError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

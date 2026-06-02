import { NextRequest, NextResponse } from "next/server";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { createOrderFromQuote } from "@/lib/actions/orders";
import razorpay from "@/lib/razorpay";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { CheckoutQuoteError, createCheckoutQuote } from "@/lib/checkout/quote";
import { assertRazorpayAmountMatchesQuote } from "@/lib/checkout/pricing";

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification parameters" },
        { status: 400 }
      );
    }

    if (!orderData?.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order payload" },
        { status: 400 }
      );
    }

    if (!["upi", "card", "netbanking"].includes(orderData.paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment method for online payment verification" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = validatePaymentVerification(
      {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      },
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        or(
          eq(orders.razorpayPaymentId, razorpay_payment_id),
          eq(orders.razorpayOrderId, razorpay_order_id)
        )
      );

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
      });
    }

    const session = await getServerSession();
    const quote = await createCheckoutQuote({
      items: orderData.items,
      couponCode: orderData.couponCode,
      paymentMethod: orderData.paymentMethod,
      userId: session?.user?.id,
    });

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (
      payment.order_id !== razorpay_order_id ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return NextResponse.json(
        { success: false, error: "Payment is not captured for this order" },
        { status: 400 }
      );
    }

    // Fetch the Razorpay order to verify the paid amount matches
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    try {
      assertRazorpayAmountMatchesQuote({
        quoteTotal: quote.total,
        orderAmountInPaise: Number(rzpOrder.amount),
        capturedAmountInPaise: Number(payment.amount),
      });
    } catch (error) {
      console.error(`Amount mismatch: order ₹${Number(rzpOrder.amount) / 100}, captured ₹${Number(payment.amount) / 100}, expected ₹${quote.total}`);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "Payment amount mismatch. Please contact support." },
        { status: 400 }
      );
    }

    // Payment verified & amount validated — create the order with server-computed values
    const result = await createOrderFromQuote({
      quote,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
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

    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { createOrder } from "@/lib/actions/orders";
import razorpay from "@/lib/razorpay";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { validateCoupon } from "@/lib/actions/admin";
import { getServerSession } from "@/lib/auth-server";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

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

    // --- Server-side amount verification ---
    // Recalculate total from actual DB prices to prevent tampering
    let serverSubtotal = 0;

    // Batch fetch product prices to avoid N+1 queries
    const productIds = orderData.items.map((item: { productId: string }) => item.productId);

    const productsData = productIds.length > 0 ? await db
      .select({ id: products.id, sellingPrice: products.sellingPrice, name: products.name })
      .from(products)
      .where(inArray(products.id, productIds)) : [];

    const productDataMap = new Map(
      productsData.map(p => [p.id, { price: parseFloat(p.sellingPrice), name: p.name }])
    );

    for (const item of orderData.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid item quantity" },
          { status: 400 }
        );
      }

      const productInfo = productDataMap.get(item.productId);

      if (!productInfo) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      const itemTotal = productInfo.price * item.quantity;
      serverSubtotal += itemTotal;
    }

    const serverShipping = serverSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    // Validate coupon using canonical rules (expiry, usage limits, min order, etc.)
    let couponDiscount = 0;
    if (orderData.couponCode) {
      const session = await getServerSession();
      const couponResult = await validateCoupon(orderData.couponCode, serverSubtotal, session?.user?.id);
      if (couponResult.valid && couponResult.discount) {
        couponDiscount = couponResult.discount;
      }
    }

    const serverDiscount = couponDiscount;
    const serverTotal = serverSubtotal + serverShipping - serverDiscount;

    // Fetch the Razorpay order to verify the paid amount matches
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    const paidAmountInRupees = Number(rzpOrder.amount) / 100;

    // Allow ₹1 tolerance for rounding
    if (Math.abs(paidAmountInRupees - serverTotal) > 1) {
      console.error(
        `Amount mismatch: paid ₹${paidAmountInRupees}, expected ₹${serverTotal}`
      );
      return NextResponse.json(
        { success: false, error: "Payment amount mismatch. Please contact support." },
        { status: 400 }
      );
    }

    // Payment verified & amount validated — create the order with server-computed values
    const result = await createOrder({
      items: orderData.items,
      subtotal: serverSubtotal,
      shippingCost: serverShipping,
      discount: serverDiscount,
      couponDiscount,
      couponCode: orderData.couponCode,
      codFee: 0,
      total: serverTotal,
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
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}

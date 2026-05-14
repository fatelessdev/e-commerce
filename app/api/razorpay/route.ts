import { NextRequest, NextResponse } from "next/server";
import razorpay from "@/lib/razorpay";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { validateCoupon } from "@/lib/actions/admin";
import { getServerSession } from "@/lib/auth-server";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

type PriceCheckItem = {
  productId: string;
  quantity: number;
};

export async function POST(req: NextRequest) {
  try {
    const { items, couponCode, receipt } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    // Compute total from actual DB prices
    const cartItems = items as PriceCheckItem[];
    let subtotal = 0;

    const productIds = [...new Set(cartItems.map((item) => item.productId))];
    const productRows = productIds.length > 0 ? await db
      .select({ id: products.id, sellingPrice: products.sellingPrice })
      .from(products)
      .where(inArray(products.id, productIds)) : [];

    const productMap = new Map(productRows.map((p) => [p.id, p]));

    for (const item of cartItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid item quantity" },
          { status: 400 }
        );
      }

      const product = productMap.get(item.productId);

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      const unitPrice = parseFloat(product.sellingPrice);
      subtotal += unitPrice * item.quantity;
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    // Validate coupon using canonical rules (expiry, usage limits, min order, etc.)
    let couponDiscount = 0;
    if (couponCode) {
      const session = await getServerSession();
      const couponResult = await validateCoupon(couponCode, subtotal, session?.user?.id);
      if (couponResult.valid && couponResult.discount !== undefined) {
        couponDiscount = couponResult.discount;
      }
    }

    const discount = couponDiscount;
    const total = subtotal + shipping - discount;

    if (total <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order total" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // Convert to paise
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
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

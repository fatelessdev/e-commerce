import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/actions/orders";
import { validateCoupon } from "@/lib/actions/admin";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE } from "@/lib/constants";

export async function POST(_req: NextRequest) {
  // COD temporarily disabled
  return NextResponse.json({ success: false, error: "Cash on Delivery is not available at this time." }, { status: 503 });

  /* COD ORDER CREATION — temporarily commented out
  try {
    const body = await _req.json();

    if (body.paymentMethod !== "cod") {
      return NextResponse.json(
        { success: false, error: "Invalid payment method for this endpoint" },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    // Recompute totals from actual DB prices
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of body.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid item quantity" },
          { status: 400 }
        );
      }

      const [product] = await db
        .select({ sellingPrice: products.sellingPrice, name: products.name })
        .from(products)
        .where(eq(products.id, item.productId));

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      const realPrice = parseFloat(product.sellingPrice);
      const itemTotal = realPrice * item.quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        ...item,
        unitPrice: realPrice,
        totalPrice: itemTotal,
      });
    }

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const codFee = body.paymentMethod === "cod" ? COD_FEE : 0;

    // Validate coupon using canonical rules
    let discount = 0;
    if (body.couponCode) {
      const session = await getServerSession();
      const couponResult = await validateCoupon(body.couponCode, subtotal, session?.user?.id);
      if (couponResult.valid && couponResult.discount !== undefined) {
        discount = couponResult.discount;
      }
    }

    const total = subtotal + shippingCost + codFee - discount;

    const result = await createOrder({
      items: verifiedItems,
      subtotal,
      shippingCost,
      discount,
      couponCode: body.couponCode,
      codFee,
      total,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
    });

    if (!result.success) {
      const status = result.error?.toLowerCase().includes("authentication required")
        ? 401
        : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
  */
}

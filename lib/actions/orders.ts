"use server";

import { db } from "@/lib/db";
import { orders, orderItems, products, productVariants, user, bargainSessions, coupons } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth-server";
import { eq, desc, sql, and, isNull, inArray, or, gt, lt, lte } from "drizzle-orm";
import { getCustomerCodCancellationFailure } from "@/lib/order-cancellation";
import { calculateCouponDiscount } from "@/lib/coupon-validation";
import type { CheckoutQuote } from "@/lib/checkout/pricing";

// ============================================
// ORDER TYPES
// ============================================

export interface OrderItemInput {
  productId: string;
  productName: string;
  productImage?: string;
  size: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  comboDiscount?: number;
  couponDiscount?: number;
  couponCode?: string;
  codFee?: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export type CreateOrderFromQuoteInput = {
  quote: CheckoutQuote;
  shippingAddress: ShippingAddress;
  paymentMethod: CreateOrderInput["paymentMethod"];
  paymentStatus?: CreateOrderInput["paymentStatus"];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

type OrderMutationClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

type InventoryMutationItem = {
  productId: string | null;
  productName: string;
  size: string;
  color?: string | null;
  quantity: number;
};

function describeInventoryItem(item: InventoryMutationItem) {
  return `${item.productName} (${item.size}${item.color ? `, ${item.color}` : ""})`;
}

function variantColorCondition(item: InventoryMutationItem) {
  return item.color
    ? eq(productVariants.color, item.color)
    : isNull(productVariants.color);
}

async function productHasVariants(tx: OrderMutationClient, productId: string) {
  const [variantCountRow] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  return Number(variantCountRow?.count ?? 0) > 0;
}

async function recalculateProductStockFromVariants(tx: OrderMutationClient, productId: string) {
  const [stockRow] = await tx
    .select({ totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)` })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  await tx
    .update(products)
    .set({
      stock: Number(stockRow?.totalStock ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}

async function decrementOrderItemStock(tx: OrderMutationClient, item: InventoryMutationItem) {
  if (!item.productId) {
    throw new Error(`Product is unavailable: ${item.productName}`);
  }

  const [activeProduct] = await tx
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, item.productId), eq(products.isActive, true)));

  if (!activeProduct) {
    throw new Error(`Product is unavailable: ${item.productName}`);
  }

  if (await productHasVariants(tx, item.productId)) {
    const decrementedVariant = await tx
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productVariants.productId, item.productId),
          eq(productVariants.size, item.size),
          variantColorCondition(item),
          sql`${productVariants.stock} >= ${item.quantity}`
        )
      )
      .returning({ id: productVariants.id });

    if (decrementedVariant.length === 0) {
      const [variant] = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, item.productId),
            eq(productVariants.size, item.size),
            variantColorCondition(item)
          )
        );

      if (!variant) {
        throw new Error(`Selected variant is unavailable for ${describeInventoryItem(item)}`);
      }

      throw new Error(`Insufficient stock for ${describeInventoryItem(item)}`);
    }

    await recalculateProductStockFromVariants(tx, item.productId);
    return;
  }

  const decrementedProduct = await tx
    .update(products)
    .set({
      stock: sql`${products.stock} - ${item.quantity}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(products.id, item.productId),
        eq(products.isActive, true),
        sql`${products.stock} >= ${item.quantity}`
      )
    )
    .returning({ id: products.id });

  if (decrementedProduct.length === 0) {
    throw new Error(`Insufficient stock for ${item.productName}`);
  }
}

async function restoreOrderItemStock(tx: OrderMutationClient, item: InventoryMutationItem) {
  if (!item.productId) return null;

  if (await productHasVariants(tx, item.productId)) {
    await tx
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} + ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productVariants.productId, item.productId),
          eq(productVariants.size, item.size),
          variantColorCondition(item)
        )
      );

    await recalculateProductStockFromVariants(tx, item.productId);
    return item.productId;
  }

  await tx
    .update(products)
    .set({
      stock: sql`${products.stock} + ${item.quantity}`,
      updatedAt: new Date(),
    })
    .where(eq(products.id, item.productId));

  return item.productId;
}

// ============================================
// ORDER ACTIONS
// ============================================

async function consumeCouponForOrder(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  code: string,
  orderTotal: number,
  userId: string,
  expectedDiscount: number
) {
  const couponCode = code.toUpperCase();
  const now = new Date();

  const [coupon] = await tx
    .select()
    .from(coupons)
    .where(eq(coupons.code, couponCode));

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is no longer active");
  }

  if (coupon.isBargainGenerated && coupon.expiresAt && coupon.expiresAt < now) {
    throw new Error("This bargain code has expired. Try negotiating again!");
  }

  if (coupon.validUntil && coupon.validUntil < now) {
    throw new Error("This coupon has expired");
  }

  if (coupon.validFrom > now) {
    throw new Error("This coupon is not yet valid");
  }

  if (coupon.minOrderValue && orderTotal < parseFloat(coupon.minOrderValue)) {
    throw new Error(`Minimum order value is ₹${coupon.minOrderValue}`);
  }

  if (coupon.userId && coupon.userId !== userId) {
    throw new Error("This coupon is not valid for your account");
  }

  const discount = calculateCouponDiscount(coupon, orderTotal);
  if (Math.abs(discount - expectedDiscount) > 0.01) {
    throw new Error("Coupon discount changed. Please re-apply the coupon.");
  }

  const consumed = await tx
    .update(coupons)
    .set({
      usedCount: sql`${coupons.usedCount} + 1`,
    })
    .where(
      and(
        eq(coupons.id, coupon.id),
        eq(coupons.isActive, true),
        lte(coupons.validFrom, now),
        or(isNull(coupons.validUntil), gt(coupons.validUntil, now))!,
        or(eq(coupons.isBargainGenerated, false), isNull(coupons.expiresAt), gt(coupons.expiresAt, now))!,
        or(isNull(coupons.maxUses), lt(coupons.usedCount, coupons.maxUses))!,
        or(isNull(coupons.userId), eq(coupons.userId, userId))!,
        or(isNull(coupons.minOrderValue), lte(coupons.minOrderValue, orderTotal.toFixed(2)))!
      )
    )
    .returning();

  if (consumed.length === 0) {
    throw new Error("This coupon has reached its usage limit");
  }

  if (coupon.isBargainGenerated) {
    await tx
      .update(bargainSessions)
      .set({ used: true })
      .where(eq(bargainSessions.couponCode, couponCode));
  }

  return { code: couponCode, discount };
}

export async function createOrder(input: CreateOrderInput) {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "Authentication required. Please sign in to place an order.",
    };
  }

  let order;
  try {
    order = await db.transaction(async (tx) => {
      let couponCode: string | null = null;
      let couponDiscount = 0;

      if (input.couponCode) {
        const consumedCoupon = await consumeCouponForOrder(
          tx,
          input.couponCode,
          input.subtotal,
          userId,
          input.couponDiscount ?? input.discount
        );
        couponCode = consumedCoupon.code;
        couponDiscount = consumedCoupon.discount;
      }

      const codFee = input.codFee ?? 0;
      const discount = input.discount;
      const total = input.subtotal + input.shippingCost + codFee - discount;

      if (discount < couponDiscount) {
        throw new Error("Invalid order discount");
      }

      if (total <= 0) {
        throw new Error("Invalid order total");
      }

      const [createdOrder] = await tx
        .insert(orders)
        .values({
          userId,
          status: "pending",
          subtotal: input.subtotal.toString(),
          discount: discount.toString(),
          shipping: input.shippingCost.toString(),
          total: total.toString(),
          couponCode,
          couponDiscount: couponCode ? couponDiscount.toString() : null,
          codFee: codFee ? codFee.toString() : null,
          shippingAddress: {
            name: input.shippingAddress.name,
            phone: input.shippingAddress.phone,
            address: input.shippingAddress.address,
            city: input.shippingAddress.city,
            state: input.shippingAddress.state || "",
            pincode: input.shippingAddress.pincode,
          },
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentStatus || "pending",
          razorpayOrderId: input.razorpayOrderId || null,
          razorpayPaymentId: input.razorpayPaymentId || null,
          razorpaySignature: input.razorpaySignature || null,
        })
        .returning();

      if (input.items.length > 0) {
        const orderItemsData = input.items.map(item => ({
          orderId: createdOrder.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        }));

        await tx.insert(orderItems).values(orderItemsData);

        for (const item of input.items) {
          await decrementOrderItemStock(tx, item);
        }
      }

      await tx
        .update(user)
        .set({
          ordersCount: sql`${user.ordersCount} + 1`,
          totalSpent: sql`${user.totalSpent} + ${total}`,
          shippingAddress: {
            name: input.shippingAddress.name,
            phone: input.shippingAddress.phone,
            address: input.shippingAddress.address,
            city: input.shippingAddress.city,
            state: input.shippingAddress.state || "",
            pincode: input.shippingAddress.pincode,
          },
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      return createdOrder;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    if (
      message.toLowerCase().includes("insufficient stock") ||
      message.toLowerCase().includes("variant is unavailable") ||
      message.toLowerCase().includes("coupon") ||
      message.toLowerCase().includes("minimum order") ||
      message.toLowerCase().includes("expired") ||
      message.toLowerCase().includes("usage limit") ||
      message.toLowerCase().includes("invalid order total")
    ) {
      return {
        success: false,
        error: message,
      };
    }

    console.error("Order transaction failed:", error);
    return {
      success: false,
      error: "Failed to create order",
    };
  }

  return {
    success: true,
    orderId: order.id,
  };
}

export async function createOrderFromQuote(input: CreateOrderFromQuoteInput) {
  return createOrder({
    items: input.quote.items,
    subtotal: input.quote.subtotal,
    shippingCost: input.quote.shippingCost,
    discount: input.quote.discount,
    comboDiscount: input.quote.comboDiscount,
    couponDiscount: input.quote.couponDiscount,
    couponCode: input.quote.couponCode,
    codFee: input.quote.codFee,
    total: input.quote.total,
    shippingAddress: input.shippingAddress,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
  });
}

export async function getUserOrders() {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return [];
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));

  if (userOrders.length === 0) {
    return [];
  }

  // Fetch items for all orders in a single query
  const orderIds = userOrders.map((order) => order.id);
  const allItems = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  // Group items by orderId for O(1) lookups
  const itemsByOrderId = new Map<string, typeof allItems>();
  for (const item of allItems) {
    if (!item.orderId) continue;
    const items = itemsByOrderId.get(item.orderId) || [];
    items.push(item);
    itemsByOrderId.set(item.orderId, items);
  }

  const ordersWithItems = userOrders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id) || [],
  }));

  return ordersWithItems;
}

// ============================================
// CANCEL ORDER (COD only, pending/confirmed)
// ============================================

export async function cancelOrder(orderId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  const cancellationFailure = getCustomerCodCancellationFailure({
    orderUserId: order.userId,
    currentUserId: session.user.id,
    paymentMethod: order.paymentMethod,
    status: order.status,
  });

  if (cancellationFailure) {
    return { success: false, error: cancellationFailure };
  }

  const productIds = new Set<string>();

  try {
    await db.transaction(async (tx) => {
      const cancelledOrder = await tx
        .update(orders)
        .set({
          status: "cancelled",
          paymentStatus: "cancelled",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.userId, session.user.id),
            eq(orders.paymentMethod, "cod"),
            inArray(orders.status, ["pending", "confirmed"])
          )
        )
        .returning({ id: orders.id });

      if (cancelledOrder.length === 0) {
        throw new Error("Order is no longer cancellable");
      }

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        const restoredProductId = await restoreOrderItemStock(tx, item);
        if (restoredProductId) productIds.add(restoredProductId);
      }

      await tx
        .update(user)
        .set({
          ordersCount: sql`GREATEST(${user.ordersCount} - 1, 0)`,
          totalSpent: sql`GREATEST(${user.totalSpent} - ${Number(order.total)}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    if (message.toLowerCase().includes("no longer cancellable")) {
      return { success: false, error: "This order is no longer cancellable." };
    }
    console.error("Cancel order failed:", error);
    return { success: false, error: "Failed to cancel order" };
  }

  return { success: true };
}

// ============================================
// SHIPPING ADDRESS (saved on user profile)
// ============================================

export async function getSavedShippingAddress() {
  const session = await getServerSession();
  if (!session?.user?.id) return null;

  const [userData] = await db
    .select({
      name: user.name,
      email: user.email,
      phone: user.phone,
      shippingAddress: user.shippingAddress,
    })
    .from(user)
    .where(eq(user.id, session.user.id));

  if (!userData) return null;

  return {
    name: userData.shippingAddress?.name || userData.name,
    email: userData.email,
    phone: userData.shippingAddress?.phone || userData.phone || "",
    address: userData.shippingAddress?.address || "",
    city: userData.shippingAddress?.city || "",
    state: userData.shippingAddress?.state || "",
    pincode: userData.shippingAddress?.pincode || "",
  };
}

export async function getOrderById(orderId: string) {
  const session = await getServerSession();
  
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    return null;
  }

  // Check if user owns this order (unless admin)
  if (session?.user?.role !== "admin" && order.userId !== session?.user?.id) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return {
    ...order,
    items,
  };
}

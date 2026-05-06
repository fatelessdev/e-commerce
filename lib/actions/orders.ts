"use server";

import { db } from "@/lib/db";
import { orders, orderItems, products, productVariants, user, bargainSessions } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth-server";
import { eq, desc, sql, and, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { markCouponUsed } from "./admin";

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

// ============================================
// ORDER ACTIONS
// ============================================

export async function createOrder(input: CreateOrderInput) {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "Authentication required. Please sign in to place an order.",
    };
  }

  // Validate per-variant stock for all items
  for (const item of input.items) {
    const [variantCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productVariants)
      .where(eq(productVariants.productId, item.productId));
    const hasVariants = Number(variantCountRow?.count ?? 0) > 0;

    const colorCondition = item.color
      ? eq(productVariants.color, item.color)
      : isNull(productVariants.color);

    const [variant] = await db
      .select({ stock: productVariants.stock })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, item.productId),
          eq(productVariants.size, item.size),
          colorCondition
        )
      );

    if (!variant) {
      if (hasVariants) {
        return {
          success: false,
          error: `Selected variant is unavailable for ${item.productName} (${item.size}${item.color ? `, ${item.color}` : ""})`,
        };
      }

      // Fallback: check product-level stock only for legacy products without variants
      const [product] = await db
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, item.productId));

      if (!product || product.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.productName} (${item.size}${item.color ? `, ${item.color}` : ""})`,
        };
      }
    } else if (variant.stock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${item.productName} (${item.size}${item.color ? `, ${item.color}` : ""})`,
      };
    }
  }

  let order;
  try {
    order = await db.transaction(async (tx) => {
    const [createdOrder] = await tx
      .insert(orders)
      .values({
        userId,
        status: "pending",
        subtotal: input.subtotal.toString(),
        discount: input.discount.toString(),
        shipping: input.shippingCost.toString(),
        total: input.total.toString(),
        couponCode: input.couponCode,
        couponDiscount: input.couponCode
          ? (input.couponDiscount ?? input.discount).toString()
          : null,
        codFee: input.codFee ? input.codFee.toString() : null,
        // codRemainingAmount: input.paymentMethod === "cod" ? input.total.toString() : null, // COD temporarily disabled
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

    for (const item of input.items) {
      await tx.insert(orderItems).values({
        orderId: createdOrder.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      });

      const [variantCountRow] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .where(eq(productVariants.productId, item.productId));
      const hasVariants = Number(variantCountRow?.count ?? 0) > 0;

      if (hasVariants) {
        const colorCondition = item.color
          ? eq(productVariants.color, item.color)
          : isNull(productVariants.color);

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
              colorCondition,
              sql`${productVariants.stock} >= ${item.quantity}`
            )
          )
          .returning();

        if (decrementedVariant.length === 0) {
          throw new Error(`Insufficient stock for ${item.productName} (${item.size}${item.color ? `, ${item.color}` : ""})`);
        }

        const [stockRow] = await tx
          .select({ totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)` })
          .from(productVariants)
          .where(eq(productVariants.productId, item.productId));

        await tx
          .update(products)
          .set({
            stock: Number(stockRow?.totalStock ?? 0),
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      } else {
        const decrementedProduct = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, item.productId),
              sql`${products.stock} >= ${item.quantity}`
            )
          )
          .returning();

        if (decrementedProduct.length === 0) {
          throw new Error(`Insufficient stock for ${item.productName}`);
        }
      }
    }

      return createdOrder;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    if (message.toLowerCase().includes("insufficient stock") || message.toLowerCase().includes("variant is unavailable")) {
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

  // Mark coupon as used if applicable
  if (input.couponCode) {
    await markCouponUsed(input.couponCode);
    
    // Also mark bargain session as used if it exists
    await db
      .update(bargainSessions)
      .set({ used: true })
      .where(eq(bargainSessions.couponCode, input.couponCode));
  }

  // Update user order stats + save shipping address for next checkout
  if (userId) {
    await db
      .update(user)
      .set({
        ordersCount: sql`${user.ordersCount} + 1`,
        totalSpent: sql`${user.totalSpent} + ${input.total}`,
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
  }

  revalidatePath("/orders");
  revalidatePath("/admin/orders");

  return {
    success: true,
    orderId: order.id,
  };
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

  // ⚡ Bolt Performance Optimization: Fix N+1 Query
  // Fetch all order items in a single query instead of one query per order
  const orderIds = userOrders.map(order => order.id);
  const allItems = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  // Group items by order ID for O(1) lookup
  const itemsByOrderId = new Map<string, typeof allItems>();
  for (const item of allItems) {
    if (!itemsByOrderId.has(item.orderId)) {
      itemsByOrderId.set(item.orderId, []);
    }
    itemsByOrderId.get(item.orderId)!.push(item);
  }

  const ordersWithItems = userOrders.map(order => ({
    ...order,
    items: itemsByOrderId.get(order.id) || [],
  }));

  return ordersWithItems;
}

// ============================================
// CANCEL ORDER (COD only, pending/confirmed) — temporarily disabled
// ============================================

/* COD CANCEL ORDER — temporarily commented out
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

  if (order.userId !== session.user.id) {
    return { success: false, error: "You can only cancel your own orders" };
  }

  if (order.paymentMethod !== "cod") {
    return { success: false, error: "Only COD orders can be cancelled online. For paid orders, please contact support." };
  }

  if (!["pending", "confirmed"].includes(order.status)) {
    return { success: false, error: `Cannot cancel an order that is already ${order.status}` };
  }

  try {
    await db.transaction(async (tx) => {
      // Mark order as cancelled only if still eligible (prevents race-condition double cancel)
      const cancelledOrder = await tx
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.userId, session.user.id),
            eq(orders.paymentMethod, "cod"),
            sql`${orders.status} IN ('pending', 'confirmed')`
          )
        )
        .returning({ id: orders.id });

      if (cancelledOrder.length === 0) {
        throw new Error("Order is no longer cancellable");
      }

      // Fetch order items for stock restoration
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Restore stock for each item
      for (const item of items) {
        if (!item.productId) continue;

        const [variantCountRow] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(productVariants)
          .where(eq(productVariants.productId, item.productId));
        const hasVariants = Number(variantCountRow?.count ?? 0) > 0;

        if (hasVariants) {
          const colorCondition = item.color
            ? eq(productVariants.color, item.color)
            : isNull(productVariants.color);

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
                colorCondition
              )
            );

          // Recalculate product-level stock from variants
          const [stockRow] = await tx
            .select({ totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)` })
            .from(productVariants)
            .where(eq(productVariants.productId, item.productId));

          await tx
            .update(products)
            .set({
              stock: Number(stockRow?.totalStock ?? 0),
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        } else {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    if (message.toLowerCase().includes("no longer cancellable")) {
      return { success: false, error: "This order is no longer cancellable." };
    }
    console.error("Cancel order failed:", error);
    return { success: false, error: "Failed to cancel order" };
  }

  revalidatePath("/orders");
  revalidatePath("/admin/orders");

  return { success: true };
}
*/

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

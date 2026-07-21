"use server";

import { db } from "@/lib/db";
import { products, productVariants, coupons, orders, orderItems, walletRefunds, walletTopUps, walletReservations, walletLedgerEntries } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import { creditWallet, rupeesToPaise } from "@/lib/wallet";
import { revalidatePath } from "next/cache";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { ADMIN_PRODUCTS_PAGE_SIZE } from "@/lib/admin-products-pagination";
import { buildProductSearchText } from "@/lib/product-search";
import { getPublicProductMutationPaths } from "@/lib/public-cache";
import {
  deleteProductSearchIndexAfterMutation,
  syncProductSearchIndexAfterMutation,
} from "@/lib/product-search-index";
import { refreshProductRecommendationsAfterMutation } from "@/lib/product-recommendations";
import {
  ACCESSORY_SIZE,
  normalizeProductInput,
  normalizeProductPatch,
  type ProductInput,
} from "@/lib/admin-product-input";

export type { ProductInput } from "@/lib/admin-product-input";

// ============================================
// PRODUCT ACTIONS
// ============================================

type ProductMutationClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
type OrderShippingAddress = {
  name?: string;
};

function revalidatePublicProductMutationPaths(slugs: { nextSlug?: string | null; previousSlug?: string | null }) {
  for (const path of getPublicProductMutationPaths(slugs)) {
    revalidatePath(path);
  }
}

// Helper: recompute total stock from variants
async function recomputeProductStock(client: ProductMutationClient, productId: string) {
  const result = await client
    .select({ totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)` })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const totalStock = Number(result[0]?.totalStock ?? 0);

  await client
    .update(products)
    .set({ stock: totalStock, updatedAt: new Date() })
    .where(eq(products.id, productId));

  return totalStock;
}

// Helper: sync variants for a product (delete old, insert new)
async function syncProductVariants(
  client: ProductMutationClient,
  productId: string,
  variants: { size: string; color: string | null; stock: number }[]
) {
  // Delete all existing variants for this product
  await client.delete(productVariants).where(eq(productVariants.productId, productId));

  // Insert new variants
  if (variants.length > 0) {
    await client.insert(productVariants).values(
      variants.map((v) => ({
        productId,
        size: v.size,
        color: v.color,
        stock: v.stock,
      }))
    );
  }

  // Recompute the total stock on the product
  return recomputeProductStock(client, productId);
}

export async function createProduct(data: ProductInput) {
  await requireAdmin();
  const input = normalizeProductInput(data);

  const isAccessory = input.category === "accessory";
  const effectiveSizes = input.sizes || ["S", "M", "L", "XL"];
  const effectiveColors = input.colors || [];
  const searchText = buildProductSearchText({
    ...input,
    sizes: effectiveSizes,
    colors: effectiveColors,
  });

  const product = await db.transaction(async (tx) => {
    const [createdProduct] = await tx
      .insert(products)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        mrp: input.mrp,
        sellingPrice: input.sellingPrice,
        maxBargainDiscount: input.maxBargainDiscount || "0",
        category: input.category,
        gender: input.gender,
        tags: input.tags || [],
        stock: 0, // Will be computed from variants
        images: input.images || [],
        fabric: input.fabric,
        gsm: input.gsm,
        careInstructions: input.careInstructions || [],
        features: input.features || [],
        sizes: effectiveSizes,
        colors: effectiveColors,
        searchText,
        isNew: input.isNew ?? false,
        isFeatured: input.isFeatured ?? false,
        isPremium: input.isPremium ?? false,
        isActive: input.isActive ?? true,
        displayOrder: input.displayOrder ?? 0,
      })
      .returning();

    // Create variant rows in the same transaction as the product row.
    if (isAccessory) {
      await syncProductVariants(
        tx,
        createdProduct.id,
        input.variants || [{ size: ACCESSORY_SIZE, color: null, stock: input.stock }]
      );
    } else if (input.variants && input.variants.length > 0) {
      await syncProductVariants(tx, createdProduct.id, input.variants);
    } else {
      // Fallback: create variants from sizes × colors with the provided stock split evenly
      const variantCombos: { size: string; color: string | null; stock: number }[] = [];
      const totalVariants = effectiveSizes.length * Math.max(effectiveColors.length, 1);
      const stockPer = totalVariants > 0 ? Math.floor(input.stock / totalVariants) : 0;

      for (const size of effectiveSizes) {
        if (effectiveColors.length > 0) {
          for (const color of effectiveColors) {
            variantCombos.push({ size, color: color.name, stock: stockPer });
          }
        } else {
          variantCombos.push({ size, color: null, stock: stockPer });
        }
      }
      await syncProductVariants(tx, createdProduct.id, variantCombos);
    }

    return createdProduct;
  });

  const searchResult = await syncProductSearchIndexAfterMutation(product.id);
  if (searchResult.status !== "failed") {
    await refreshProductRecommendationsAfterMutation(product.id);
  }
  revalidatePublicProductMutationPaths({ nextSlug: product.slug });

  return product;
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  await requireAdmin();
  const input = normalizeProductPatch(data);

  const [existingProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  // Separate variants from the rest of the data
  const { variants, ...incomingData } = input;
  const nextCategory = incomingData.category ?? existingProduct.category;
  const isAccessory = nextCategory === "accessory";

  const productData: Partial<typeof products.$inferInsert> = {
    ...incomingData,
  };

  if (isAccessory) {
    productData.gender = "unisex";
    productData.fabric = null;
    productData.gsm = null;
    productData.sizes = [ACCESSORY_SIZE];
    productData.colors = [];
    productData.careInstructions = [];
    productData.features = [];
  }
  productData.searchText = buildProductSearchText({
    ...existingProduct,
    ...productData,
  });

  const product = await db.transaction(async (tx) => {
    const [updatedProduct] = await tx
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Keep accessory inventory as a single no-color variant.
    if (isAccessory) {
      const accessoryStock =
        variants?.[0]?.stock ??
        (typeof data.stock === "number" ? data.stock : existingProduct.stock);
      await syncProductVariants(tx, id, [{ size: ACCESSORY_SIZE, color: null, stock: Math.max(0, accessoryStock) }]);
    } else if (variants) {
      await syncProductVariants(tx, id, variants);
    }

    return updatedProduct;
  });

  const searchResult = await syncProductSearchIndexAfterMutation(id);
  if (searchResult.status !== "failed") {
    await refreshProductRecommendationsAfterMutation(id);
  }
  revalidatePublicProductMutationPaths({
    nextSlug: product.slug,
    previousSlug: existingProduct.slug,
  });

  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const [existingProduct] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, id));

  await db.delete(products).where(eq(products.id, id));
  await deleteProductSearchIndexAfterMutation(id);
  revalidatePublicProductMutationPaths({ previousSlug: existingProduct?.slug });

  return { success: true };
}

export async function getProducts(options?: {
  category?: string;
  gender?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  await requireAdmin();

  const conditions = [];

  if (options?.category) {
    conditions.push(eq(products.category, options.category as ProductInput["category"]));
  }
  if (options?.gender) {
    conditions.push(eq(products.gender, options.gender as ProductInput["gender"]));
  }
  if (options?.isActive !== undefined) {
    conditions.push(eq(products.isActive, options.isActive));
  }

  const result = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(products.displayOrder), desc(products.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  return result;
}

export async function getProductsPage(options?: {
  category?: string;
  gender?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.max(1, Math.min(options?.limit ?? ADMIN_PRODUCTS_PAGE_SIZE, 100));
  const offset = Math.max(0, options?.offset ?? 0);
  const rows = await getProducts({
    ...options,
    limit: limit + 1,
    offset,
  });

  return {
    products: rows.slice(0, limit),
    nextOffset: rows.length > limit ? offset + limit : null,
  };
}

export async function getProductById(id: string) {
  await requireAdmin();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  return product;
}

export async function getProductBySlug(slug: string) {
  await requireAdmin();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug));

  return product;
}

export async function getProductVariants(productId: string) {
  await requireAdmin();

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  return variants;
}

// ============================================
// COUPON ACTIONS
// ============================================

export type CouponInput = {
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: string;
  maxDiscount?: string;
  minOrderValue?: string;
  validFrom?: Date;
  validUntil?: Date;
  maxUses?: number;
  forNewUsersOnly?: boolean;
  userId?: string;
  isBargainGenerated?: boolean;
  isActive?: boolean;
};

export async function createCoupon(data: CouponInput) {
  await requireAdmin();

  const [coupon] = await db
    .insert(coupons)
    .values({
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxDiscount: data.maxDiscount,
      minOrderValue: data.minOrderValue,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      maxUses: data.maxUses,
      forNewUsersOnly: data.forNewUsersOnly ?? false,
      userId: data.userId,
      isBargainGenerated: data.isBargainGenerated ?? false,
      isActive: data.isActive ?? true,
    })
    .returning();

  return coupon;
}

export async function updateCoupon(id: string, data: Partial<CouponInput>) {
  await requireAdmin();

  const [coupon] = await db
    .update(coupons)
    .set(data)
    .where(eq(coupons.id, id))
    .returning();

  return coupon;
}

export async function deleteCoupon(id: string) {
  await requireAdmin();

  await db.delete(coupons).where(eq(coupons.id, id));

  return { success: true };
}

export async function getCoupons(options?: { isActive?: boolean }) {
  await requireAdmin();

  const conditions = [];

  if (options?.isActive !== undefined) {
    conditions.push(eq(coupons.isActive, options.isActive));
  }

  const result = await db
    .select()
    .from(coupons)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(coupons.createdAt));

  return result;
}

// ============================================
// ORDER ACTIONS
// ============================================

export async function getOrders(options?: {
  status?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  await requireAdmin();

  const conditions = [];

  if (options?.status) {
    conditions.push(eq(orders.status, options.status as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"));
  }
  if (options?.userId) {
    conditions.push(eq(orders.userId, options.userId));
  }

  const result = await db
    .select()
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  return result;
}

export async function getOrderById(id: string) {
  await requireAdmin();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id));

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  const refunds = await db.select().from(walletRefunds).where(eq(walletRefunds.orderId, id)).orderBy(desc(walletRefunds.createdAt));
  return { ...order, items, refunds };
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
) {
  await requireAdmin();

  const [order] = await db
    .update(orders)
    .set({ status, ...(status === "delivered" ? { paymentStatus: "paid" } : {}), updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  return order;
}

// ============================================
// ANALYTICS ACTIONS
// ============================================

export async function getDashboardStats(timeframe: "7d" | "30d" | "all" = "30d") {
  await requireAdmin();

  let dateLimit: Date | null = null;
  if (timeframe === "7d") {
    dateLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === "30d") {
    dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const orderConditions = [];
  const revenueConditions = [eq(orders.status, "delivered")];

  if (dateLimit) {
    orderConditions.push(gte(orders.createdAt, dateLimit));
    revenueConditions.push(gte(orders.createdAt, dateLimit));
  }

  // Run independent sequential queries concurrently to avoid waterfall requests
  const [
    [{ count: totalProducts }],
    [{ count: totalOrders }],
    [{ sum: totalRevenue }],
    [{ count: activeCoupons }],
    recentOrders
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(orderConditions.length > 0 ? and(...orderConditions) : undefined),
    db
      .select({ sum: sql<string>`COALESCE(sum(total), 0)` })
      .from(orders)
      .where(and(...revenueConditions)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(coupons)
      .where(eq(coupons.isActive, true)),
    db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        shippingAddress: orders.shippingAddress,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5)
  ]);

  return {
    totalProducts: Number(totalProducts),
    totalOrders: Number(totalOrders),
    totalRevenue: parseFloat(totalRevenue || "0"),
    activeCoupons: Number(activeCoupons),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      total: parseFloat(o.total || "0"),
      status: o.status,
      createdAt: o.createdAt,
      customerName: o.shippingAddress
        ? (o.shippingAddress as OrderShippingAddress).name
        : "Guest Customer",
    })),
  };
}

// ============================================
// WALLET REFUNDS
// ============================================

export interface IssueWalletRefundInput {
  orderId: string;
  refundAmount: number;
  reason: string;
}

/** Credits an approved paid-order refund to the account-bound wallet. */
export async function issueWalletRefund(data: IssueWalletRefundInput) {
  const admin = await requireAdmin();
  const amountPaise = rupeesToPaise(data.refundAmount);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0 || !data.reason.trim()) throw new Error("Enter a valid refund amount and reason.");
  return db.transaction(async (tx) => {
    // Lock the order row so concurrent partial refunds re-evaluate the cumulative ceiling.
    const [order] = await tx.update(orders).set({ updatedAt: new Date() }).where(eq(orders.id, data.orderId)).returning();
    if (!order?.userId || order.paymentStatus !== "paid") throw new Error("Only paid orders can be refunded to the wallet.");
    const [row] = await tx.select({ refundedPaise: sql<number>`COALESCE(SUM(${walletRefunds.amountPaise}), 0)` }).from(walletRefunds).where(eq(walletRefunds.orderId, order.id));
    const paidPaise = rupeesToPaise(Number(order.total));
    if (Number(row?.refundedPaise ?? 0) + amountPaise > paidPaise) throw new Error("Refund exceeds the remaining paid order total.");
    const [refund] = await tx.insert(walletRefunds).values({ orderId: order.id, userId: order.userId, adminUserId: admin.user.id, amountPaise, reason: data.reason.trim().slice(0, 500) }).returning();
    await creditWallet(tx, { userId: order.userId, amountPaise, type: "refund", referenceType: "order_refund", referenceId: refund.id, note: `Refund for order ${order.id.slice(0, 8).toUpperCase()}` });
    return { success: true, refund };
  });
}

export async function getWalletReconciliation() {
  await requireAdmin();
  const now = new Date();
  const [pendingTopUps, expiredReservations, recentReversals] = await Promise.all([
    db.select().from(walletTopUps).where(eq(walletTopUps.status, "created")).orderBy(desc(walletTopUps.createdAt)).limit(50),
    db.select().from(walletReservations).where(and(eq(walletReservations.status, "held"), lte(walletReservations.expiresAt, now))).orderBy(desc(walletReservations.expiresAt)).limit(50),
    db.select().from(walletLedgerEntries).where(eq(walletLedgerEntries.type, "reversal")).orderBy(desc(walletLedgerEntries.createdAt)).limit(50),
  ]);
  return { pendingTopUps, expiredReservations, recentReversals };
}

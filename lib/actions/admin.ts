"use server";

import { db } from "@/lib/db";
import { products, productVariants, coupons, orders, orderItems } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSecureCode } from "@/lib/utils";

// ============================================
// PRODUCT ACTIONS
// ============================================

export type ProductInput = {
  name: string;
  slug: string;
  description?: string;
  mrp: string;
  sellingPrice: string;
  maxBargainDiscount?: string;
  category: "tshirt" | "cargo" | "jogger" | "shirt" | "jeans" | "hoodie" | "jacket" | "shorts" | "accessory";
  gender: "men" | "women" | "unisex";
  tags?: string[];
  stock: number;
  images?: string[];
  fabric?: string | null;
  gsm?: number | null;
  careInstructions?: string[];
  features?: string[];
  sizes?: string[];
  colors?: { name: string; hex: string; images?: string[] }[];
  variants?: { size: string; color: string | null; stock: number }[];
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  displayOrder?: number;
};

const ACCESSORY_SIZE = "One Size";

// Helper: recompute total stock from variants
async function recomputeProductStock(productId: string) {
  const result = await db
    .select({ totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)` })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const totalStock = Number(result[0]?.totalStock ?? 0);

  await db
    .update(products)
    .set({ stock: totalStock, updatedAt: new Date() })
    .where(eq(products.id, productId));

  return totalStock;
}

// Helper: sync variants for a product (delete old, insert new)
async function syncProductVariants(
  productId: string,
  variants: { size: string; color: string | null; stock: number }[]
) {
  // Delete all existing variants for this product
  await db.delete(productVariants).where(eq(productVariants.productId, productId));

  // Insert new variants
  if (variants.length > 0) {
    await db.insert(productVariants).values(
      variants.map((v) => ({
        productId,
        size: v.size,
        color: v.color,
        stock: v.stock,
      }))
    );
  }

  // Recompute the total stock on the product
  return recomputeProductStock(productId);
}

export async function createProduct(data: ProductInput) {
  await requireAdmin();

  const isAccessory = data.category === "accessory";
  const effectiveSizes = isAccessory ? [ACCESSORY_SIZE] : (data.sizes || ["S", "M", "L", "XL"]);
  const effectiveColors = isAccessory ? [] : (data.colors || []);
  const effectiveGender = isAccessory ? "unisex" : data.gender;
  const effectiveFabric = isAccessory ? null : (data.fabric ?? null);
  const effectiveGsm = isAccessory ? null : (data.gsm ?? null);
  const effectiveCareInstructions = isAccessory ? [] : (data.careInstructions || []);
  const effectiveFeatures = isAccessory ? [] : (data.features || []);
  const effectiveStock = Math.max(0, data.stock || 0);

  const [product] = await db
    .insert(products)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      mrp: data.mrp,
      sellingPrice: data.sellingPrice,
      maxBargainDiscount: data.maxBargainDiscount || "0",
      category: data.category,
      gender: effectiveGender,
      tags: data.tags || [],
      stock: 0, // Will be computed from variants
      images: data.images || [],
      fabric: effectiveFabric,
      gsm: effectiveGsm,
      careInstructions: effectiveCareInstructions,
      features: effectiveFeatures,
      sizes: effectiveSizes,
      colors: effectiveColors,
      isNew: data.isNew ?? false,
      isFeatured: data.isFeatured ?? false,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();

  // Create variant rows
  if (isAccessory) {
    await syncProductVariants(product.id, [{ size: ACCESSORY_SIZE, color: null, stock: effectiveStock }]);
  } else if (data.variants && data.variants.length > 0) {
    await syncProductVariants(product.id, data.variants);
  } else {
    // Fallback: create variants from sizes × colors with the provided stock split evenly
    const variantCombos: { size: string; color: string | null; stock: number }[] = [];
    const totalVariants = effectiveSizes.length * Math.max(effectiveColors.length, 1);
    const stockPer = totalVariants > 0 ? Math.floor(data.stock / totalVariants) : 0;

    for (const size of effectiveSizes) {
      if (effectiveColors.length > 0) {
        for (const color of effectiveColors) {
          variantCombos.push({ size, color: color.name, stock: stockPer });
        }
      } else {
        variantCombos.push({ size, color: null, stock: stockPer });
      }
    }
    await syncProductVariants(product.id, variantCombos);
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return product;
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  await requireAdmin();

  const [existingProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  // Separate variants from the rest of the data
  const { variants, ...incomingData } = data;
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

  const [product] = await db
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
    await syncProductVariants(id, [{ size: ACCESSORY_SIZE, color: null, stock: Math.max(0, accessoryStock) }]);
  } else if (variants) {
    // If variants are provided, sync them
    await syncProductVariants(id, variants);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/product/${id}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  await db.delete(products).where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true };
}

export async function getProducts(options?: {
  category?: string;
  gender?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
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

export async function getProductById(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  return product;
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug));

  return product;
}

export async function getProductVariants(productId: string) {
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

  revalidatePath("/admin/coupons");

  return coupon;
}

export async function updateCoupon(id: string, data: Partial<CouponInput>) {
  await requireAdmin();

  const [coupon] = await db
    .update(coupons)
    .set(data)
    .where(eq(coupons.id, id))
    .returning();

  revalidatePath("/admin/coupons");

  return coupon;
}

export async function deleteCoupon(id: string) {
  await requireAdmin();

  await db.delete(coupons).where(eq(coupons.id, id));

  revalidatePath("/admin/coupons");

  return { success: true };
}

export async function getCoupons(options?: { isActive?: boolean }) {
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

export async function validateCoupon(code: string, orderTotal: number, userId?: string) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()));

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is no longer active" };
  }

  const now = new Date();
  
  // Check bargain coupon expiry (5-minute time limit)
  if (coupon.isBargainGenerated && coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, error: "This bargain code has expired. Try negotiating again!" };
  }

  if (coupon.validUntil && coupon.validUntil < now) {
    return { valid: false, error: "This coupon has expired" };
  }

  if (coupon.validFrom > now) {
    return { valid: false, error: "This coupon is not yet valid" };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }

  if (coupon.minOrderValue && orderTotal < parseFloat(coupon.minOrderValue)) {
    return { valid: false, error: `Minimum order value is ₹${coupon.minOrderValue}` };
  }

  if (coupon.userId && coupon.userId !== userId) {
    return { valid: false, error: "This coupon is not valid for your account" };
  }

  // Calculate discount
  let discount = parseFloat(coupon.discountValue);
  if (coupon.discountType === "percentage") {
    discount = (orderTotal * discount) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, parseFloat(coupon.maxDiscount));
    }
  }

  return {
    valid: true,
    coupon,
    discount: Math.min(discount, orderTotal),
  };
}

export async function markCouponUsed(code: string) {
  const [coupon] = await db
    .update(coupons)
    .set({ 
      usedCount: sql`${coupons.usedCount} + 1`,
    })
    .where(eq(coupons.code, code.toUpperCase()))
    .returning();

  return coupon;
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
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id));

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return { ...order, items };
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
) {
  await requireAdmin();

  const [order] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${id}`);

  return order;
}

// ============================================
// ANALYTICS ACTIONS
// ============================================

export async function getDashboardStats() {
  await requireAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total products
  const [{ count: totalProducts }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, true));

  // Total orders (last 30 days)
  const [{ count: totalOrders }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(gte(orders.createdAt, thirtyDaysAgo));

  // Total revenue (last 30 days)
  const [{ sum: totalRevenue }] = await db
    .select({ sum: sql<string>`COALESCE(sum(total), 0)` })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, thirtyDaysAgo),
        eq(orders.status, "delivered")
      )
    );

  // Active coupons
  const [{ count: activeCoupons }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(coupons)
    .where(eq(coupons.isActive, true));

  return {
    totalProducts: Number(totalProducts),
    totalOrders: Number(totalOrders),
    totalRevenue: parseFloat(totalRevenue || "0"),
    activeCoupons: Number(activeCoupons),
  };
}

// ============================================
// STORE CREDIT / REFUND ACTIONS
// ============================================

export interface IssueStoreCreditInput {
  userId: string;
  orderId?: string;
  refundAmount: number;
  reason: string;
  validityDays?: number; // Default 30, max 60
}

/**
 * Issues store credit as a coupon for refund purposes
 * Automatically adds 5% bonus as per refund policy
 */
export async function issueStoreCredit(data: IssueStoreCreditInput) {
  await requireAdmin();

  // Calculate credit with 5% bonus
  const bonusMultiplier = 1.05;
  const creditAmount = Math.round(data.refundAmount * bonusMultiplier);
  
  // Generate unique store credit code
  let code = "CREDIT-";
  code += generateSecureCode(8);

  // Set validity (30-60 days)
  const validityDays = Math.min(Math.max(data.validityDays || 30, 30), 60);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validityDays);

  const [coupon] = await db
    .insert(coupons)
    .values({
      code,
      discountType: "fixed",
      discountValue: creditAmount.toString(),
      maxUses: 1,
      usedCount: 0,
      userId: data.userId,
      forNewUsersOnly: false,
      isBargainGenerated: false,
      validFrom: new Date(),
      validUntil,
      isActive: true,
    })
    .returning();

  revalidatePath("/admin/coupons");
  revalidatePath("/orders");

  return {
    success: true,
    coupon,
    originalAmount: data.refundAmount,
    bonusAmount: creditAmount - data.refundAmount,
    totalCredit: creditAmount,
    validUntil,
  };
}

/**
 * Get all store credit coupons for a user
 */
export async function getUserStoreCredits(userId: string) {
  const credits = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.userId, userId),
        eq(coupons.isActive, true),
        sql`${coupons.code} LIKE 'CREDIT-%'`
      )
    )
    .orderBy(desc(coupons.createdAt));

  return credits;
}

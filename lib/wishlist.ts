import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, wishlist } from "@/lib/db/schema";

export type WishlistProductItem = {
  wishlistId: string;
  savedAt: string;
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  images: string[];
  stock: number;
};

async function getWishlistRow(userId: string, productId: string) {
  const [row] = await db
    .select()
    .from(wishlist)
    .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

  return row ?? null;
}

async function assertActiveProduct(productId: string) {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)));

  if (!product) {
    return { success: false as const, error: "Product not found." };
  }

  return { success: true as const };
}

export async function getProductWishlistState(userId: string, productId: string) {
  const row = await getWishlistRow(userId, productId);
  return {
    saved: Boolean(row),
    wishlistId: row?.id ?? null,
    savedAt: row?.createdAt.toISOString() ?? null,
  };
}

export async function addProductWishlistItem(userId: string, productId: string) {
  const productResult = await assertActiveProduct(productId);
  if (!productResult.success) return productResult;

  const [inserted] = await db
    .insert(wishlist)
    .values({ userId, productId })
    .onConflictDoNothing({
      target: [wishlist.userId, wishlist.productId],
    })
    .returning();

  const row = inserted ?? await getWishlistRow(userId, productId);
  if (!row) {
    return { success: false as const, error: "Could not save this product." };
  }

  return {
    success: true as const,
    item: {
      id: row.id,
      productId: row.productId,
      savedAt: row.createdAt.toISOString(),
    },
  };
}

export async function removeProductWishlistItem(userId: string, productId: string) {
  await db
    .delete(wishlist)
    .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

  return { success: true as const };
}

export async function getWishlistProducts(userId: string): Promise<WishlistProductItem[]> {
  const rows = await db
    .select({
      wishlistId: wishlist.id,
      savedAt: wishlist.createdAt,
      id: products.id,
      name: products.name,
      slug: products.slug,
      sellingPrice: products.sellingPrice,
      images: products.images,
      stock: products.stock,
    })
    .from(wishlist)
    .innerJoin(products, eq(wishlist.productId, products.id))
    .where(and(eq(wishlist.userId, userId), eq(products.isActive, true)))
    .orderBy(desc(wishlist.createdAt));

  return rows.map((row) => ({
    wishlistId: row.wishlistId,
    savedAt: row.savedAt.toISOString(),
    id: row.id,
    name: row.name,
    slug: row.slug,
    sellingPrice: Number(row.sellingPrice),
    images: row.images ?? [],
    stock: row.stock,
  }));
}

export async function getWishlistCount(userId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(wishlist)
    .innerJoin(products, eq(wishlist.productId, products.id))
    .where(and(eq(wishlist.userId, userId), eq(products.isActive, true)));

  return row?.count ?? 0;
}

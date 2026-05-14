"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { combos, products } from "@/lib/db/schema";
import { canonicalizeComboPair } from "@/lib/combos";

export type ComboInput = {
  productAId: string;
  productBId: string;
  discountAmount: number;
  displayOrder?: number;
  isActive?: boolean;
};

async function validateComboProducts(productAId: string, productBId: string) {
  if (productAId === productBId) {
    throw new Error("A combo must contain two different products");
  }

  const rows = await db
    .select({
      id: products.id,
      category: products.category,
      isActive: products.isActive,
    })
    .from(products)
    .where(inArray(products.id, [productAId, productBId]));

  if (rows.length !== 2) {
    throw new Error("Selected combo products were not found");
  }

  if (rows.some((row) => row.category === "accessory")) {
    throw new Error("Combos can only be created with clothing products");
  }

  if (rows.some((row) => !row.isActive)) {
    throw new Error("Only active products can be used in combos");
  }
}

function validateDiscountAmount(discountAmount: number) {
  if (!Number.isFinite(discountAmount) || discountAmount < 0) {
    throw new Error("Combo max bargain discount must be 0 or more");
  }
}

export async function createCombo(input: ComboInput) {
  await requireAdmin();

  validateDiscountAmount(input.discountAmount);
  const [productAId, productBId] = canonicalizeComboPair(input.productAId, input.productBId);
  await validateComboProducts(productAId, productBId);

  const [existing] = await db
    .select({ id: combos.id })
    .from(combos)
    .where(and(eq(combos.productAId, productAId), eq(combos.productBId, productBId)));

  if (existing) {
    throw new Error("A combo for this product pair already exists");
  }

  const [combo] = await db
    .insert(combos)
    .values({
      productAId,
      productBId,
      discountAmount: input.discountAmount.toFixed(2),
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    })
    .returning();

  revalidatePath("/admin/combos");
  revalidatePath("/");
  return combo;
}

export async function updateCombo(id: string, updates: { discountAmount?: number; displayOrder?: number; isActive?: boolean }) {
  await requireAdmin();

  if (updates.discountAmount !== undefined) {
    validateDiscountAmount(updates.discountAmount);
  }

  const updateValues: Partial<typeof combos.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (updates.discountAmount !== undefined) {
    updateValues.discountAmount = updates.discountAmount.toFixed(2);
  }
  if (updates.displayOrder !== undefined) {
    updateValues.displayOrder = updates.displayOrder;
  }
  if (updates.isActive !== undefined) {
    updateValues.isActive = updates.isActive;
  }

  const [combo] = await db
    .update(combos)
    .set(updateValues)
    .where(eq(combos.id, id))
    .returning();

  if (!combo) {
    throw new Error("Combo not found");
  }

  revalidatePath("/admin/combos");
  revalidatePath("/");
  return combo;
}

export async function deleteCombo(id: string) {
  await requireAdmin();
  await db.delete(combos).where(eq(combos.id, id));
  revalidatePath("/admin/combos");
  revalidatePath("/");
  return { success: true };
}

export async function getAdminCombos() {
  await requireAdmin();

  const comboRows = await db
    .select()
    .from(combos)
    .orderBy(desc(combos.displayOrder), desc(combos.createdAt));

  if (comboRows.length === 0) {
    return [];
  }

  const productIds = Array.from(
    new Set(comboRows.flatMap((combo) => [combo.productAId, combo.productBId]))
  );

  const comboProducts = await db
    .select({
      id: products.id,
      name: products.name,
      sellingPrice: products.sellingPrice,
      category: products.category,
      images: products.images,
      isActive: products.isActive,
    })
    .from(products)
    .where(inArray(products.id, productIds));

  const productMap = new Map(comboProducts.map((product) => [product.id, product]));

  return comboRows.map((combo) => ({
    ...combo,
    productA: productMap.get(combo.productAId) ?? null,
    productB: productMap.get(combo.productBId) ?? null,
  }));
}

import { db } from "@/lib/db";
import { combos, products, productVariants } from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export type ComboLinkedItem = {
  productId: string;
  quantity: number;
  unitPrice?: number;
  comboId?: string;
  comboGroupId?: string;
};

export function canonicalizeComboPair(productAId: string, productBId: string) {
  return [productAId, productBId].sort() as [string, string];
}

export async function getActiveCombosWithProducts(limit = 6) {
  const activeCombos = await db
    .select()
    .from(combos)
    .where(eq(combos.isActive, true))
    .orderBy(desc(combos.displayOrder), desc(combos.createdAt))
    .limit(limit);

  if (activeCombos.length === 0) {
    return [];
  }

  const productIds = Array.from(
    new Set(activeCombos.flatMap((combo) => [combo.productAId, combo.productBId]))
  );

  const comboProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const variants = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds));

  const productMap = new Map(comboProducts.map((product) => [product.id, product]));
  const variantsByProductId = variants.reduce<Map<string, typeof variants>>((acc, variant) => {
    const existing = acc.get(variant.productId) || [];
    existing.push(variant);
    acc.set(variant.productId, existing);
    return acc;
  }, new Map());

  return activeCombos
    .map((combo) => {
      const productA = productMap.get(combo.productAId);
      const productB = productMap.get(combo.productBId);

      if (!productA || !productB || !productA.isActive || !productB.isActive) {
        return null;
      }

      return {
        ...combo,
        productA: {
          ...productA,
          images: productA.images || [],
          sizes: productA.sizes || [],
          colors: productA.colors || [],
          variants: variantsByProductId.get(productA.id) || [],
        },
        productB: {
          ...productB,
          images: productB.images || [],
          sizes: productB.sizes || [],
          colors: productB.colors || [],
          variants: variantsByProductId.get(productB.id) || [],
        },
      };
    })
    .filter((combo): combo is NonNullable<typeof combo> => combo !== null);
}

export async function computeComboDiscountFromItems(items: ComboLinkedItem[]) {
  const groups = new Map<string, ComboLinkedItem[]>();

  for (const item of items) {
    if (!item.comboGroupId || !item.comboId) continue;
    const groupItems = groups.get(item.comboGroupId) || [];
    groupItems.push(item);
    groups.set(item.comboGroupId, groupItems);
  }

  if (groups.size === 0) {
    return 0;
  }

  const comboIds = Array.from(new Set(Array.from(groups.values()).map((group) => group[0]?.comboId).filter(Boolean))) as string[];
  const comboRows = await db
    .select()
    .from(combos)
    .where(and(inArray(combos.id, comboIds), eq(combos.isActive, true)));

  const comboMap = new Map(comboRows.map((combo) => [combo.id, combo]));

  const missingPriceProductIds = Array.from(
    new Set(items.filter((item) => item.unitPrice === undefined).map((item) => item.productId))
  );
  const missingPriceRows = missingPriceProductIds.length > 0
    ? await db
        .select({ id: products.id, sellingPrice: products.sellingPrice })
        .from(products)
        .where(inArray(products.id, missingPriceProductIds))
    : [];
  const priceMap = new Map(missingPriceRows.map((row) => [row.id, Number(row.sellingPrice)]));

  let totalDiscount = 0;

  for (const [groupId, groupItems] of groups.entries()) {
    if (groupItems.length !== 2) {
      throw new Error(`Invalid combo group: ${groupId}`);
    }

    const comboId = groupItems[0].comboId;
    if (!comboId || groupItems.some((item) => item.comboId !== comboId)) {
      throw new Error(`Invalid combo linkage in group: ${groupId}`);
    }

    const combo = comboMap.get(comboId);
    if (!combo) {
      throw new Error("Invalid or inactive combo selected");
    }

    if (groupItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      throw new Error("Invalid combo quantity");
    }

    const quantity = groupItems[0].quantity;
    if (groupItems[1].quantity !== quantity) {
      throw new Error("Combo item quantities must match");
    }

    const selectedPair = canonicalizeComboPair(groupItems[0].productId, groupItems[1].productId);
    const storedPair = canonicalizeComboPair(combo.productAId, combo.productBId);

    if (selectedPair[0] !== storedPair[0] || selectedPair[1] !== storedPair[1]) {
      throw new Error("Combo products do not match selected items");
    }

    const groupSubtotal = groupItems.reduce((sum, item) => {
      const unitPrice = item.unitPrice ?? priceMap.get(item.productId);
      if (unitPrice === undefined) {
        throw new Error("Unable to determine combo item price");
      }
      return sum + (unitPrice * item.quantity);
    }, 0);

    totalDiscount += groupSubtotal * (Number(combo.discountPercentage) / 100);
  }

  return Math.round(totalDiscount * 100) / 100;
}

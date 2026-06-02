import { calculateConfiguredDiscountCap, type BargainCartItem } from "@/lib/bargain/logic";
import { db, user, products, combos } from "@/lib/db";
import { and, eq, inArray } from "drizzle-orm";

export async function getBargainEligibilityContext(input: {
  cartItems: BargainCartItem[];
  cartTotal: number;
  userId?: string;
}) {
  let isFirstTimeUser = true;

  if (input.userId) {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, input.userId),
      columns: { ordersCount: true },
    });
    isFirstTimeUser = (userData?.ordersCount ?? 0) === 0;
  }

  const productIds = input.cartItems
    .map((item) => item.id || item.productId)
    .filter((productId): productId is string => Boolean(productId));

  const productCapRows = productIds.length > 0
    ? await db
        .select({
          id: products.id,
          maxBargainDiscount: products.maxBargainDiscount,
        })
        .from(products)
        .where(inArray(products.id, productIds))
    : [];

  const productCaps = new Map(
    productCapRows.map((product) => [
      product.id,
      Math.max(0, Number(product.maxBargainDiscount || 0)),
    ])
  );

  const comboIds = Array.from(
    new Set(
      input.cartItems
        .map((item) => item.comboId)
        .filter((comboId): comboId is string => Boolean(comboId))
    )
  );

  const comboRows = comboIds.length > 0
    ? await db
        .select({
          id: combos.id,
          productAId: combos.productAId,
          productBId: combos.productBId,
          discountAmount: combos.discountAmount,
        })
        .from(combos)
        .where(and(inArray(combos.id, comboIds), eq(combos.isActive, true)))
    : [];

  return {
    isFirstTimeUser,
    configuredCap: calculateConfiguredDiscountCap({
      cartItems: input.cartItems,
      productCaps,
      combos: comboRows,
    }),
  };
}

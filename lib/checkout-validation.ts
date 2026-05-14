export const MAX_PUBLIC_PRODUCT_LIMIT = 50;
export const MAX_CART_QUANTITY = 10;

export type CartQuantityItem = {
  quantity: unknown;
};

export function parsePublicProductPagination(limitParam: string | null, offsetParam: string | null) {
  const parsedLimit = Number(limitParam ?? "50");
  const parsedOffset = Number(offsetParam ?? "0");

  const limit = Number.isInteger(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), MAX_PUBLIC_PRODUCT_LIMIT)
    : MAX_PUBLIC_PRODUCT_LIMIT;

  const offset = Number.isInteger(parsedOffset)
    ? Math.max(parsedOffset, 0)
    : 0;

  return { limit, offset };
}

export function validateCartQuantities(items: CartQuantityItem[]) {
  return items.every(
    (item) =>
      Number.isInteger(item.quantity) &&
      Number(item.quantity) > 0 &&
      Number(item.quantity) <= MAX_CART_QUANTITY
  );
}

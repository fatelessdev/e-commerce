export function formatBargainDiscountLabel(maxBargainDiscount: string | number | null | undefined): string | null {
  const value = typeof maxBargainDiscount === "number" ? maxBargainDiscount : Number(maxBargainDiscount);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const formatted = Number.isInteger(value)
    ? value.toLocaleString("en-IN")
    : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return `Bargain up to ₹${formatted}`;
}

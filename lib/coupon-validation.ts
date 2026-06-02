import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function calculateCouponDiscount(
  coupon: typeof coupons.$inferSelect,
  orderTotal: number
) {
  let discount = Number(coupon.discountValue);
  if (coupon.discountType === "percentage") {
    discount = (orderTotal * discount) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  }

  return Math.min(discount, orderTotal);
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

  if (coupon.minOrderValue && orderTotal < Number(coupon.minOrderValue)) {
    return { valid: false, error: `Minimum order value is ₹${coupon.minOrderValue}` };
  }

  if (coupon.userId && coupon.userId !== userId) {
    return { valid: false, error: "This coupon is not valid for your account" };
  }

  return {
    valid: true,
    coupon,
    discount: calculateCouponDiscount(coupon, orderTotal),
  };
}

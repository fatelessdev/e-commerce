"use server";

import { db } from "@/lib/db";
import { bargainSessions, coupons } from "@/lib/db/schema";
import { generateSecureCode } from "@/lib/utils";

const BARGAIN_COUPON_EXPIRY_MS = 5 * 60 * 1000;

function generateBargainCouponCode() {
  return generateSecureCode("BRG-", 6);
}

export async function createBargainCoupon(input: {
  userId: string;
  cartTotal: number;
  discountAmount: number;
}) {
  const code = generateBargainCouponCode();
  const expiresAt = new Date(Date.now() + BARGAIN_COUPON_EXPIRY_MS);

  await db.transaction(async (tx) => {
    await tx.insert(coupons).values({
      code,
      discountType: "fixed",
      discountValue: input.discountAmount.toString(),
      maxUses: 1,
      usedCount: 0,
      userId: input.userId,
      isBargainGenerated: true,
      expiresAt,
      validFrom: new Date(),
      validUntil: expiresAt,
      isActive: true,
    });

    await tx.insert(bargainSessions).values({
      userId: input.userId,
      couponCode: code,
      cartValue: input.cartTotal.toString(),
      discountAmount: input.discountAmount.toString(),
      used: false,
      expiresAt,
    });
  });

  return {
    code,
    discountAmount: input.discountAmount,
    expiresAt,
  };
}

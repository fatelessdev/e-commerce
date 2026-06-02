import { validateCartQuantities } from "@/lib/checkout/validation";
import {
  type CheckoutPaymentMethod,
  type CheckoutQuote,
  type VerifiedCheckoutItem,
  buildCheckoutQuoteFromVerifiedItems,
} from "@/lib/checkout/pricing";
import { computeComboDiscountFromItems } from "@/lib/combos";
import { validateCoupon } from "@/lib/coupon-validation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type CheckoutQuoteItemInput = {
  productId: string;
  productName?: string;
  productImage?: string;
  size: string;
  color?: string;
  comboId?: string;
  comboGroupId?: string;
  quantity: number;
};

export type CreateCheckoutQuoteInput = {
  items: CheckoutQuoteItemInput[];
  couponCode?: string | null;
  paymentMethod: CheckoutPaymentMethod;
  userId?: string;
};

export class CheckoutQuoteError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "CheckoutQuoteError";
  }
}

export function isCheckoutPaymentMethod(value: unknown): value is CheckoutPaymentMethod {
  return value === "cod" || value === "upi" || value === "card" || value === "netbanking";
}

export async function createCheckoutQuote(input: CreateCheckoutQuoteInput): Promise<CheckoutQuote> {
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new CheckoutQuoteError("No items provided");
  }

  if (!validateCartQuantities(input.items)) {
    throw new CheckoutQuoteError("Invalid item quantity");
  }

  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      sellingPrice: products.sellingPrice,
      images: products.images,
    })
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.isActive, true)));

  const productMap = new Map(productRows.map((product) => [product.id, product]));
  const verifiedItems: VerifiedCheckoutItem[] = input.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new CheckoutQuoteError(`Product not found: ${item.productId}`);
    }

    const unitPrice = Number(product.sellingPrice);
    const totalPrice = unitPrice * item.quantity;
    const fallbackImage = product.images?.[0];

    return {
      productId: item.productId,
      productName: product.name,
      productImage: item.productImage || fallbackImage,
      size: item.size,
      color: item.color,
      comboId: item.comboId,
      comboGroupId: item.comboGroupId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    };
  });

  let comboDiscount = 0;
  try {
    comboDiscount = await computeComboDiscountFromItems(verifiedItems);
  } catch (error) {
    throw new CheckoutQuoteError(error instanceof Error ? error.message : "Invalid combo selected");
  }

  const preCouponQuote = buildCheckoutQuoteFromVerifiedItems({
    items: verifiedItems,
    paymentMethod: input.paymentMethod,
    comboDiscount,
  });

  let couponDiscount = 0;
  const couponCode = input.couponCode?.trim().toUpperCase();
  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, preCouponQuote.subtotal, input.userId);

    if (!couponResult.valid) {
      throw new CheckoutQuoteError(couponResult.error || "Invalid coupon code");
    }

    couponDiscount = couponResult.discount ?? 0;
  }

  return buildCheckoutQuoteFromVerifiedItems({
    items: verifiedItems,
    paymentMethod: input.paymentMethod,
    comboDiscount,
    couponDiscount,
    couponCode,
  });
}

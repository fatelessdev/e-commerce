import { COD_FEE, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../constants.ts";

export type CheckoutPaymentMethod = "cod" | "upi" | "card" | "netbanking";

export type VerifiedCheckoutItem = {
  productId: string;
  productName: string;
  productImage?: string;
  size: string;
  color?: string;
  comboId?: string;
  comboGroupId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type CheckoutQuote = {
  items: VerifiedCheckoutItem[];
  subtotal: number;
  comboDiscount: number;
  couponDiscount: number;
  discount: number;
  shippingCost: number;
  codFee: number;
  total: number;
  couponCode?: string;
};

export type BuildCheckoutQuoteInput = {
  items: VerifiedCheckoutItem[];
  paymentMethod: CheckoutPaymentMethod;
  comboDiscount?: number;
  couponDiscount?: number;
  couponCode?: string | null;
};

const MONEY_PRECISION = 100;
const MIN_PAYABLE_TOTAL = 1;
const RAZORPAY_AMOUNT_TOLERANCE = 1;

function roundMoney(value: number) {
  return Math.round(value * MONEY_PRECISION) / MONEY_PRECISION;
}

function assertFiniteMoney(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${label}`);
  }
}

export function buildCheckoutQuoteFromVerifiedItems(input: BuildCheckoutQuoteInput): CheckoutQuote {
  if (input.items.length === 0) {
    throw new Error("No items provided");
  }

  let subtotal = 0;

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Invalid item quantity");
    }

    assertFiniteMoney(item.unitPrice, "item price");
    assertFiniteMoney(item.totalPrice, "item total");

    const expectedItemTotal = roundMoney(item.unitPrice * item.quantity);
    if (Math.abs(expectedItemTotal - item.totalPrice) > 0.01) {
      throw new Error(`Price total mismatch for ${item.productName}`);
    }

    subtotal += item.totalPrice;
  }

  subtotal = roundMoney(subtotal);
  const comboDiscount = roundMoney(input.comboDiscount ?? 0);
  const couponDiscount = roundMoney(input.couponDiscount ?? 0);

  assertFiniteMoney(comboDiscount, "combo discount");
  assertFiniteMoney(couponDiscount, "coupon discount");

  const maxDiscount = Math.max(0, subtotal - MIN_PAYABLE_TOTAL);
  const discount = Math.min(roundMoney(comboDiscount + couponDiscount), maxDiscount);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = input.paymentMethod === "cod" ? COD_FEE : 0;
  const total = roundMoney(subtotal + shippingCost + codFee - discount);

  if (total <= 0) {
    throw new Error("Invalid order total");
  }

  return {
    items: input.items,
    subtotal,
    comboDiscount,
    couponDiscount,
    discount,
    shippingCost,
    codFee,
    total,
    couponCode: input.couponCode ? input.couponCode.toUpperCase() : undefined,
  };
}

export function assertRazorpayAmountMatchesQuote(input: {
  quoteTotal: number;
  orderAmountInPaise: number;
  capturedAmountInPaise: number;
}) {
  const orderAmount = Number(input.orderAmountInPaise) / 100;
  const capturedAmount = Number(input.capturedAmountInPaise) / 100;

  if (
    Math.abs(orderAmount - input.quoteTotal) > RAZORPAY_AMOUNT_TOLERANCE ||
    Math.abs(capturedAmount - input.quoteTotal) > RAZORPAY_AMOUNT_TOLERANCE
  ) {
    throw new Error("Payment amount mismatch. Please contact support.");
  }
}

export const MAX_NEGOTIATION_ROUNDS = 10;

export type BargainCartItem = {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  comboId?: string;
  comboGroupId?: string;
};

export type BargainComboRow = {
  id: string;
  productAId: string;
  productBId: string;
  discountAmount: string | number;
};

export function calculateCartRuleCap(cartTotal: number, isFirstTimeUser: boolean): number {
  if (isFirstTimeUser && cartTotal >= 2000) {
    return Math.min(cartTotal * 0.10, 200);
  }

  if (cartTotal < 1000) {
    return 70;
  }

  const percentage = Math.min(0.08, 0.05 + (cartTotal / 10000) * 0.03);
  return Math.min(cartTotal * percentage, 150);
}

export function calculateMaxDiscount(
  cartTotal: number,
  isFirstTimeUser: boolean,
  configuredCap: number
) {
  const cartBasedMax = calculateCartRuleCap(cartTotal, isFirstTimeUser);
  const discountType = isFirstTimeUser && cartTotal >= 2000
    ? "first_time_premium"
    : cartTotal < 1000
      ? "low_value"
      : "standard";

  return {
    maxDiscount: Math.max(0, Math.min(cartBasedMax, configuredCap)),
    discountType,
  };
}

export function getLastUserMessage(messages: Array<{ role?: string; content?: string }>): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const candidate = messages[i];
    if (candidate?.role === "user" && typeof candidate.content === "string") {
      return candidate.content;
    }
  }
  return "";
}

export function parseRequestedDiscount(message: string): number | null {
  const match = message.match(/(?:₹|rs\.?|rupees?)?\s*(\d{1,5})(?:\s*(?:off|discount))?/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function detectChillTone(message: string): boolean {
  return /(bro|bhai|yaar|lol|lmao|hehe|haha|chill|mazaak|meme)/i.test(message);
}

export function detectAcceptanceIntent(message: string): boolean {
  return /(deal|done|final|ok|okay|theek|thik|chalo|lock|apply|send code|give code|coupon)/i.test(message);
}

export function isUnreasonableDemand(requestedDiscount: number | null, maxDiscount: number): boolean {
  if (requestedDiscount === null || maxDiscount <= 0) return false;
  return requestedDiscount > maxDiscount * 1.2;
}

export function calculateOfferAmount(
  round: number,
  maxDiscount: number,
  requestedDiscount: number | null
): number {
  if (maxDiscount <= 0) return 0;

  const progressByRound = [0.18, 0.26, 0.34, 0.42, 0.50, 0.60, 0.70, 0.80, 0.88, 0.95];
  const index = Math.max(1, Math.min(round, MAX_NEGOTIATION_ROUNDS)) - 1;
  let ratio = progressByRound[index];

  if (requestedDiscount !== null) {
    if (requestedDiscount > maxDiscount * 1.8) {
      ratio -= 0.25;
    } else if (requestedDiscount > maxDiscount * 1.2) {
      ratio -= 0.15;
    }
  }

  ratio = Math.max(0.08, Math.min(ratio, 0.95));
  return Math.max(0, Math.floor(maxDiscount * ratio));
}

export function shouldFinalizeThisRound(
  round: number,
  maxDiscount: number,
  currentOffer: number,
  requestedDiscount: number | null,
  acceptanceIntent: boolean,
  unreasonableDemand: boolean
): boolean {
  if (maxDiscount <= 0) return false;
  if (round >= MAX_NEGOTIATION_ROUNDS) return true;
  if (acceptanceIntent && round >= 3) return true;
  if (!unreasonableDemand && requestedDiscount !== null && requestedDiscount <= currentOffer && round >= 3) return true;
  if (!unreasonableDemand && round >= 5 && currentOffer >= Math.floor(maxDiscount * 0.6)) return true;
  if (!unreasonableDemand && round >= 8) return true;
  return false;
}

function canonicalizePair(productAId: string, productBId: string) {
  return [productAId, productBId].sort() as [string, string];
}

export function calculateConfiguredDiscountCap(input: {
  cartItems: BargainCartItem[];
  productCaps: Map<string, number>;
  combos: BargainComboRow[];
}) {
  const comboGroups = new Map<string, BargainCartItem[]>();

  for (const item of input.cartItems) {
    if (!item.comboGroupId || !item.comboId) continue;
    const group = comboGroups.get(item.comboGroupId) || [];
    group.push(item);
    comboGroups.set(item.comboGroupId, group);
  }

  const comboMap = new Map(input.combos.map((combo) => [combo.id, combo]));
  let comboCap = 0;
  const comboItems = new Set<BargainCartItem>();

  for (const groupItems of comboGroups.values()) {
    if (groupItems.length !== 2) continue;
    const [first, second] = groupItems;
    if (first.comboId !== second.comboId) continue;
    if (!Number.isInteger(first.quantity) || first.quantity <= 0 || second.quantity !== first.quantity) continue;

    const combo = first.comboId ? comboMap.get(first.comboId) : undefined;
    if (!combo) continue;

    const firstProductId = first.id || first.productId;
    const secondProductId = second.id || second.productId;
    if (!firstProductId || !secondProductId) continue;

    const selectedPair = canonicalizePair(firstProductId, secondProductId);
    const storedPair = canonicalizePair(combo.productAId, combo.productBId);
    if (selectedPair[0] !== storedPair[0] || selectedPair[1] !== storedPair[1]) continue;

    comboCap += Math.max(0, Number(combo.discountAmount)) * first.quantity;
    comboItems.add(first);
    comboItems.add(second);
  }

  let productCap = 0;
  for (const item of input.cartItems) {
    if (comboItems.has(item)) continue;

    const itemId = item.id || item.productId;
    if (!itemId) continue;

    const cap = input.productCaps.get(itemId) || 0;
    const qty = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    productCap += cap * qty;
  }

  return productCap + comboCap;
}

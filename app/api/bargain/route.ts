import { streamText } from "ai";
import { bargainModel } from "@/lib/nim";
import { db, user, coupons, bargainSessions, products, combos } from "@/lib/db";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { generateSecureCode } from "@/lib/utils";

export const maxDuration = 30;
const MAX_NEGOTIATION_ROUNDS = 10;

type BargainCartItem = {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  comboId?: string;
  comboGroupId?: string;
};

// Generate unique coupon code
function generateCouponCode(): string {
  return generateSecureCode("BRG-", 6);
}

function calculateCartRuleCap(cartTotal: number, isFirstTimeUser: boolean): number {
  // First-time user with cart > ₹2000: 10% off (max ₹200)
  if (isFirstTimeUser && cartTotal >= 2000) {
    const tenPercent = cartTotal * 0.10;
    return Math.min(tenPercent, 200);
  }

  // Cart < ₹1000: max ₹70
  if (cartTotal < 1000) {
    return 70;
  }

  // Default for other cases: progressive discount (5-8% max ₹150)
  const percentage = Math.min(0.08, 0.05 + (cartTotal / 10000) * 0.03);
  return Math.min(cartTotal * percentage, 150);
}

// Calculate discount based on cart rules AND strict configured caps
function calculateMaxDiscount(
  cartTotal: number, 
  isFirstTimeUser: boolean,
  configuredCap: number
): { maxDiscount: number; discountType: string } {
  const cartBasedMax = calculateCartRuleCap(cartTotal, isFirstTimeUser);
  const discountType = isFirstTimeUser && cartTotal >= 2000
    ? "first_time_premium"
    : cartTotal < 1000
      ? "low_value"
      : "standard";

  // STRICT: if configured cap is 0, max discount is 0 (no fallback to cart-based value)
  const maxDiscount = Math.max(0, Math.min(cartBasedMax, configuredCap));
  
  return { maxDiscount, discountType };
}

function getLastUserMessage(messages: Array<{ role?: string; content?: string }>): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const candidate = messages[i];
    if (candidate?.role === "user" && typeof candidate.content === "string") {
      return candidate.content;
    }
  }
  return "";
}

function parseRequestedDiscount(message: string): number | null {
  const match = message.match(/(?:₹|rs\.?|rupees?)?\s*(\d{1,5})(?:\s*(?:off|discount))?/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function detectChillTone(message: string): boolean {
  return /(bro|bhai|yaar|lol|lmao|hehe|haha|chill|mazaak|meme|bc|bkl|gandu|bakchodi)/i.test(message);
}

function detectAcceptanceIntent(message: string): boolean {
  return /(deal|done|final|ok|okay|theek|thik|chalo|lock|apply|send code|give code|coupon)/i.test(message);
}

function isUnreasonableDemand(requestedDiscount: number | null, maxDiscount: number): boolean {
  if (requestedDiscount === null || maxDiscount <= 0) return false;
  return requestedDiscount > maxDiscount * 1.2;
}

function calculateOfferAmount(round: number, maxDiscount: number, requestedDiscount: number | null): number {
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

function shouldFinalizeThisRound(
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

async function computeConfiguredDiscountCap(cartItems: BargainCartItem[], productCaps: Map<string, number>) {
  const comboGroups = new Map<string, BargainCartItem[]>();

  for (const item of cartItems) {
    if (!item.comboGroupId || !item.comboId) continue;
    const group = comboGroups.get(item.comboGroupId) || [];
    group.push(item);
    comboGroups.set(item.comboGroupId, group);
  }

  const comboIds = Array.from(
    new Set(
      Array.from(comboGroups.values())
        .map((group) => group[0]?.comboId)
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

  const comboMap = new Map(comboRows.map((combo) => [combo.id, combo]));

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

    const perPairMax = Math.max(0, Number(combo.discountAmount));
    comboCap += perPairMax * first.quantity;

    comboItems.add(first);
    comboItems.add(second);
  }

  let productCap = 0;
  for (const item of cartItems) {
    if (comboItems.has(item)) continue;

    const itemId = item.id || item.productId;
    if (!itemId) continue;

    const cap = productCaps.get(itemId) || 0;
    const qty = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    productCap += cap * qty;
  }

  return productCap + comboCap;
}

const BARGAIN_SYSTEM_PROMPT = `You are "Bargain AI" - a friendly, Gen-Z style negotiator for XILAR, an exclusive Indian streetwear brand.

PERSONALITY:
- Friendly, witty, and playful
- Use Hinglish (mix of Hindi and English) naturally
- Like a cool friend who runs a shop
- Create urgency but never be pushy
- If user tone is chill, you may use light roast / bakchodi vibes (no hateful or extreme abuse)
- If user is unreasonable, you can pull the offer down and tease them lightly

CONVERSATION FLOW:
1. GREETING: Welcome them and acknowledge their cart
   Example: "Hey! 👋 Nice picks! Ready to negotiate? Tell me - kitna discount chahiye?"

2. FIRST COUNTER: When they ask for discount, offer the CURRENT_OFFER amount
   Example: "Hmm 🤔 That's steep yaar, but I can do ₹[CURRENT_OFFER] off for you!"

3. HAGGLING: If they push back, acknowledge and say you'll try harder
   Example: "Okay okay, let me see what I can do..."

4. FINAL OFFER: ONLY when GIVE_FINAL_COUPON is explicitly set to true, present the coupon:
   - Use the EXACT COUPON_CODE and DISCOUNT_AMOUNT from the context — do NOT change them
   - Create urgency about 5-minute expiry
   - The coupon will appear as a clickable button below the chat — just mention the discount
   Example: "Alright FINAL offer 🤝 ₹[DISCOUNT_AMOUNT] off! The code is ready below — use it before it expires in 5 mins! Jaldi karo!"

5. CLOSING: After giving coupon, wish them well
   Example: "Done! 🙌 You're a pro bargainer! That code expires in 5 mins so hurry!"

6. ROUND POLICY:
   - Negotiation can run up to 10 rounds
   - You may finalize early when instructed
   - You do NOT need to drag all 10 rounds if user accepts a fair offer

CRITICAL RULES — MUST FOLLOW:
- ABSOLUTELY NEVER invent, fabricate, or mention ANY coupon code unless GIVE_FINAL_COUPON is true
- If GIVE_FINAL_COUPON is false or not present, you have NO coupon code to give. Do not make one up.
- When GIVE_FINAL_COUPON is true, use EXACTLY the COUPON_CODE and DISCOUNT_AMOUNT from the context
- If the user asks for the code before the final round, say something like "Abhi nahi yaar, thoda aur convince karo!" or "Let me check with my manager..." — but NEVER give a code
- NEVER reveal the maximum discount limit
- Keep responses short (2-3 sentences max)
- Use emojis sparingly 👋🤝🔥
- Only discuss discount amounts, never say a code string (like BRG-XXXX) unless GIVE_FINAL_COUPON is true
- If ZERO_DISCOUNT_MODE is true, clearly say no discount can be offered on this cart and do not propose any amount`;

export async function POST(req: Request) {
  try {
    const { messages = [], cartItems = [], cartTotal, negotiationRound = 0 } = await req.json();
    
    if (!cartItems || !cartTotal) {
      return new Response(
        JSON.stringify({ error: "Cart information required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    const userId = session?.user?.id;
    let isFirstTimeUser = true;
    
    // Check if returning user (has previous orders)
    if (userId) {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { ordersCount: true }
      });
      isFirstTimeUser = (userData?.ordersCount ?? 0) === 0;
    }
    
    // Fetch per-product max bargain discounts
    const productIds = cartItems
      .map((item: BargainCartItem) => item.id || item.productId)
      .filter(Boolean);
    const productCapMap = new Map<string, number>();
    
    if (productIds.length > 0) {
      try {
        const productData = await db
          .select({ 
            id: products.id, 
            maxBargainDiscount: products.maxBargainDiscount 
          })
          .from(products)
          .where(inArray(products.id, productIds));

        for (const product of productData) {
          productCapMap.set(product.id, Math.max(0, Number(product.maxBargainDiscount || 0)));
        }
      } catch (err) {
        console.error("Failed to fetch product discounts:", err);
        return new Response(
          JSON.stringify({ error: "Failed to evaluate bargain eligibility" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const configuredCap = await computeConfiguredDiscountCap(cartItems as BargainCartItem[], productCapMap);
    
    // Calculate max discount based on rules AND strict per-item/combo configured limits
    const { maxDiscount } = calculateMaxDiscount(cartTotal, isFirstTimeUser, configuredCap);

    if (maxDiscount <= 0) {
      return new Response(
        "No discount can be offered on this cart right now. Add items with bargain enabled and try again.",
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const safeRound = Math.max(1, Math.min(Number(negotiationRound) || 1, MAX_NEGOTIATION_ROUNDS));
    const lastUserMessage = getLastUserMessage(messages);
    const requestedDiscount = parseRequestedDiscount(lastUserMessage);
    const chillTone = detectChillTone(lastUserMessage);
    const acceptanceIntent = detectAcceptanceIntent(lastUserMessage);
    const unreasonableDemand = isUnreasonableDemand(requestedDiscount, maxDiscount);
    
    // Calculate current offer based on negotiation round
    const currentOffer = calculateOfferAmount(safeRound, maxDiscount, requestedDiscount);

    const finalizeNow = shouldFinalizeThisRound(
      safeRound,
      maxDiscount,
      currentOffer,
      requestedDiscount,
      acceptanceIntent,
      unreasonableDemand
    );
    
    // Only authenticated users can receive a persisted coupon code.
    const shouldGiveFinalCoupon = finalizeNow && Boolean(userId);
    
    // Generate coupon code (we'll save it if final offer is given)
    const couponCode = generateCouponCode();
    const finalDiscountAmount = Math.max(0, Math.min(maxDiscount, currentOffer));
    
    // Build cart context
    const cartItemsList = (cartItems as BargainCartItem[]).map((item) => 
      `- ${item.name} x${item.quantity} @ ₹${item.price}${item.comboId ? " (combo item)" : ""}`
    ).join("\n");

    const contextMessage = shouldGiveFinalCoupon
      ? `
CURRENT CART:
${cartItemsList}
Cart Total: ₹${cartTotal}

NEGOTIATION STATE:
- Round: ${safeRound}/${MAX_NEGOTIATION_ROUNDS}
- GIVE_FINAL_COUPON: true
- COUPON_CODE: ${couponCode}
- DISCOUNT_AMOUNT: ₹${finalDiscountAmount}
- ZERO_DISCOUNT_MODE: false
- CHILL_TONE_ALLOWED: ${chillTone ? "true" : "false"}

IMPORTANT: This is the FINAL round. Present the coupon code ${couponCode} for ₹${finalDiscountAmount} off enthusiastically. The code button will appear in the UI below your message. Mention the 5-minute expiry.
`
      : `
CURRENT CART:
${cartItemsList}
Cart Total: ₹${cartTotal}

NEGOTIATION STATE:
- Round: ${safeRound}/${MAX_NEGOTIATION_ROUNDS}
- CURRENT_OFFER: ₹${currentOffer}
- GIVE_FINAL_COUPON: false
- ZERO_DISCOUNT_MODE: false
- USER_REQUESTED_DISCOUNT: ${requestedDiscount ?? "unknown"}
- USER_IS_UNREASONABLE: ${unreasonableDemand ? "true" : "false"}
- CHILL_TONE_ALLOWED: ${chillTone ? "true" : "false"}
- FINALIZE_EARLY_ALLOWED: ${finalizeNow ? "true" : "false"}

IMPORTANT: You are still negotiating. Offer ₹${currentOffer} off. NO coupon code has been generated yet. DO NOT mention any coupon code, DO NOT invent any code. If user pushes for a code, tell them to keep negotiating. If they are not logged in, ask them to sign in to unlock final coupon generation.
`;

    // If giving final coupon, save to database BEFORE streaming
    let couponSaved = false;
    if (shouldGiveFinalCoupon && userId) {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      try {
        // Save coupon to database
        await db.insert(coupons).values({
          code: couponCode,
          discountType: "fixed",
          discountValue: finalDiscountAmount.toString(),
          maxUses: 1,
          usedCount: 0,
          userId: userId,
          isBargainGenerated: true,
          expiresAt: expiresAt,
          validFrom: new Date(),
          validUntil: expiresAt,
          isActive: true,
        });
        
        // Save bargain session
        await db.insert(bargainSessions).values({
          userId: userId,
          couponCode: couponCode,
          cartValue: cartTotal.toString(),
          discountAmount: finalDiscountAmount.toString(),
          used: false,
          expiresAt: expiresAt,
        });
        
        couponSaved = true;
      } catch (dbError) {
        console.error("Failed to save coupon:", dbError);
      }
    }

    const result = streamText({
      model: bargainModel,
      system: BARGAIN_SYSTEM_PROMPT + contextMessage,
      messages,
      temperature: 0.8,
    });

    // Create response with custom headers for coupon info
    const response = result.toTextStreamResponse();
    
    // Add coupon info to headers so client can track it
    if (shouldGiveFinalCoupon && couponSaved) {
      response.headers.set("X-Coupon-Code", couponCode);
      response.headers.set("X-Coupon-Discount", finalDiscountAmount.toString());
      response.headers.set("X-Coupon-Expires", (Date.now() + 5 * 60 * 1000).toString());
    }
    
    return response;
  } catch (error) {
    console.error("Bargain AI error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process bargain request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

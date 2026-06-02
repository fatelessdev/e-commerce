import { streamText } from "ai";
import { bargainModel } from "@/lib/openrouter";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { BARGAIN_SYSTEM_PROMPT } from "@/lib/bargain/prompt";
import { createBargainCoupon } from "@/lib/actions/bargain";
import { getBargainEligibilityContext } from "@/lib/bargain/context";
import {
  type BargainCartItem,
  MAX_NEGOTIATION_ROUNDS,
  calculateMaxDiscount,
  calculateOfferAmount,
  detectAcceptanceIntent,
  detectChillTone,
  getLastUserMessage,
  isUnreasonableDemand,
  parseRequestedDiscount,
  shouldFinalizeThisRound,
} from "@/lib/bargain/logic";

export const maxDuration = 30;

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
    const normalizedCartItems = cartItems as BargainCartItem[];
    const { configuredCap, isFirstTimeUser } = await getBargainEligibilityContext({
      cartItems: normalizedCartItems,
      cartTotal,
      userId,
    });
    
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
    
    const finalDiscountAmount = Math.max(0, Math.min(maxDiscount, currentOffer));
    let finalCoupon: Awaited<ReturnType<typeof createBargainCoupon>> | null = null;

    if (finalizeNow && userId) {
      try {
        finalCoupon = await createBargainCoupon({
          userId,
          cartTotal,
          discountAmount: finalDiscountAmount,
        });
      } catch (dbError) {
        console.error("Failed to save bargain coupon:", dbError);
      }
    }

    const shouldGiveFinalCoupon = Boolean(finalCoupon);
    
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
- COUPON_CODE: ${finalCoupon?.code}
- DISCOUNT_AMOUNT: ₹${finalDiscountAmount}
- ZERO_DISCOUNT_MODE: false
- CHILL_TONE_ALLOWED: ${chillTone ? "true" : "false"}

IMPORTANT: This is the FINAL round. Present the coupon code ${finalCoupon?.code} for ₹${finalDiscountAmount} off enthusiastically. The code button will appear in the UI below your message. Mention the 5-minute expiry.
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

    const result = streamText({
      model: bargainModel,
      system: BARGAIN_SYSTEM_PROMPT + contextMessage,
      messages,
      temperature: 0.8,
    });

    // Create response with custom headers for coupon info
    const response = result.toTextStreamResponse();
    
    // Add coupon info to headers so client can track it
    if (finalCoupon) {
      response.headers.set("X-Coupon-Code", finalCoupon.code);
      response.headers.set("X-Coupon-Discount", finalCoupon.discountAmount.toString());
      response.headers.set("X-Coupon-Expires", finalCoupon.expiresAt.getTime().toString());
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

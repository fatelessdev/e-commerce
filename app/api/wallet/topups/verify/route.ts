import { NextRequest, NextResponse } from "next/server";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import razorpay from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { walletTopUps } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { assertSameOrigin } from "@/lib/request-security";
import { assertDailyFundingCapacity, creditWallet } from "@/lib/wallet";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireAuth();
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === "string" && value)) return NextResponse.json({ error: "Missing payment verification details." }, { status: 400 });
    const valid = validatePaymentVerification({ order_id: razorpay_order_id, payment_id: razorpay_payment_id }, razorpay_signature, process.env.RAZORPAY_KEY_SECRET!);
    if (!valid) return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    const [topUp] = await db.select().from(walletTopUps).where(and(eq(walletTopUps.razorpayOrderId, razorpay_order_id), eq(walletTopUps.userId, session.user.id))).limit(1);
    if (!topUp) return NextResponse.json({ error: "Wallet payment not found." }, { status: 404 });
    if (topUp.status === "paid") return NextResponse.json({ success: true, alreadySettled: true });
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.order_id !== topUp.razorpayOrderId || payment.status !== "captured" || payment.currency !== "INR" || Number(payment.amount) !== topUp.amountPaise) return NextResponse.json({ error: "Captured amount does not match the wallet payment." }, { status: 400 });
    await assertDailyFundingCapacity(session.user.id, topUp.amountPaise);
    await db.transaction(async (tx) => {
      const [settled] = await tx.update(walletTopUps).set({ status: "paid", razorpayPaymentId: razorpay_payment_id, settledAt: new Date() }).where(and(eq(walletTopUps.id, topUp.id), eq(walletTopUps.status, "created"))).returning();
      if (!settled) return;
      await creditWallet(tx, { userId: session.user.id, amountPaise: topUp.amountPaise, type: "top_up", referenceType: "wallet_top_up", referenceId: topUp.id, note: "Razorpay wallet top-up" });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify wallet payment.";
    return NextResponse.json({ error: message }, { status: /unauthorized/i.test(message) ? 401 : 400 });
  }
}

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { walletTopUps, walletWebhookEvents } from "@/lib/db/schema";
import { assertDailyFundingCapacity, creditWallet } from "@/lib/wallet";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 401 });
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  try {
    const payload = JSON.parse(body) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } } };
    const payment = payload.payload?.payment?.entity;
    const eventId = request.headers.get("x-razorpay-event-id") || createHash("sha256").update(body).digest("hex");
    await db.transaction(async (tx) => {
      const [event] = await tx.insert(walletWebhookEvents).values({ providerEventId: eventId, payloadHash: createHash("sha256").update(body).digest("hex"), eventType: payload.event || "unknown" }).onConflictDoNothing().returning();
      if (!event || payload.event !== "payment.captured" || !payment?.order_id || !payment.id || payment.status !== "captured") return;
      const [topUp] = await tx.select().from(walletTopUps).where(eq(walletTopUps.razorpayOrderId, payment.order_id)).limit(1);
      if (!topUp || topUp.status === "paid" || topUp.amountPaise !== Number(payment.amount)) return;
      await assertDailyFundingCapacity(topUp.userId, topUp.amountPaise);
      const [settled] = await tx.update(walletTopUps).set({ status: "paid", razorpayPaymentId: payment.id, settledAt: new Date() }).where(and(eq(walletTopUps.id, topUp.id), eq(walletTopUps.status, "created"))).returning();
      if (settled) await creditWallet(tx, { userId: topUp.userId, amountPaise: topUp.amountPaise, type: "top_up", referenceType: "wallet_top_up", referenceId: topUp.id, note: "Razorpay wallet top-up" });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

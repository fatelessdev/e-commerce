import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import razorpay from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { walletTopUps } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { assertDailyFundingCapacity, assertTopUpAmount } from "@/lib/wallet";
import { assertSameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireAuth();
    const body = await request.json();
    const amountPaise = Number(body.amountPaise);
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 100) : "";
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(idempotencyKey)) return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
    assertTopUpAmount(amountPaise);
    const [existing] = await db.select().from(walletTopUps).where(and(eq(walletTopUps.userId, session.user.id), eq(walletTopUps.idempotencyKey, idempotencyKey))).limit(1);
    if (existing) return NextResponse.json({ id: existing.id, order: { id: existing.razorpayOrderId, amount: existing.amountPaise, currency: "INR" } });
    await assertDailyFundingCapacity(session.user.id, amountPaise);
    const order = await razorpay.orders.create({ amount: amountPaise, currency: "INR", receipt: `wallet_${randomUUID().replace(/-/g, "").slice(0, 30)}` });
    const [topUp] = await db.insert(walletTopUps).values({ userId: session.user.id, amountPaise, idempotencyKey, razorpayOrderId: order.id }).onConflictDoNothing().returning();
    if (!topUp) return NextResponse.json({ error: "A matching wallet payment is already in progress." }, { status: 409 });
    return NextResponse.json({ id: topUp.id, order: { id: order.id, amount: order.amount, currency: order.currency } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start wallet top-up.";
    const status = /unauthorized/i.test(message) ? 401 : /limit|between|origin|invalid/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

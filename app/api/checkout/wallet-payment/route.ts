import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import razorpay from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth-server";
import { CheckoutQuoteError, createCheckoutQuote } from "@/lib/checkout/quote";
import { db } from "@/lib/db";
import { walletCheckoutPayments } from "@/lib/db/schema";
import { assertSameOrigin } from "@/lib/request-security";
import { releaseWalletReservation, reserveWalletFunds, rupeesToPaise } from "@/lib/wallet";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let paymentId: string | null = null;
  try {
    assertSameOrigin(request);
    const session = await requireAuth();
    const body = await request.json();
    if (!["upi", "card", "netbanking"].includes(body.paymentMethod)) return NextResponse.json({ error: "Choose an online payment method." }, { status: 400 });
    const quote = await createCheckoutQuote({ items: body.items, couponCode: body.couponCode, paymentMethod: body.paymentMethod, userId: session.user.id });
    const totalPaise = rupeesToPaise(quote.total);
    const requestedWalletPaise = Number(body.walletAmountPaise ?? 0);
    if (!Number.isInteger(requestedWalletPaise) || requestedWalletPaise < 0) return NextResponse.json({ error: "Invalid wallet amount." }, { status: 400 });
    const walletPaidPaise = Math.min(requestedWalletPaise, totalPaise);
    paymentId = randomUUID();
    if (walletPaidPaise) await reserveWalletFunds({ userId: session.user.id, amountPaise: walletPaidPaise, referenceType: "checkout_payment", referenceId: paymentId });
    const externalPaidPaise = totalPaise - walletPaidPaise;
    let razorpayOrderId: string | null = null;
    if (externalPaidPaise) {
      const order = await razorpay.orders.create({ amount: externalPaidPaise, currency: "INR", receipt: `checkout_${paymentId.replace(/-/g, "").slice(0, 28)}` });
      razorpayOrderId = order.id;
    }
    await db.insert(walletCheckoutPayments).values({ id: paymentId, userId: session.user.id, quote, shippingAddress: body.shippingAddress, paymentMethod: body.paymentMethod, walletPaidPaise, externalPaidPaise, razorpayOrderId, expiresAt: new Date(Date.now() + 15 * 60_000) });
    return NextResponse.json({ paymentId, walletPaidPaise, externalPaidPaise, razorpayOrderId, razorpay: razorpayOrderId ? { id: razorpayOrderId, amount: externalPaidPaise, currency: "INR" } : null });
  } catch (error) {
    if (paymentId) await releaseWalletReservation("checkout_payment", paymentId).catch(() => undefined);
    if (error instanceof CheckoutQuoteError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : "Could not start checkout payment.";
    return NextResponse.json({ error: message }, { status: /unauthorized/i.test(message) ? 401 : 400 });
  }
}

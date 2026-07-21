import { NextRequest, NextResponse } from "next/server";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { and, eq } from "drizzle-orm";
import razorpay from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth-server";
import { createOrderFromQuote, type ShippingAddress } from "@/lib/actions/orders";
import { db } from "@/lib/db";
import { walletCheckoutPayments } from "@/lib/db/schema";
import { assertSameOrigin } from "@/lib/request-security";
import type { CheckoutQuote } from "@/lib/checkout/pricing";
import { releaseWalletReservation } from "@/lib/wallet";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireAuth();
    const body = await request.json();
    if (typeof body.paymentId !== "string") return NextResponse.json({ error: "Invalid checkout payment." }, { status: 400 });
    const [payment] = await db.select().from(walletCheckoutPayments).where(and(eq(walletCheckoutPayments.id, body.paymentId), eq(walletCheckoutPayments.userId, session.user.id))).limit(1);
    if (!payment) return NextResponse.json({ error: "Checkout payment not found." }, { status: 404 });
    if (payment.orderId) return NextResponse.json({ success: true, orderId: payment.orderId });
    if (payment.status !== "created" || payment.expiresAt < new Date()) return NextResponse.json({ error: "Checkout payment expired. Please start again." }, { status: 400 });
    if (payment.externalPaidPaise > 0) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!payment.razorpayOrderId || razorpay_order_id !== payment.razorpayOrderId || !validatePaymentVerification({ order_id: razorpay_order_id, payment_id: razorpay_payment_id }, razorpay_signature, process.env.RAZORPAY_KEY_SECRET!)) return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
      const captured = await razorpay.payments.fetch(razorpay_payment_id);
      if (captured.order_id !== payment.razorpayOrderId || captured.status !== "captured" || Number(captured.amount) !== payment.externalPaidPaise) return NextResponse.json({ error: "Captured payment does not match checkout." }, { status: 400 });
    }
    const [claimed] = await db.update(walletCheckoutPayments).set({ status: "processing", razorpayPaymentId: body.razorpay_payment_id || null, updatedAt: new Date() }).where(and(eq(walletCheckoutPayments.id, payment.id), eq(walletCheckoutPayments.status, "created"))).returning();
    if (!claimed) return NextResponse.json({ error: "Checkout is already processing." }, { status: 409 });
    const result = await createOrderFromQuote({ quote: payment.quote as CheckoutQuote, shippingAddress: payment.shippingAddress as ShippingAddress, paymentMethod: payment.walletPaidPaise > 0 && payment.externalPaidPaise > 0 ? "wallet_razorpay" : payment.walletPaidPaise > 0 ? "wallet" : payment.paymentMethod, paymentStatus: "paid", razorpayOrderId: payment.razorpayOrderId || undefined, razorpayPaymentId: body.razorpay_payment_id || undefined, razorpaySignature: body.razorpay_signature || undefined, walletReservationReferenceId: payment.id, walletPaidPaise: payment.walletPaidPaise, externalPaidPaise: payment.externalPaidPaise });
    if (!result.success || !result.orderId) { await releaseWalletReservation("checkout_payment", payment.id); await db.update(walletCheckoutPayments).set({ status: "failed", updatedAt: new Date() }).where(eq(walletCheckoutPayments.id, payment.id)); return NextResponse.json({ error: result.error || "Could not create order." }, { status: 400 }); }
    await db.update(walletCheckoutPayments).set({ status: "completed", orderId: result.orderId, updatedAt: new Date() }).where(eq(walletCheckoutPayments.id, payment.id));
    return NextResponse.json({ success: true, orderId: result.orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not finish checkout payment.";
    return NextResponse.json({ error: message }, { status: /unauthorized/i.test(message) ? 401 : 400 });
  }
}

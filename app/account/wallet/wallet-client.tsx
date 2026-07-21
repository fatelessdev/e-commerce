"use client";

import Script from "next/script";
import { useState } from "react";
import { ArrowDownLeft, Loader2, Plus, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WALLET_LIMITS } from "@/lib/wallet";

type WalletData = { availablePaise: number; heldPaise: number; isFrozen: boolean; freezeReason: string | null; entries: { id: string; type: string; amountPaise: number; note: string | null; createdAt: Date }[] };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void } } }
const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export function WalletClient({ initialWallet }: { initialWallet: WalletData }) {
  const [wallet, setWallet] = useState(initialWallet);
  const [amount, setAmount] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function topUp() {
    const amountPaise = Math.round(Number(amount) * 100);
    if (!Number.isInteger(amountPaise) || amountPaise < WALLET_LIMITS.minTopUpPaise || amountPaise > WALLET_LIMITS.maxTopUpPaise) { setError("Choose an amount between ₹10 and ₹2,000."); return; }
    if (!window.Razorpay) { setError("Payment gateway is still loading."); return; }
    setLoading(true); setError("");
    const idempotencyKey = crypto.randomUUID().replace(/-/g, "");
    try {
      const started = await fetch("/api/wallet/topups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountPaise, idempotencyKey }) });
      const payload = await started.json();
      if (!started.ok) throw new Error(payload.error || "Could not start top-up.");
      new window.Razorpay({ key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: payload.order.amount, currency: payload.order.currency, name: "XILAR Wallet", description: "Closed-loop wallet top-up", order_id: payload.order.id, handler: async (response: Record<string, string>) => {
        const verified = await fetch("/api/wallet/topups/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
        const result = await verified.json();
        if (!verified.ok) { setError(result.error || "Payment could not be settled."); setLoading(false); return; }
        setWallet((current) => ({ ...current, availablePaise: current.availablePaise + amountPaise })); setLoading(false);
      }, modal: { ondismiss: () => setLoading(false) } }).open();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not start top-up."); setLoading(false); }
  }
  return <div className="min-h-screen"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60"><p className="text-[10px] uppercase tracking-[.3em] text-muted-foreground mb-3">XILAR account</p><h1 className="font-display text-4xl md:text-6xl">Wallet</h1></div>
    <main className="max-w-3xl p-6 md:px-12 space-y-8"><section className="border border-border/60 p-6 md:p-8 space-y-5"><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">Available balance</p><p className="font-display text-5xl mt-2 tabular-nums">{inr(wallet.availablePaise)}</p></div><Wallet className="h-6 w-6 text-red-accent" /></div>{wallet.isFrozen ? <p className="text-sm text-destructive">Wallet frozen: {wallet.freezeReason || "Contact support."}</p> : <p className="text-xs text-muted-foreground">Use only on XILAR. Non-transferable and not redeemable for cash.</p>}</section>
    <section className="border border-border/60 p-6 space-y-4"><div className="flex items-center gap-2"><Plus className="h-4 w-4" /><h2 className="text-sm font-semibold uppercase tracking-[.15em]">Add funds</h2></div><div className="flex gap-2"><input aria-label="Wallet top-up amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="h-11 flex-1 border bg-secondary/20 px-3" /><Button onClick={topUp} disabled={loading || wallet.isFrozen} className="rounded-none">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add money"}</Button></div><p className="text-xs text-muted-foreground">₹10–₹2,000 per top-up · ₹5,000 maximum balance and daily funding limit.</p>{error && <p className="text-sm text-destructive">{error}</p>}</section>
    <section className="space-y-3"><div className="flex items-center gap-2"><ArrowDownLeft className="h-4 w-4" /><h2 className="text-sm font-semibold uppercase tracking-[.15em]">Activity</h2></div>{wallet.entries.length === 0 ? <p className="text-sm text-muted-foreground border p-5">No wallet activity yet.</p> : wallet.entries.map((entry) => <div key={entry.id} className="flex justify-between border-b border-border/60 py-3 text-sm"><span>{entry.note || entry.type}</span><span className={entry.amountPaise < 0 ? "text-foreground" : "text-green-600"}>{entry.amountPaise < 0 ? "−" : "+"}{inr(Math.abs(entry.amountPaise))}</span></div>)}</section>
    <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Top-ups are verified with Razorpay before crediting. Your balance can only be spent on XILAR purchases and try-ons.</p></main></div>;
}

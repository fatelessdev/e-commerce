"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { issueWalletRefund } from "@/lib/actions/admin";

export function RefundPanel({ orderId, total, refundedPaise, eligible }: { orderId: string; total: string; refundedPaise: number; eligible: boolean }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const remaining = Math.max(0, Math.round(Number(total) * 100) - refundedPaise);
  async function submit() {
    setPending(true); setMessage("");
    try { await issueWalletRefund({ orderId, refundAmount: Number(amount), reason }); setMessage("Wallet refund issued."); setAmount(""); setReason(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not issue refund."); }
    finally { setPending(false); }
  }
  return <div className="border rounded-lg"><div className="p-4 border-b bg-muted/50"><h2 className="font-semibold">Wallet refund</h2></div><div className="p-4 space-y-3 text-sm"><p className="text-muted-foreground">Remaining refundable: ₹{(remaining / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>{eligible && remaining > 0 ? <><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Refund amount" className="h-10 w-full border px-3" /><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (required)" className="min-h-20 w-full border p-3" /><Button className="rounded-none" onClick={submit} disabled={pending || !amount || !reason}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Credit wallet"}</Button></> : <p className="text-xs text-muted-foreground">Refunds are available only after payment is marked paid.</p>}{message && <p className="text-xs">{message}</p>}</div></div>;
}

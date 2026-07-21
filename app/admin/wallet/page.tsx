import { getWalletReconciliation } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage() {
  const reconciliation = await getWalletReconciliation();
  const sections = [
    ["Pending top-ups", reconciliation.pendingTopUps.map((row) => `${row.razorpayOrderId} · ₹${(row.amountPaise / 100).toFixed(2)}`)],
    ["Expired wallet holds", reconciliation.expiredReservations.map((row) => `${row.referenceType} · ₹${(row.amountPaise / 100).toFixed(2)}`)],
    ["Recent automatic reversals", reconciliation.recentReversals.map((row) => `${row.note || row.referenceType} · ₹${(row.amountPaise / 100).toFixed(2)}`)],
  ] as const;
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold tracking-tight">Wallet reconciliation</h1><p className="text-muted-foreground">Read-only review for unsettled payment and generation activity.</p></div><div className="grid gap-5 lg:grid-cols-3">{sections.map(([title, rows]) => <section key={title} className="border rounded-lg"><h2 className="border-b bg-muted/50 p-4 font-semibold">{title}</h2><div className="p-4 text-sm space-y-2">{rows.length ? rows.map((row, index) => <p key={`${row}-${index}`} className="break-all">{row}</p>) : <p className="text-muted-foreground">None.</p>}</div></section>)}</div></div>;
}

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CreditCard, Gift, Calendar, Info } from "lucide-react"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"
import { normalizeSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
    title: "Refund Policy — XILAR Wallet",
    description:
        "XILAR refund policy: approved refunds are credited to your XILAR wallet. No cash withdrawals or transfers.",
    alternates: {
        canonical: "/policies/refunds",
    },
    openGraph: {
        title: "Refund Policy | XILAR",
        description:
            "Approved refunds are credited to your XILAR wallet. No cash withdrawals or transfers.",
        url: "/policies/refunds",
    },
}

export default function RefundPolicyPage() {
    const baseUrl = normalizeSiteUrl()

    return (
        <div className="min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Store Policies", url: "/policies" },
                    { name: "Refund Policy", url: "/policies/refunds" },
                ])}
            />
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <Link href="/policies" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-4 uppercase tracking-[0.15em] transition-colors duration-300">
                    <ArrowLeft className="h-3 w-3" /> Back to policies
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-5 w-5 text-red-accent" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Policy</p>
                </div>
                <h1 className="font-display text-4xl md:text-6xl">Refund policy</h1>
                <p className="text-sm text-muted-foreground mt-2">Account-bound wallet refunds</p>
            </div>

            <div className="p-6 md:px-12 max-w-3xl space-y-8">
                {/* No Cash Refunds */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">No cash refunds</h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <p className="font-medium text-sm">
                            All approved refunds are processed as <strong>XILAR wallet credit</strong>.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            We do not offer cash withdrawals, bank transfers, or wallet transfers. Wallet credit can be used on XILAR purchases and try-ons.
                        </p>
                    </div>
                </section>

                {/* Bonus */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Gift className="h-4 w-4 text-red-accent" /> Bonus credit
                    </h2>
                    <div className="p-4 bg-red-accent/5 border border-red-accent/20">
                        <p className="font-medium text-sm text-red-accent">
                            We value your trust. Defective returns receive:
                        </p>
                        <div className="mt-4 text-center">
                            <div className="text-3xl font-black tracking-tight">Approved refund value</div>
                            <p className="text-xs text-muted-foreground mt-2">
                                To your wallet
                            </p>
                        </div>
                        <p className="text-xs mt-4 text-muted-foreground tabular-nums">
                            Example: If a ₹1,999 refund is approved, ₹1,999 is credited to your wallet.
                        </p>
                    </div>
                </section>

                {/* Validity */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-accent" /> Credit validity
                    </h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <p className="font-medium text-sm">
                            Wallet refunds <strong>do not expire</strong>.
                        </p>
                        <ul className="text-xs text-muted-foreground mt-3 space-y-1">
                            <li className="flex items-start gap-2"><span className="text-red-accent mt-0.5">·</span> Standard defects: 30 days validity</li>
                            <li className="flex items-start gap-2"><span className="text-red-accent mt-0.5">·</span> Severe defects / delays: 60 days validity</li>
                            <li className="flex items-start gap-2"><span className="text-red-accent mt-0.5">·</span> Credit cannot be extended after expiry</li>
                        </ul>
                    </div>
                </section>

                {/* How It Works */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">How it works</h2>
                    <div className="space-y-2">
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">1</span>
                            <div>
                                <p className="font-medium text-sm">Return approved</p>
                                <p className="text-xs text-muted-foreground">After we verify your defect claim with unboxing video</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">2</span>
                            <div>
                                <p className="font-medium text-sm">Credit issued</p>
                                <p className="text-xs text-muted-foreground">Your approved amount is credited directly to your XILAR wallet</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">3</span>
                            <div>
                                <p className="font-medium text-sm">Use at checkout</p>
                                <p className="text-xs text-muted-foreground">Apply the code at checkout on your next order</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Important Notes */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Info className="h-4 w-4" /> Important notes
                    </h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Wallet credit is <strong>non-transferable</strong>, account-bound, and cannot be withdrawn</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Credit cannot be combined with bargain discounts</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>If order total is less than credit amount, remaining balance is forfeited</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Credit applies to product value only (shipping charges calculated separately)</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Why Store Credit */}
                <section className="space-y-3">
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <p className="font-medium text-sm">Why wallet credit instead of cash?</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Wallet credit keeps refunds secure, immediate, and tied to the account that placed the order. It can only be used within XILAR and is never transferable or withdrawable.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    )
}

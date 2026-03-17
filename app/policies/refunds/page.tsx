import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CreditCard, Gift, Calendar, Info } from "lucide-react"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"

export const metadata: Metadata = {
    title: "Refund Policy — Store Credit with 5% Bonus",
    description:
        "XILAR refund policy: all refunds issued as store credit with a 5% bonus. Valid 30–60 days. No cash refunds.",
    alternates: {
        canonical: "/policies/refunds",
    },
    openGraph: {
        title: "Refund Policy | XILAR",
        description:
            "All refunds issued as store credit with a 5% bonus. Valid 30–60 days. No cash refunds.",
        url: "/policies/refunds",
    },
}

export default function RefundPolicyPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <div className="min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Store Policies", url: "/policies" },
                    { name: "Refund Policy", url: "/policies/refunds" },
                ])}
            />
            <div className="px-6 py-12 border-b border-border">
                <Link href="/policies" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Policies
                </Link>
                <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                    <CreditCard className="h-8 w-8" /> Refund Policy
                </h1>
                <p className="text-muted-foreground mt-2">Store Credit System</p>
            </div>

            <div className="p-6 max-w-3xl space-y-8">
                {/* No Cash Refunds */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">No Cash Refunds</h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <p className="font-medium">
                            All refunds for defective items are processed as <strong>Store Credit (Coupons)</strong>.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            We do not offer cash refunds, bank transfers, or payment reversals. Store credit can be used on any future purchase.
                        </p>
                    </div>
                </section>

                {/* Bonus */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Gift className="h-5 w-5 text-red-accent" /> Bonus Credit
                    </h2>
                    <div className="p-4 bg-red-accent/10 border border-red-accent/30">
                        <p className="font-medium text-red-accent">
                            We value your trust! Defective returns receive:
                        </p>
                        <div className="mt-4 text-center">
                            <div className="text-4xl font-black">Product Value + 5%</div>
                            <p className="text-sm text-muted-foreground mt-2">
                                As store credit
                            </p>
                        </div>
                        <p className="text-sm mt-4">
                            Example: If you paid ₹1,999 for a defective item, you&apos;ll receive ₹2,099 as store credit.
                        </p>
                    </div>
                </section>

                {/* Validity */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-red-accent" /> Credit Validity
                    </h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <p className="font-medium">
                            Store credit coupons are valid for <strong>30-60 days</strong>.
                        </p>
                        <ul className="text-sm text-muted-foreground mt-3 space-y-1">
                            <li>• Standard defects: 30 days validity</li>
                            <li>• Severe defects / delays: 60 days validity</li>
                            <li>• Credit cannot be extended after expiry</li>
                        </ul>
                    </div>
                </section>

                {/* How It Works */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">How It Works</h2>
                    <div className="space-y-3">
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">1</span>
                            <div>
                                <p className="font-medium">Return Approved</p>
                                <p className="text-sm text-muted-foreground">After we verify your defect claim with unboxing video</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">2</span>
                            <div>
                                <p className="font-medium">Credit Issued</p>
                                <p className="text-sm text-muted-foreground">You&apos;ll receive a unique coupon code via email within 24-48 hours</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">3</span>
                            <div>
                                <p className="font-medium">Use at Checkout</p>
                                <p className="text-sm text-muted-foreground">Apply the code at checkout on your next order</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Important Notes */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Info className="h-5 w-5" /> Important Notes
                    </h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Store credit is <strong>non-transferable</strong> and linked to your account</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Credit cannot be combined with bargain discounts</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>If order total is less than credit amount, remaining balance is forfeited</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Credit applies to product value only (shipping charges calculated separately)</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Why Store Credit */}
                <section className="space-y-4">
                    <div className="p-4 bg-secondary/20 border border-border">
                        <p className="font-medium">Why Store Credit Instead of Cash?</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Store credit allows us to keep prices affordable for everyone. Processing cash refunds involves 
                            payment gateway fees, bank charges, and administrative overhead. By offering store credit with 
                            a bonus, you actually get more value while we maintain competitive pricing.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    )
}

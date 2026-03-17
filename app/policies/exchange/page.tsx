import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Clock, Tag, AlertCircle } from "lucide-react"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"

export const metadata: Metadata = {
    title: "Exchange Policy — Size & Color Exchanges Within 48 Hours",
    description:
        "XILAR exchange policy: exchanges accepted within 48 hours of delivery for size or color issues only. Product must be unused with tags intact.",
    alternates: {
        canonical: "/policies/exchange",
    },
    openGraph: {
        title: "Exchange Policy | XILAR",
        description:
            "Exchanges accepted within 48 hours of delivery for size or color issues only. Product must be unused with tags intact.",
        url: "/policies/exchange",
    },
}

export default function ExchangePolicyPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <div className="min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Store Policies", url: "/policies" },
                    { name: "Exchange Policy", url: "/policies/exchange" },
                ])}
            />
            <div className="px-6 py-12 border-b border-border">
                <Link href="/policies" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Policies
                </Link>
                <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                    <RefreshCw className="h-8 w-8" /> Exchange Policy
                </h1>
                <p className="text-muted-foreground mt-2">Strictly Enforced</p>
            </div>

            <div className="p-6 max-w-3xl space-y-8">
                {/* Eligibility */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Tag className="h-5 w-5 text-red-accent" /> Eligibility
                    </h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <p className="font-medium">
                            Exchanges are allowed <strong>ONLY</strong> for Size or Color issues.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            We do not accept exchange requests for &quot;change of mind,&quot; &quot;didn&apos;t like the style,&quot; or similar reasons.
                        </p>
                    </div>
                </section>

                {/* Timeframe */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Clock className="h-5 w-5 text-red-accent" /> Timeframe
                    </h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <p className="font-medium">
                            Request must be raised within <strong>48 hours</strong> of delivery.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Requests after 48 hours will not be entertained under any circumstances.
                        </p>
                    </div>
                </section>

                {/* Condition */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Product Condition</h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Product must be <strong>unused</strong> and <strong>unwashed</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Original tags must be <strong>intact</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Product must be in original packaging</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Limit */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" /> Exchange Limit
                    </h2>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30">
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                            Only <strong>ONE</strong> exchange attempt per order.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            If the size/color you want is unavailable, we&apos;ll issue store credit instead.
                        </p>
                    </div>
                </section>

                {/* How to Request */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">How to Request an Exchange</h2>
                    <div className="space-y-3">
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">1</span>
                            <div>
                                <p className="font-medium">Contact Support</p>
                                <p className="text-sm text-muted-foreground">Email us at support@xilar.in within 48 hours of delivery</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">2</span>
                            <div>
                                <p className="font-medium">Share Order Details</p>
                                <p className="text-sm text-muted-foreground">Include your order ID and reason for exchange (size/color)</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">3</span>
                            <div>
                                <p className="font-medium">Ship the Product</p>
                                <p className="text-sm text-muted-foreground">Pack it safely with tags intact. We&apos;ll provide pickup or shipping instructions.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">4</span>
                            <div>
                                <p className="font-medium">Receive New Product</p>
                                <p className="text-sm text-muted-foreground">We&apos;ll ship the correct size/color once we receive the original.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

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
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <Link href="/policies" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-4 uppercase tracking-[0.15em] transition-colors duration-300">
                    <ArrowLeft className="h-3 w-3" /> Back to policies
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <RefreshCw className="h-5 w-5 text-red-accent" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Policy</p>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Exchange policy</h1>
                <p className="text-sm text-muted-foreground mt-2">Strictly enforced</p>
            </div>

            <div className="p-6 md:px-12 max-w-3xl space-y-8">
                {/* Eligibility */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Tag className="h-4 w-4 text-red-accent" /> Eligibility
                    </h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <p className="font-medium text-sm">
                            Exchanges are allowed <strong>only</strong> for size or color issues.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            We do not accept exchange requests for &quot;change of mind,&quot; &quot;didn&apos;t like the style,&quot; or similar reasons.
                        </p>
                    </div>
                </section>

                {/* Timeframe */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-accent" /> Timeframe
                    </h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <p className="font-medium text-sm">
                            Request must be raised within <strong>48 hours</strong> of delivery.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Requests after 48 hours will not be entertained under any circumstances.
                        </p>
                    </div>
                </section>

                {/* Condition */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Product condition</h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Product must be <strong>unused</strong> and <strong>unwashed</strong></span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Original tags must be <strong>intact</strong></span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Product must be in original packaging</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Limit */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" /> Exchange limit
                    </h2>
                    <div className="p-4 bg-orange-500/5 border border-orange-500/20">
                        <p className="font-medium text-sm text-orange-600 dark:text-orange-400">
                            Only <strong>one</strong> exchange attempt per order.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            If the size/color you want is unavailable, we&apos;ll issue store credit instead.
                        </p>
                    </div>
                </section>

                {/* How to Request */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">How to request an exchange</h2>
                    <div className="space-y-2">
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">1</span>
                            <div>
                                <p className="font-medium text-sm">Contact support</p>
                                <p className="text-xs text-muted-foreground">Email us at support@xilar.in within 48 hours of delivery</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">2</span>
                            <div>
                                <p className="font-medium text-sm">Share order details</p>
                                <p className="text-xs text-muted-foreground">Include your order ID and reason for exchange (size/color)</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">3</span>
                            <div>
                                <p className="font-medium text-sm">Ship the product</p>
                                <p className="text-xs text-muted-foreground">Pack it safely with tags intact. We&apos;ll provide pickup or shipping instructions.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">4</span>
                            <div>
                                <p className="font-medium text-sm">Receive new product</p>
                                <p className="text-xs text-muted-foreground">We&apos;ll ship the correct size/color once we receive the original.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

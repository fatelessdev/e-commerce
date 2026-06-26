import type { Metadata } from "next"
import Link from "next/link"
import { FileText, RefreshCw, Truck, CreditCard } from "lucide-react"
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/structured-data"
import { normalizeSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
    title: "Store Policies — Exchange, Returns, Refunds & Shipping",
    description:
        "Read XILAR policies on exchanges (48hr window), returns (defects only), refunds (store credit + 5% bonus), and shipping (free above ₹999).",
    alternates: {
        canonical: "/policies",
    },
    openGraph: {
        title: "Store Policies | XILAR",
        description:
            "Read XILAR policies on exchanges, returns, refunds, and shipping. Free shipping above ₹999.",
        url: "/policies",
    },
}

export default function PoliciesPage() {
    const baseUrl = normalizeSiteUrl()

    const policies = [
        {
            title: "Exchange Policy",
            description: "Size or color issues? We've got you covered within 48 hours.",
            href: "/policies/exchange",
            icon: RefreshCw,
        },
        {
            title: "Return Policy",
            description: "Returns accepted only for defective/damaged products.",
            href: "/policies/returns",
            icon: FileText,
        },
        {
            title: "Refund Policy",
            description: "All refunds processed as store credit with bonus.",
            href: "/policies/refunds",
            icon: CreditCard,
        },
        {
            title: "Shipping Policy",
            description: "Free shipping on orders above ₹999.",
            href: "/policies/shipping",
            icon: Truck,
        },
    ]

    return (
        <div className="min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Store Policies", url: "/policies" },
                ])}
            />
            <JsonLd
                data={faqJsonLd([
                    {
                        question: "What is XILAR's exchange policy?",
                        answer: "Exchanges are accepted within 48 hours of delivery for size or color issues only. Product must be unused with tags intact.",
                    },
                    {
                        question: "Does XILAR accept returns?",
                        answer: "Returns are accepted only for defective or damaged products. An unboxing video is required as proof.",
                    },
                    {
                        question: "How does XILAR handle refunds?",
                        answer: "All refunds are issued as store credit (not cash) with a 5% bonus on top of the refund amount. Store credits are valid for 30-60 days.",
                    },
                    {
                        question: "What are XILAR's shipping charges?",
                        answer: "Free shipping on orders above ₹999. Standard delivery is ₹99. Cash on Delivery is available with an additional ₹50 fee.",
                    },
                ])}
            />
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Legal</p>
                <h1 className="font-display text-4xl md:text-6xl">Store policies</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Everything you need to know about exchanges, returns, refunds, and shipping.
                </p>
            </div>

            <div className="p-6 md:px-12 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {policies.map((policy) => (
                        <Link
                            key={policy.href}
                            href={policy.href}
                            className="group p-6 border border-border/60 hover:border-foreground/40 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-secondary/50 flex items-center justify-center flex-shrink-0">
                                    <policy.icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.05em] group-hover:text-red-accent transition-colors duration-300">
                                        {policy.title}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                        {policy.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Summary */}
                <div className="mt-12 p-6 bg-secondary/10 border border-border/60">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">Quick summary</h2>
                    <ul className="space-y-3 text-xs">
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent mt-0.5">·</span>
                            <span><strong className="text-foreground">Exchanges:</strong> <span className="text-muted-foreground">Within 48 hours for size/color only. Product must be unused with tags.</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent mt-0.5">·</span>
                            <span><strong className="text-foreground">Returns:</strong> <span className="text-muted-foreground">Only for defective items. Unboxing video required as proof.</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent mt-0.5">·</span>
                            <span><strong className="text-foreground">Refunds:</strong> <span className="text-muted-foreground">Issued as store credit (not cash) with +5% bonus.</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent mt-0.5">·</span>
                            <span><strong className="text-foreground">Shipping:</strong> <span className="text-muted-foreground">Free above ₹999, otherwise ₹99. COD available (+₹50 fee).</span></span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

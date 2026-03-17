import type { Metadata } from "next"
import Link from "next/link"
import { FileText, RefreshCw, Truck, CreditCard } from "lucide-react"
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/structured-data"

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

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
            <div className="px-6 py-12 border-b border-border">
                <h1 className="text-4xl font-black tracking-tighter uppercase">Store Policies</h1>
                <p className="text-muted-foreground mt-2">
                    Everything you need to know about exchanges, returns, refunds, and shipping.
                </p>
            </div>

            <div className="p-6 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {policies.map((policy) => (
                        <Link
                            key={policy.href}
                            href={policy.href}
                            className="group p-6 border border-border hover:border-foreground transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-secondary flex items-center justify-center flex-shrink-0">
                                    <policy.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg uppercase tracking-tight group-hover:text-red-accent transition-colors">
                                        {policy.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {policy.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Summary */}
                <div className="mt-12 p-6 bg-secondary/20 border border-border">
                    <h2 className="font-bold text-lg uppercase tracking-tight mb-4">Quick Summary</h2>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent">•</span>
                            <span><strong>Exchanges:</strong> Within 48 hours for size/color only. Product must be unused with tags.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent">•</span>
                            <span><strong>Returns:</strong> Only for defective items. Unboxing video required as proof.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent">•</span>
                            <span><strong>Refunds:</strong> Issued as store credit (not cash) with +5% bonus.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-accent">•</span>
                            <span><strong>Shipping:</strong> Free above ₹999, otherwise ₹99. COD available (+₹50 fee).</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

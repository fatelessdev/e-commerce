import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Truck, Clock, MapPin, IndianRupee, Package } from "lucide-react"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"

export const metadata: Metadata = {
    title: "Shipping Policy — Free Delivery Above ₹999",
    description:
        "XILAR shipping policy: free shipping above ₹999, standard delivery ₹99, COD available with ₹50 fee. 5–7 business day delivery across India.",
    alternates: {
        canonical: "/policies/shipping",
    },
    openGraph: {
        title: "Shipping Policy | XILAR",
        description:
            "Free shipping above ₹999, standard delivery ₹99, COD available with ₹50 fee. 5–7 business day delivery.",
        url: "/policies/shipping",
    },
}

export default function ShippingPolicyPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <div className="min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Store Policies", url: "/policies" },
                    { name: "Shipping Policy", url: "/policies/shipping" },
                ])}
            />
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <Link href="/policies" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-4 uppercase tracking-[0.15em] transition-colors duration-300">
                    <ArrowLeft className="h-3 w-3" /> Back to policies
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <Truck className="h-5 w-5 text-red-accent" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Policy</p>
                </div>
                <h1 className="font-display text-4xl md:text-6xl">Shipping policy</h1>
                <p className="text-sm text-muted-foreground mt-2">Fast and reliable delivery</p>
            </div>

            <div className="p-6 md:px-12 max-w-3xl space-y-8">
                {/* Free Shipping */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-red-accent" /> Free shipping
                    </h2>
                    <div className="p-6 bg-red-accent/5 border border-red-accent/20 text-center">
                        <p className="text-2xl font-black tracking-tight uppercase">Free shipping</p>
                        <p className="text-sm mt-2 tabular-nums">on orders above ₹999</p>
                        <p className="text-xs text-muted-foreground mt-3">
                            No minimum items. Just hit ₹999 and shipping is on us.
                        </p>
                    </div>
                </section>

                {/* Standard Shipping */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Standard shipping</h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-sm">Orders below ₹999</p>
                                <p className="text-xs text-muted-foreground">Standard delivery fee applies</p>
                            </div>
                            <div className="text-xl font-semibold tabular-nums">₹99</div>
                        </div>
                    </div>
                </section>

                {/* COD */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-500" /> Cash on delivery
                    </h2>
                    <div className="p-4 bg-orange-500/5 border border-orange-500/20">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="font-medium text-sm text-orange-600 dark:text-orange-400">COD available</p>
                                <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                            </div>
                            <div className="text-xl font-semibold text-orange-600 dark:text-orange-400 tabular-nums">+₹50</div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            A flat COD handling fee of ₹50 is added to all Cash on Delivery orders. 
                            This covers the additional logistics and risk involved in COD shipments.
                        </p>
                    </div>
                </section>

                {/* Delivery Time */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-accent" /> Delivery time
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-secondary/10 border border-border/60">
                            <p className="font-medium text-sm">Metro cities</p>
                            <p className="text-xl font-semibold mt-2">3–5 days</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad</p>
                        </div>
                        <div className="p-4 bg-secondary/10 border border-border/60">
                            <p className="font-medium text-sm">Rest of India</p>
                            <p className="text-xl font-semibold mt-2">5–7 days</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Tier 2/3 cities and other locations</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        * Delivery times are estimates and may vary due to unforeseen circumstances, holidays, or remote locations.
                    </p>
                </section>

                {/* Serviceable Areas */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-accent" /> Serviceable areas
                    </h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <p className="font-medium text-sm">We deliver across India</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            We ship to most PIN codes in India. Some remote areas may have limited service or longer delivery times.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            To check if we deliver to your location, enter your PIN code at checkout.
                        </p>
                    </div>
                </section>

                {/* Tracking */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Order Tracking</h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>You&apos;ll receive a tracking ID via email/SMS once your order ships</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Track your order anytime from the &quot;My Orders&quot; page</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>We partner with trusted couriers for safe and reliable delivery</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Summary Table */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Quick Summary</h2>
                    <div className="border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-secondary/50">
                                    <th className="p-3 text-left font-bold uppercase">Order Value</th>
                                    <th className="p-3 text-right font-bold uppercase">Shipping</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-border">
                                    <td className="p-3">Above ₹999</td>
                                    <td className="p-3 text-right text-green-600 dark:text-green-400 font-bold">FREE</td>
                                </tr>
                                <tr className="border-t border-border">
                                    <td className="p-3">Below ₹999</td>
                                    <td className="p-3 text-right">₹99</td>
                                </tr>
                                <tr className="border-t border-border bg-orange-500/5">
                                    <td className="p-3">COD Extra Fee</td>
                                    <td className="p-3 text-right text-orange-600 dark:text-orange-400">+₹50</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    )
}

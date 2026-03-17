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
            <div className="px-6 py-12 border-b border-border">
                <Link href="/policies" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Policies
                </Link>
                <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                    <Truck className="h-8 w-8" /> Shipping Policy
                </h1>
                <p className="text-muted-foreground mt-2">Fast & Reliable Delivery</p>
            </div>

            <div className="p-6 max-w-3xl space-y-8">
                {/* Free Shipping */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-red-accent" /> Free Shipping
                    </h2>
                    <div className="p-6 bg-red-accent/10 border border-red-accent/30 text-center">
                        <p className="text-3xl font-black">FREE SHIPPING</p>
                        <p className="text-lg mt-2">on orders above ₹999</p>
                        <p className="text-sm text-muted-foreground mt-3">
                            No minimum items. Just hit ₹999 and shipping is on us!
                        </p>
                    </div>
                </section>

                {/* Standard Shipping */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Standard Shipping</h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">Orders below ₹999</p>
                                <p className="text-sm text-muted-foreground">Standard delivery fee applies</p>
                            </div>
                            <div className="text-2xl font-bold">₹99</div>
                        </div>
                    </div>
                </section>

                {/* COD */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-500" /> Cash on Delivery
                    </h2>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="font-medium text-orange-600 dark:text-orange-400">COD Available</p>
                                <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                            </div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">+₹50</div>
                        </div>
                        <p className="text-sm">
                            A flat COD handling fee of ₹50 is added to all Cash on Delivery orders. 
                            This covers the additional logistics and risk involved in COD shipments.
                        </p>
                    </div>
                </section>

                {/* Delivery Time */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Clock className="h-5 w-5 text-red-accent" /> Delivery Time
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/20 border border-border">
                            <p className="font-medium">Metro Cities</p>
                            <p className="text-2xl font-bold mt-2">3-5 Days</p>
                            <p className="text-xs text-muted-foreground mt-1">Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad</p>
                        </div>
                        <div className="p-4 bg-secondary/20 border border-border">
                            <p className="font-medium">Rest of India</p>
                            <p className="text-2xl font-bold mt-2">5-7 Days</p>
                            <p className="text-xs text-muted-foreground mt-1">Tier 2/3 cities and other locations</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        * Delivery times are estimates and may vary due to unforeseen circumstances, holidays, or remote locations.
                    </p>
                </section>

                {/* Serviceable Areas */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-accent" /> Serviceable Areas
                    </h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <p className="font-medium">We deliver across India!</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            We ship to most PIN codes in India. Some remote areas may have limited service or longer delivery times.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
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

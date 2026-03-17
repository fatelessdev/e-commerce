import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText, Video, XCircle, AlertTriangle } from "lucide-react"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"

export const metadata: Metadata = {
    title: "Return Policy — Defective Items Only",
    description:
        "XILAR return policy: returns accepted only for defective or damaged items. Unboxing video required as proof of damage.",
    alternates: {
        canonical: "/policies/returns",
    },
    openGraph: {
        title: "Return Policy | XILAR",
        description:
            "Returns accepted only for defective or damaged items. Unboxing video required as proof of damage.",
        url: "/policies/returns",
    },
}

export default function ReturnPolicyPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <div className="min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Store Policies", url: "/policies" },
                    { name: "Return Policy", url: "/policies/returns" },
                ])}
            />
            <div className="px-6 py-12 border-b border-border">
                <Link href="/policies" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Policies
                </Link>
                <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                    <FileText className="h-8 w-8" /> Return Policy
                </h1>
                <p className="text-muted-foreground mt-2">Defects Only</p>
            </div>

            <div className="p-6 max-w-3xl space-y-8">
                {/* Eligibility */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Eligibility</h2>
                    <div className="p-4 bg-secondary/20 border border-border">
                        <p className="font-medium">
                            Returns are accepted <strong>ONLY</strong> if the product is defective or damaged.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This includes manufacturing defects, wrong product shipped, or damage during transit.
                        </p>
                    </div>
                </section>

                {/* Mandatory Requirement */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Video className="h-5 w-5 text-red-accent" /> Mandatory Requirement
                    </h2>
                    <div className="p-4 bg-red-accent/10 border border-red-accent/30">
                        <p className="font-medium text-red-accent">
                            You MUST provide a continuous, uncut Unboxing Video.
                        </p>
                        <ul className="text-sm mt-3 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Video must clearly show the <strong>shipping label</strong> on the package</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Video must be <strong>continuous</strong> (no cuts or edits)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent font-bold">•</span>
                                <span>Video must clearly show the <strong>defect or damage</strong></span>
                            </li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-3">
                            Without this video, your return request <strong>will be rejected</strong>.
                        </p>
                    </div>
                </section>

                {/* Exclusions */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" /> Exclusions (Not Accepted)
                    </h2>
                    <div className="p-4 bg-red-500/10 border border-red-500/30">
                        <p className="font-medium text-red-600 dark:text-red-400 mb-3">
                            Returns are NOT accepted for:
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>&quot;Change of mind&quot; or &quot;I don&apos;t want it anymore&quot;</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>&quot;Didn&apos;t like the style&quot; or &quot;Doesn&apos;t match my expectations&quot;</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>Slight color variations due to screen/lighting differences</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>Products that have been worn, washed, or altered</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>Products with removed tags</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Important Note */}
                <section className="space-y-4">
                    <div className="p-4 bg-secondary/20 border border-border flex gap-4">
                        <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Why We&apos;re Strict</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                As a premium streetwear brand, we ensure every product goes through quality checks before shipping. 
                                The unboxing video requirement protects both you and us from fraudulent claims. 
                                We value genuine customers and want to maintain affordable prices by minimizing abuse.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Process */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Return Process</h2>
                    <div className="space-y-3">
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">1</span>
                            <div>
                                <p className="font-medium">Record Unboxing</p>
                                <p className="text-sm text-muted-foreground">Start recording before you open the package. Show the shipping label and unbox completely.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">2</span>
                            <div>
                                <p className="font-medium">Contact Support</p>
                                <p className="text-sm text-muted-foreground">Email support@xilar.in with your order ID, video, and description of the defect.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">3</span>
                            <div>
                                <p className="font-medium">Verification</p>
                                <p className="text-sm text-muted-foreground">Our team will review your video and respond within 24-48 hours.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border">
                            <span className="w-8 h-8 bg-red-accent text-white flex items-center justify-center font-bold flex-shrink-0">4</span>
                            <div>
                                <p className="font-medium">Refund Processed</p>
                                <p className="text-sm text-muted-foreground">If approved, you&apos;ll receive store credit (full value + 5% bonus). See our Refund Policy.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

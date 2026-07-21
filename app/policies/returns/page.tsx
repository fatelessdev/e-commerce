import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText, Video, XCircle, AlertTriangle } from "lucide-react"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"
import { normalizeSiteUrl } from "@/lib/seo"

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
    const baseUrl = normalizeSiteUrl()

    return (
        <div className="min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Store Policies", url: "/policies" },
                    { name: "Return Policy", url: "/policies/returns" },
                ])}
            />
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <Link href="/policies" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-4 uppercase tracking-[0.15em] transition-colors duration-300">
                    <ArrowLeft className="h-3 w-3" /> Back to policies
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-red-accent" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Policy</p>
                </div>
                <h1 className="font-display text-4xl md:text-6xl">Return policy</h1>
                <p className="text-sm text-muted-foreground mt-2">Defects only</p>
            </div>

            <div className="p-6 md:px-12 max-w-3xl space-y-8">
                {/* Eligibility */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Eligibility</h2>
                    <div className="p-4 bg-secondary/10 border border-border/60">
                        <p className="font-medium text-sm">
                            Returns are accepted <strong>only</strong> if the product is defective or damaged.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            This includes manufacturing defects, wrong product shipped, or damage during transit.
                        </p>
                    </div>
                </section>

                {/* Mandatory Requirement */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <Video className="h-4 w-4 text-red-accent" /> Mandatory requirement
                    </h2>
                    <div className="p-4 bg-red-accent/5 border border-red-accent/20">
                        <p className="font-medium text-sm text-red-accent">
                            You must provide a continuous, uncut unboxing video.
                        </p>
                        <ul className="text-xs mt-3 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Video must clearly show the <strong>shipping label</strong> on the package</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Video must be <strong>continuous</strong> (no cuts or edits)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-accent mt-0.5">·</span>
                                <span>Video must clearly show the <strong>defect or damage</strong></span>
                            </li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-3">
                            Without this video, your return request <strong>will be rejected</strong>.
                        </p>
                    </div>
                </section>

                {/* Exclusions */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" /> Exclusions
                    </h2>
                    <div className="p-4 bg-red-500/5 border border-red-500/20">
                        <p className="font-medium text-xs text-red-600 dark:text-red-400 mb-3">
                            Returns are not accepted for:
                        </p>
                        <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>&quot;Change of mind&quot; or &quot;I don&apos;t want it anymore&quot;</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>&quot;Didn&apos;t like the style&quot; or &quot;Doesn&apos;t match my expectations&quot;</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>Slight color variations due to screen/lighting differences</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>Products that have been worn, washed, or altered</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>Products with removed tags</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Important Note */}
                <section className="space-y-3">
                    <div className="p-4 bg-secondary/10 border border-border/60 flex gap-4">
                        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm">Why we&apos;re strict</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                As a premium streetwear brand, we ensure every product goes through quality checks before shipping. 
                                The unboxing video requirement protects both you and us from fraudulent claims. 
                                We value genuine customers and want to maintain affordable prices by minimizing abuse.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Process */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Return process</h2>
                    <div className="space-y-2">
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">1</span>
                            <div>
                                <p className="font-medium text-sm">Record unboxing</p>
                                <p className="text-xs text-muted-foreground">Start recording before you open the package. Show the shipping label and unbox completely.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">2</span>
                            <div>
                                <p className="font-medium text-sm">Contact support</p>
                                <p className="text-xs text-muted-foreground">Email support@xilar.in with your order ID, video, and description of the defect.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">3</span>
                            <div>
                                <p className="font-medium text-sm">Verification</p>
                                <p className="text-xs text-muted-foreground">Our team will review your video and respond within 24–48 hours.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-border/60">
                            <span className="w-7 h-7 bg-red-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">4</span>
                            <div>
                                <p className="font-medium text-sm">Refund processed</p>
                                <p className="text-xs text-muted-foreground">If approved, you&apos;ll receive the approved amount in your XILAR wallet. See our Refund Policy.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

import type { Metadata } from "next"
import { ProductGrid } from "@/components/features/product-grid"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"

export const metadata: Metadata = {
    title: "New Arrivals — Latest Drops",
    description:
        "Fresh drops and first access. Discover the latest XILAR arrivals — new streetwear, premium basics, and bold fits just landed.",
    alternates: {
        canonical: "/new",
    },
    openGraph: {
        title: "New Arrivals | XILAR",
        description:
            "Fresh drops and first access. Discover the latest XILAR arrivals — new streetwear, premium basics, and bold fits.",
        url: "/new",
    },
}

export default function NewArrivalsPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <div className="flex flex-col min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "New Arrivals", url: "/new" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "New Arrivals — XILAR",
                    description: "Fresh drops and first access. Discover the latest XILAR arrivals.",
                    url: "/new",
                })}
            />
            <div className="px-6 py-12 border-b border-border">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">New Arrivals</h1>
                <p className="text-muted-foreground mt-2">Fresh drops. First access.</p>
            </div>
            <ProductGrid title="" isNew />
        </div>
    )
}

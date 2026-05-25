import type { Metadata } from "next"
import { ProductGrid } from "@/components/features/product-grid"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"
import { getCatalogProducts } from "@/lib/product-catalog"

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

export default async function NewArrivalsPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const { products } = await getCatalogProducts({ isNew: true })

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
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Fresh drops</p>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase">New arrivals</h1>
                <p className="text-sm text-muted-foreground mt-2">Fresh drops. First access.</p>
            </div>
            <ProductGrid title="" isNew initialProducts={products} />
        </div>
    )
}

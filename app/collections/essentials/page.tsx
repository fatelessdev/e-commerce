import type { Metadata } from "next"
import { ProductGrid } from "@/components/features/product-grid"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"
import { getCatalogProducts } from "@/lib/product-catalog"

export const metadata: Metadata = {
    title: "Essentials Collection — Timeless Streetwear Basics",
    description:
        "The foundation of your wardrobe. Shop XILAR Essentials — versatile joggers, cargo pants, premium tees, and timeless everyday streetwear.",
    alternates: {
        canonical: "/collections/essentials",
    },
    openGraph: {
        title: "Essentials Collection | XILAR",
        description:
            "The foundation of your wardrobe. Versatile joggers, cargo pants, premium tees, and timeless everyday streetwear.",
        url: "/collections/essentials",
    },
}

export default async function EssentialsPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const { products } = await getCatalogProducts()

    return (
        <div className="flex flex-col min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Collections", url: "/" },
                    { name: "Essentials", url: "/collections/essentials" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "Essentials Collection — XILAR",
                    description: "The foundation of your wardrobe. Versatile, timeless, everyday streetwear.",
                    url: "/collections/essentials",
                })}
            />
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Collection</p>
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl">Essentials</h1>
                <p className="text-sm text-muted-foreground mt-2">The foundation of your wardrobe. Versatile. Timeless. Essential.</p>
            </div>
            <ProductGrid title="" initialProducts={products} />
        </div>
    )
}

import type { Metadata } from "next"
import { ProductGrid } from "@/components/features/product-grid"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"
import { getCatalogProducts } from "@/lib/product-catalog"

export const metadata: Metadata = {
    title: "Premium Collection — Elevated XILAR Picks",
    description:
        "Shop the XILAR Premium collection — elevated streetwear picks selected for standout fabric, finish, and presence.",
    alternates: {
        canonical: "/collections/premium",
    },
    openGraph: {
        title: "Premium Collection | XILAR",
        description:
            "Elevated streetwear picks selected for standout fabric, finish, and presence.",
        url: "/collections/premium",
    },
}

export default async function PremiumPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const { products } = await getCatalogProducts({ isPremium: true })

    return (
        <div className="flex flex-col min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Collections", url: "/" },
                    { name: "Premium", url: "/collections/premium" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "Premium Collection — XILAR",
                    description: "Elevated streetwear picks selected for standout fabric, finish, and presence.",
                    url: "/collections/premium",
                })}
            />
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Collection</p>
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl">Premium</h1>
                <p className="text-sm text-muted-foreground mt-2">Elevated picks. Better fabrics. Stronger presence.</p>
            </div>
            <ProductGrid title="" isPremium initialProducts={products} maxProducts={null} showGenderTabs={false} />
        </div>
    )
}

import type { Metadata } from "next"
import { Suspense } from "react"
import { ShopClient } from "@/components/features/shop-client"
import { ComboSection } from "@/components/features/combo-section"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"
import { getActiveCombosWithProducts } from "@/lib/combos"
import { getCatalogProducts } from "@/lib/product-catalog"
import { normalizeSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
    title: "Men's Streetwear",
    description:
        "Shop men's streetwear essentials from XILAR. Oversized tees, cargo pants, joggers, hoodies — elevated fits and bold silhouettes. Free shipping above ₹999.",
    alternates: {
        canonical: "/shop/men",
    },
    openGraph: {
        title: "Men's Streetwear | XILAR",
        description:
            "Shop men's streetwear essentials from XILAR. Oversized tees, cargo pants, joggers, hoodies — elevated fits and bold silhouettes.",
        url: "/shop/men",
    },
}

function ComboSectionSkeleton() {
    return (
        <section className="py-16 md:py-24 px-6 md:px-12 bg-background">
            <div className="flex flex-col items-center mb-8 md:mb-12">
                <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-3">Bundle deals</p>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight">Combos</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, index) => (
                    <div key={index} className="rounded-none border border-border/60 p-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="aspect-[3/4] animate-pulse bg-muted" />
                            <div className="aspect-[3/4] animate-pulse bg-muted" />
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="h-3 w-2/3 animate-pulse bg-muted" />
                            <div className="h-3 w-1/2 animate-pulse bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default function ShopMenPage() {
    const baseUrl = normalizeSiteUrl()
    const catalogPromise = getCatalogProducts({
        gender: "men",
        limit: 24,
        offset: 0,
        includeTotal: true,
    })
    const combosPromise = getActiveCombosWithProducts(6)

    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Shop", url: "/shop" },
                    { name: "Men", url: "/shop/men" },
                ])}
            />
            <ShopClient
                genderFilter="men"
                title="Men"
                subtitle="Oversized tees, cargos, joggers, and layers built for Indian streetwear."
                initialCatalogPromise={catalogPromise}
            />
            <section className="border-t border-border/60 px-6 py-12 md:px-12 md:py-16">
                <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Men&apos;s streetwear</p>
                    <p className="text-base leading-8 text-muted-foreground">
                        XILAR men&apos;s streetwear focuses on oversized tees, cargos, joggers, hoodies, and sharp layers that work in Indian weather and daily city movement. Product pages show live size and stock details before checkout.
                    </p>
                </div>
            </section>
            <Suspense fallback={<ComboSectionSkeleton />}>
                <ComboSection limit={6} interactive={false} initialCombos={combosPromise} />
            </Suspense>
        </>
    )
}

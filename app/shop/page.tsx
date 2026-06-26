import type { Metadata } from "next"
import { ShopClient } from "@/components/features/shop-client"
import { Suspense } from "react"
import { getCatalogProducts } from "@/lib/product-catalog"
import {
    JsonLd,
    breadcrumbJsonLd,
    collectionJsonLd,
} from "@/components/seo/structured-data"
import { normalizeSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
    title: "Shop All Streetwear",
    description:
        "Explore the full XILAR streetwear collection. Premium basics, bold fits, oversized tees, cargos, joggers, and everyday essentials. Free shipping above ₹999.",
    alternates: {
        canonical: "/shop",
    },
    openGraph: {
        title: "Shop All Streetwear | XILAR",
        description:
            "Explore the full XILAR streetwear collection. Premium basics, bold fits, oversized tees, cargos, joggers, and everyday essentials.",
        url: "/shop",
    },
}

export default function ShopPage() {
    const catalogPromise = getCatalogProducts({
        limit: 24,
        offset: 0,
        includeTotal: true,
    })
    const baseUrl = normalizeSiteUrl()

    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Shop", url: "/shop" },
                ])}
            />
            <ShopClient
                genderFilter="all"
                title="All Products"
                subtitle="Premium Indian streetwear across oversized tees, cargos, joggers, hoodies, and accessories."
                initialCatalogPromise={catalogPromise}
            />
            <section className="border-t border-border/60 px-6 py-12 md:px-12 md:py-16">
                <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Streetwear index</p>
                    <p className="text-base leading-8 text-muted-foreground">
                        XILAR brings together oversized t-shirts, cargos, joggers, hoodies, shirts, jeans, jackets, shorts, and accessories for Indian streetwear wardrobes. The catalog is built for relaxed proportions, bold everyday styling, and premium basics without marketplace clutter.
                    </p>
                </div>
            </section>
        </>
    )
}

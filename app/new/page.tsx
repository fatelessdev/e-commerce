import type { Metadata } from "next"
import { ShopClient } from "@/components/features/shop-client"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"
import { getCatalogProducts } from "@/lib/product-catalog"
import { normalizeSiteUrl } from "@/lib/seo"

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
    const baseUrl = normalizeSiteUrl()
    const catalogPromise = getCatalogProducts({
        isNew: true,
        limit: 24,
        offset: 0,
        includeTotal: true,
    })

    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "New Arrivals", url: "/new" },
                ])}
            />
            <ShopClient
                genderFilter="all"
                title="New arrivals"
                subtitle="Fresh drops, first access, and the newest XILAR streetwear pieces."
                isNew
                initialCatalogPromise={catalogPromise}
            />
            <section className="border-t border-border/60 px-6 py-12 md:px-12 md:py-16">
                <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Latest drops</p>
                    <p className="text-base leading-8 text-muted-foreground">
                        New arrivals collect the freshest XILAR products in one place, from oversized t-shirts and cargos to seasonal accessories and premium basics. Availability changes with live catalog stock.
                    </p>
                </div>
            </section>
        </>
    )
}

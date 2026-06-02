import type { Metadata } from "next"
import { ShopClient } from "@/components/features/shop-client"
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

export default async function NewArrivalsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>
}) {
    const { search } = await searchParams
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const { products } = await getCatalogProducts({ isNew: true })

    return (
        <>
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
            <ShopClient
                key={search || ""}
                genderFilter="all"
                title="New arrivals"
                subtitle="Fresh drops. First access."
                initialSearch={search || ""}
                isNew
                initialProducts={products}
            />
        </>
    )
}

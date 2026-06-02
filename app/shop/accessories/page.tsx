import type { Metadata } from "next"
import { ShopClient } from "@/components/features/shop-client"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"
import { getCatalogProducts } from "@/lib/product-catalog"

export const metadata: Metadata = {
    title: "Accessories",
    description:
        "Shop XILAR accessories, including perfume and limited essentials.",
    alternates: {
        canonical: "/shop/accessories",
    },
    openGraph: {
        title: "Accessories | XILAR",
        description:
            "Shop XILAR accessories, including perfume and limited essentials.",
        url: "/shop/accessories",
    },
}

export default async function AccessoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>
}) {
    const { search } = await searchParams
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const { products } = await getCatalogProducts({ category: "accessory" })

    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Shop", url: "/shop" },
                    { name: "Accessories", url: "/shop/accessories" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "Accessories — XILAR",
                    description: "Shop XILAR accessories, including perfume and limited essentials.",
                    url: "/shop/accessories",
                })}
            />
            <ShopClient
                key={search || ""}
                genderFilter="all"
                fixedCategory="accessory"
                title="Accessories"
                subtitle="Perfume and selected essentials"
                initialSearch={search || ""}
                initialProducts={products}
            />
        </>
    )
}

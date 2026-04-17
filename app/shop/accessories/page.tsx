import type { Metadata } from "next"
import { ShopClient } from "@/components/features/shop-client"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"

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

export default function AccessoriesPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

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
                genderFilter="all"
                fixedCategory="accessory"
                title="Accessories"
                subtitle="Perfume and selected essentials"
            />
        </>
    )
}

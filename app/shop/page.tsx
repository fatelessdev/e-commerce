import type { Metadata } from "next"
import { ShopClient } from "@/components/features/shop-client"
import { Suspense } from "react"
import { getCatalogProducts } from "@/lib/product-catalog"
import {
    JsonLd,
    breadcrumbJsonLd,
    collectionJsonLd,
} from "@/components/seo/structured-data"

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

export default async function ShopPage() {
    const { products } = await getCatalogProducts()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <Suspense fallback={<div className="p-6">Loading...</div>}>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Shop", url: "/shop" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "All Products — XILAR",
                    description:
                        "Explore the full XILAR streetwear collection. Premium basics, bold fits, and everyday essentials.",
                    url: "/shop",
                })}
            />
            <ShopClient
                genderFilter="all"
                title="All Products"
                subtitle="Explore the full XILAR collection"
                initialProducts={products}
            />
        </Suspense>
    )
}

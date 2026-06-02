import type { Metadata } from "next"
import { connection } from "next/server"
import { ShopClient } from "@/components/features/shop-client"
import { ComboSection } from "@/components/features/combo-section"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"
import { getActiveCombosWithProducts } from "@/lib/combos"
import { getCatalogProducts } from "@/lib/product-catalog"

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

export default async function ShopMenPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>
}) {
    await connection()

    const { search } = await searchParams
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const [catalog, combos] = await Promise.all([
        getCatalogProducts({ gender: "men", search, limit: 24, offset: 0, includeTotal: true }),
        getActiveCombosWithProducts(6),
    ])

    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Shop", url: "/shop" },
                    { name: "Men", url: "/shop/men" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "Men's Streetwear — XILAR",
                    description: "Streetwear essentials for him. Elevated fits, bold silhouettes.",
                    url: "/shop/men",
                })}
            />
            <ShopClient
                key={search || ""}
                genderFilter="men"
                title="Men"
                subtitle="Streetwear essentials for him"
                initialSearch={search || ""}
                initialCatalog={catalog}
            />
            <ComboSection limit={6} interactive={false} initialCombos={combos} />
        </>
    )
}

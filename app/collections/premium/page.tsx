import type { Metadata } from "next"
import { connection } from "next/server"
import { ShopClient } from "@/components/features/shop-client"
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

export default async function PremiumPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>
}) {
    await connection()

    const { search } = await searchParams
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const catalog = await getCatalogProducts({ isPremium: true, search, limit: 24, offset: 0, includeTotal: true })

    return (
        <>
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
            <ShopClient
                key={search || ""}
                genderFilter="all"
                title="Premium"
                subtitle="Elevated picks. Better fabrics. Stronger presence."
                initialSearch={search || ""}
                isPremium
                initialCatalog={catalog}
            />
        </>
    )
}

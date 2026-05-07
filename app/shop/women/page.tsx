import type { Metadata } from "next"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"
import { ShopClient } from "@/components/features/shop-client"
import { ComboSection } from "@/components/features/combo-section"
import { collectionJsonLd } from "@/components/seo/structured-data"

export const metadata: Metadata = {
    title: "Women's Streetwear",
    description:
        "Shop women's streetwear essentials from XILAR. Clean lines, premium basics, and bold fits. Free shipping above ₹999.",
    alternates: {
        canonical: "/shop/women",
    },
    openGraph: {
        title: "Women's Streetwear | XILAR",
        description:
            "Shop women's streetwear essentials from XILAR. Clean lines, premium basics, and bold fits.",
        url: "/shop/women",
    },
}

export default function ShopWomenPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Shop", url: "/shop" },
                    { name: "Women", url: "/shop/women" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "Women's Streetwear - XILAR",
                    description: "Streetwear essentials for her. Clean lines and bold fits.",
                    url: "/shop/women",
                })}
            />
            <ShopClient genderFilter="women" title="Women" subtitle="Streetwear essentials for her" />
            <ComboSection limit={6} interactive={false} />
        </>
    )
}

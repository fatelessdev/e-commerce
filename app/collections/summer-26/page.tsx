import type { Metadata } from "next"
import { ProductGrid } from "@/components/features/product-grid"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"

export const metadata: Metadata = {
    title: "Summer '26 Collection — Light Fabrics, Bold Statements",
    description:
        "Light fabrics. Bold statements. Shop the XILAR Summer '26 collection — breathable streetwear designed for the heat.",
    alternates: {
        canonical: "/collections/summer-26",
    },
    openGraph: {
        title: "Summer '26 Collection | XILAR",
        description:
            "Light fabrics. Bold statements. Shop the XILAR Summer '26 collection — breathable streetwear for the heat.",
        url: "/collections/summer-26",
    },
}

export default function Summer26Page() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <div className="flex flex-col min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Collections", url: "/" },
                    { name: "Summer '26", url: "/collections/summer-26" },
                ])}
            />
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "Summer '26 Collection — XILAR",
                    description: "Light fabrics. Bold statements. Made for the heat.",
                    url: "/collections/summer-26",
                })}
            />
            <div className="px-6 py-12 border-b border-border">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Summer &apos;26</h1>
                <p className="text-muted-foreground mt-2">Light fabrics. Bold statements. Made for the heat.</p>
            </div>
            <ProductGrid title="" />
        </div>
    )
}

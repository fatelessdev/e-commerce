import type { Metadata } from "next"
import { Suspense } from "react"
import { ProductGrid, ProductGridSkeleton } from "@/components/features/product-grid"
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/components/seo/structured-data"
import { getCatalogProducts, type CatalogProduct } from "@/lib/product-catalog"
import { normalizeSiteUrl } from "@/lib/seo"

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

async function Summer26GridAndSeo({
    productsPromise,
    baseUrl,
}: {
    productsPromise: Promise<{ products: CatalogProduct[] }>
    baseUrl: string
}) {
    const { products } = await productsPromise
    return (
        <>
            <JsonLd
                data={collectionJsonLd(baseUrl, {
                    name: "Summer '26 Collection — XILAR",
                    description: "Light fabrics. Bold statements. Made for the heat.",
                    url: "/collections/summer-26",
                    products: products.map((product) => ({
                        name: product.name,
                        slug: product.slug,
                        image: product.images[0],
                        sellingPrice: product.sellingPrice,
                    })),
                })}
            />
            <ProductGrid
                title=""
                initialProducts={products}
                maxProducts={null}
                showGenderTabs={false}
                enableInfiniteScroll={true}
            />
        </>
    )
}

export default function Summer26Page() {
    const baseUrl = normalizeSiteUrl()
    const productsPromise = getCatalogProducts()

    return (
        <div className="flex flex-col min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "Collections", url: "/" },
                    { name: "Summer '26", url: "/collections/summer-26" },
                ])}
            />
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Collection</p>
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl">Summer &apos;26</h1>
                <p className="text-sm text-muted-foreground mt-2">Light fabrics. Bold statements. Made for the heat.</p>
            </div>
            <Suspense fallback={<ProductGridSkeleton />}>
                <Summer26GridAndSeo productsPromise={productsPromise} baseUrl={baseUrl} />
            </Suspense>
        </div>
    )
}

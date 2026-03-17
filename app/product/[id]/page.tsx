import type { Metadata } from "next"
import { ProductClient } from "@/components/features/product-client"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
    JsonLd,
    productJsonLd,
    breadcrumbJsonLd,
} from "@/components/seo/structured-data"

async function getProduct(id: string) {
    const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))

    return product
}

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await params
    const product = await getProduct(id)

    if (!product) {
        return {
            title: "Product Not Found",
            description: "This product does not exist.",
            robots: {
                index: false,
                follow: false,
            },
        }
    }

    const price = parseFloat(product.sellingPrice)
    const mrp = parseFloat(product.mrp)
    const description = product.description || `Shop ${product.name} — premium streetwear from XILAR. Starting at ₹${price.toLocaleString("en-IN")}.`

    return {
        title: product.name,
        description,
        alternates: {
            canonical: `/product/${product.id}`,
        },
        openGraph: {
            title: `${product.name} — ₹${price.toLocaleString("en-IN")} | XILAR`,
            description,
            url: `/product/${product.id}`,
            type: "website",
            images: product.images?.length
                ? product.images.map((img) => ({
                    url: img,
                    width: 800,
                    height: 800,
                    alt: product.name,
                }))
                : [{ url: "/logo.png", width: 1200, height: 630, alt: "XILAR" }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} | XILAR`,
            description,
            images: product.images?.length ? product.images : ["/logo.png"],
        },
        other: {
            "product:price:amount": price.toString(),
            "product:price:currency": "INR",
            ...(mrp > price && {
                "product:original_price:amount": mrp.toString(),
                "product:original_price:currency": "INR",
            }),
            "product:availability": product.stock > 0 ? "in stock" : "out of stock",
        },
    }
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const product = await getProduct(id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    return (
        <>
            {product && (
                <>
                    <JsonLd
                        data={productJsonLd(baseUrl, {
                            name: product.name,
                            description: product.description,
                            images: product.images,
                            sellingPrice: product.sellingPrice,
                            mrp: product.mrp,
                            stock: product.stock,
                            id: product.id,
                            category: product.category,
                            sizes: product.sizes,
                            colors: product.colors,
                        })}
                    />
                    <JsonLd
                        data={breadcrumbJsonLd(baseUrl, [
                            { name: "Home", url: "/" },
                            { name: "Shop", url: "/shop" },
                            { name: product.name, url: `/product/${product.id}` },
                        ])}
                    />
                </>
            )}
            <ProductClient id={id} />
        </>
    )
}

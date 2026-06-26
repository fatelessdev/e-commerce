import type { Metadata } from "next"
import { ProductClient } from "@/components/features/product-client"
import { permanentRedirect } from "next/navigation"
import { getProductDetailsBySlugOrId } from "@/lib/product-detail"
import { buildProductPath, isProductUuid, normalizeSiteUrl } from "@/lib/seo"
import {
    JsonLd,
    productJsonLd,
    breadcrumbJsonLd,
} from "@/components/seo/structured-data"

export const dynamic = "force-dynamic"

async function getProduct(slugOrId: string) {
    return getProductDetailsBySlugOrId(slugOrId)
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const product = await getProduct(slug)

    if (product && isProductUuid(slug)) {
        permanentRedirect(buildProductPath(product.slug))
    }

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
            canonical: buildProductPath(product.slug),
        },
        openGraph: {
            title: `${product.name} — ₹${price.toLocaleString("en-IN")} | XILAR`,
            description,
            url: buildProductPath(product.slug),
            type: "website",
            images: product.images?.length
                ? product.images.map((img) => ({
                    url: img,
                    width: 800,
                    height: 800,
                    alt: product.name,
                }))
                : [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "XILAR" }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} | XILAR`,
            description,
            images: product.images?.length ? product.images : ["/logo.jpeg"],
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
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const product = await getProduct(slug)
    const baseUrl = normalizeSiteUrl()

    if (product && isProductUuid(slug)) {
        permanentRedirect(buildProductPath(product.slug))
    }

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
                            slug: product.slug,
                            category: product.category,
                            sizes: product.sizes,
                            colors: product.colors,
                            updatedAt: product.updatedAt,
                        })}
                    />
                    <JsonLd
                        data={breadcrumbJsonLd(baseUrl, [
                            { name: "Home", url: "/" },
                            { name: "Shop", url: "/shop" },
                            { name: product.name, url: buildProductPath(product.slug) },
                        ])}
                    />
                </>
            )}
            <ProductClient id={product?.id ?? slug} initialProduct={product ?? undefined} />
        </>
    )
}

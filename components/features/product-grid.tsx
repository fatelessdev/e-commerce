"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal"
import { BargainDiscountStrip } from "@/components/ui/bargain-discount-strip"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"

interface Product {
    id: string
    name: string
    slug: string
    sellingPrice: string
    mrp: string
    maxBargainDiscount: string
    images: string[]
    category: string
    gender: string
    stock: number
    colors: { name: string; hex: string }[]
}

function ColorSwatches({ colors }: { colors: { name: string; hex: string }[] }) {
    if (!colors || colors.length === 0) return null
    return (
        <div className="flex items-center gap-1.5">
            {colors.slice(0, 4).map((color, i) => (
                <div
                    key={i}
                    className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    role="img"
                    aria-label={`Color: ${color.name}`}
                />
            ))}
        </div>
    )
}

export function ProductGrid({ title = "Featured Drops", gender, isFeatured, isNew, layout = "grid" }: { title?: string; gender?: "men" | "women" | "unisex"; isFeatured?: boolean; isNew?: boolean; layout?: "grid" | "scroll" }) {
    const [activeTab, setActiveTab] = useState<"men" | "women">(gender === "women" ? "women" : "men")
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true)
                const params = new URLSearchParams()
                params.set("limit", "8")
                if (activeTab === "men") {
                    params.set("gender", "men")
                } else {
                    params.set("gender", "women")
                }
                if (isFeatured) params.set("isFeatured", "true")
                if (isNew) params.set("isNew", "true")

                const res = await fetch(`/api/products?${params.toString()}`)
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data.products || data)
                }
            } catch (error) {
                console.error("Failed to fetch products:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [activeTab, isFeatured, isNew, gender])

    const formatPrice = (price: string) => {
        const num = parseFloat(price)
        return `₹${num.toLocaleString("en-IN")}`
    }

    return (
        <section className="py-20 md:py-28 px-6 md:px-12 bg-background">
            {/* Header with tabs */}
            <ScrollReveal>
                <div className="flex flex-col items-center mb-14">
                    {title && (
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase mb-8">{title}</h2>
                    )}

                    {/* FOR HIM / FOR HER Tabs */}
                    {!gender && layout !== "scroll" && (
                        <div className="flex items-center gap-8 text-sm" role="tablist" aria-label="Shop by gender">
                            <button
                                role="tab"
                                aria-selected={activeTab === "men"}
                                onClick={() => setActiveTab("men")}
                                className={`tracking-[0.15em] uppercase text-[11px] font-medium pb-2 border-b-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${activeTab === "men"
                                    ? "border-foreground text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                For Him
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === "women"}
                                onClick={() => setActiveTab("women")}
                                className={`tracking-[0.15em] uppercase text-[11px] font-medium pb-2 border-b-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${activeTab === "women"
                                    ? "border-foreground text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                For Her
                            </button>
                        </div>
                    )}
                </div>
            </ScrollReveal>

            {/* Loading State — Skeleton */}
            {loading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-[3/4] bg-muted animate-pulse" />
                            <div className="space-y-2 px-1">
                                <div className="h-3 bg-muted animate-pulse w-3/4" />
                                <div className="h-3 bg-muted animate-pulse w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">No products found</p>
                </div>
            )}

            {/* Product Grid / Scroll */}
            {!loading && products.length > 0 && (
                layout === "scroll" ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:-mx-12 md:px-12">
                        {products.map((product) => (
                            <div key={product.id} className="flex-shrink-0 w-[200px] sm:w-[240px] snap-start">
                                <Link href={`/product/${product.id}`} className="group">
                                    <Card className="bg-transparent border-0 rounded-none hover-lift">
<CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-muted/30">
                                            <BargainDiscountStrip maxBargainDiscount={product.maxBargainDiscount} className="z-10" />
                                            {product.stock === 0 && (
                                                <div className="absolute top-3 left-3 z-10 badge-sold-out">Sold Out</div>
                                            )}
                                            <Image
                                                src={product.images?.[0] || "/clothes/placeholder.jpeg"}
                                                alt={product.name}
                                                fill
                                                sizes="240px"
                                                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                                        </CardContent>
                                        <CardFooter className="flex flex-col items-start px-1 pt-3 pb-2 space-y-1">
                                            <h3 className="font-medium tracking-tight text-xs uppercase leading-tight line-clamp-1">{product.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-semibold tabular-nums">{formatPrice(product.sellingPrice)}</p>
                                                {parseFloat(product.mrp) > parseFloat(product.sellingPrice) && (
                                                    <p className="text-[10px] text-muted-foreground line-through tabular-nums">{formatPrice(product.mrp)}</p>
                                                )}
                                            </div>
                                            <ColorSwatches colors={product.colors} />
                                        </CardFooter>
                                    </Card>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {products.map((product) => (
                        <StaggerItem key={product.id}>
                            <Link href={`/product/${product.id}`} className="group">
                                <Card className="bg-transparent border-0 rounded-none hover-lift">
<CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-muted/30">
                                        <BargainDiscountStrip maxBargainDiscount={product.maxBargainDiscount} className="z-10" />
                                        {/* Sold Out Badge */}
                                        {product.stock === 0 && (
                                            <div className="absolute top-3 left-3 z-10 badge-sold-out">
                                                Sold Out
                                            </div>
                                        )}

                                        {/* Product Image */}
                                        <Image
                                            src={product.images?.[0] || "/clothes/placeholder.jpeg"}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, 25vw"
                                            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                                        />

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                                            <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 flex items-center justify-center shadow-lg shadow-black/5">
                                                <ArrowRight className="h-4 w-4 text-foreground" />
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex flex-col items-start px-1 sm:px-2 pt-4 pb-2 space-y-1.5">
                                        <div className="w-full">
                                            <h3 className="font-medium tracking-tight text-sm uppercase leading-tight">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-sm font-semibold tabular-nums">{formatPrice(product.sellingPrice)}</p>
                                                {parseFloat(product.mrp) > parseFloat(product.sellingPrice) && (
                                                    <p className="text-[10px] text-muted-foreground line-through tabular-nums">{formatPrice(product.mrp)}</p>
                                                )}
                                            </div>
                                        </div>

                                        <ColorSwatches colors={product.colors} />
                                    </CardFooter>
                                </Card>
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
                )
            )}

            {/* View All Link */}
            {layout !== "scroll" && (
            <ScrollReveal delay={0.2}>
                <div className="text-center mt-14">
                    <Link
                        href="/shop"
                        className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-500"
                    >
                        View all products
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                    </Link>
                </div>
            </ScrollReveal>
            )}
        </section>
    )
}

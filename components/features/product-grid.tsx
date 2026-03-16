"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Star, ChevronRight, Loader2 } from "lucide-react"

interface Product {
    id: string
    name: string
    slug: string
    sellingPrice: string
    mrp: string
    images: string[]
    category: string
    gender: string
    stock: number
    colors: { name: string; hex: string }[]
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
    return (
        <div className="flex items-center gap-1">
            <div className="star-rating">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-3 w-3 ${i < rating ? 'fill-current' : 'fill-none stroke-current opacity-30'}`}
                    />
                ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>
    )
}

function ColorSwatches({ colors }: { colors: { name: string; hex: string }[] }) {
    if (!colors || colors.length === 0) return null
    return (
        <div className="flex items-center gap-1">
            {colors.slice(0, 4).map((color, i) => (
                <div
                    key={i}
                    className="w-4 h-4 border border-border"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                />
            ))}
        </div>
    )
}

export function ProductGrid({ title = "Featured Drops", gender }: { title?: string; gender?: "men" | "women" | "unisex" }) {
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
    }, [activeTab])

    const formatPrice = (price: string) => {
        const num = parseFloat(price)
        return `₹${num.toLocaleString("en-IN")}`
    }

    return (
        <section className="py-16 px-6 md:px-12 bg-background">
            {/* Header with tabs */}
            <div className="flex flex-col items-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter uppercase mb-6">{title}</h2>

                {/* FOR HIM / FOR HER Tabs */}
                {!gender && (
                    <div className="flex items-center gap-8 text-sm font-medium">
                        <button
                            onClick={() => setActiveTab("men")}
                            className={`tracking-wider uppercase pb-2 border-b-2 transition-colors ${activeTab === "men"
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            For Him
                        </button>
                        <button
                            onClick={() => setActiveTab("women")}
                            className={`tracking-wider uppercase pb-2 border-b-2 transition-colors ${activeTab === "women"
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            For Her
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No products found</p>
                </div>
            )}

            {/* Product Grid */}
            {!loading && products.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {products.map((product) => (
                        <Link href={`/product/${product.id}`} key={product.id} className="group">
                            <Card className="rounded-none border-0 bg-transparent shadow-none hover-lift">
                                <CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                                    {/* Sold Out Badge */}
                                    {product.stock === 0 && (
                                        <div className="absolute top-3 left-3 z-10 badge-sold-out">
                                            Sold Out
                                        </div>
                                    )}

                                    {/* Product Image */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${product.images?.[0] || "/clothes/placeholder.jpeg"})` }}
                                    />

                                    {/* Hover Overlay with Arrow */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                            <ChevronRight className="h-5 w-5 text-black" />
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="flex flex-col items-start p-4 space-y-2">
                                    {/* Product Name & Price */}
                                    <div className="w-full">
                                        <h3 className="font-medium tracking-tight text-sm uppercase">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm font-semibold">{formatPrice(product.sellingPrice)}</p>
                                            {parseFloat(product.mrp) > parseFloat(product.sellingPrice) && (
                                                <p className="text-xs text-muted-foreground line-through">{formatPrice(product.mrp)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Color Swatches */}
                                    <ColorSwatches colors={product.colors} />

                                    {/* Star Rating (placeholder) */}
                                    <StarRating rating={5} reviews={Math.floor(Math.random() * 100) + 10} />
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* View All Link */}
            <div className="text-center mt-10">
                <Link
                    href="/shop"
                    className="text-sm font-medium uppercase tracking-wider underline underline-offset-4 hover:text-gold transition-colors"
                >
                    View All Products
                </Link>
            </div>
        </section>
    )
}

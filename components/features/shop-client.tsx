"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BargainDiscountStrip } from "@/components/ui/bargain-discount-strip"
import Link from "next/link"
import Image from "next/image"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"

interface Product {
    id: string
    name: string
    slug: string
    sellingPrice: string
    mrp: string
    maxBargainDiscount: string
    images: string[]
    category: string
    gender: "men" | "women" | "unisex"
    sizes: string[]
    isNew?: boolean
    stock: number
}

const CATEGORIES = ["All", "tshirt", "shirt", "cargo", "jogger", "jeans", "hoodie", "jacket", "shorts", "accessory"]
const CATEGORY_LABELS: Record<string, string> = {
    "All": "All",
    "tshirt": "T-Shirts",
    "shirt": "Shirts",
    "cargo": "Cargo",
    "jogger": "Joggers",
    "jeans": "Jeans",
    "hoodie": "Hoodies",
    "jacket": "Jackets",
    "shorts": "Shorts",
    "accessory": "Accessories",
}
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const NUMBER_SIZES = ["26", "28", "30", "32", "34"]
const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo", "shorts"]
const PRICE_RANGES = [
    { label: "All Prices", min: 0, max: Infinity },
    { label: "Under ₹1000", min: 0, max: 1000 },
    { label: "₹1000 - ₹2000", min: 1000, max: 2000 },
    { label: "Over ₹2000", min: 2000, max: Infinity },
]

interface ShopClientProps {
    genderFilter?: "men" | "women" | "unisex" | "all"
    title?: string
    subtitle?: string
    initialSearch?: string
    fixedCategory?: string
}

export function ShopClient({ genderFilter = "all", title = "All Products", subtitle, initialSearch = "", fixedCategory }: ShopClientProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(initialSearch)
    const [selectedCategory, setSelectedCategory] = useState(fixedCategory || "All")
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0])
    const [showFilters, setShowFilters] = useState(false)
    const [visibleCount, setVisibleCount] = useState(8)

    useEffect(() => {
        if (fixedCategory) {
            setSelectedCategory(fixedCategory)
            setSelectedSize(null)
        }
    }, [fixedCategory])

    // Fetch products from API
    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true)
                const params = new URLSearchParams()
                params.set("limit", "100")
                if (genderFilter !== "all") {
                    params.set("gender", genderFilter)
                }
                if (fixedCategory) {
                    params.set("category", fixedCategory)
                }
                
                const res = await fetch(`/api/products?${params.toString()}`)
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data.products || [])
                }
            } catch (error) {
                console.error("Failed to fetch products:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [genderFilter, fixedCategory])

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            // Search
            if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }
            // Category
            if (selectedCategory !== "All" && product.category !== selectedCategory) {
                return false
            }
            // Size
            if (selectedSize && !product.sizes.includes(selectedSize)) {
                return false
            }
            // Price
            const price = parseFloat(product.sellingPrice)
            if (price < selectedPriceRange.min || price > selectedPriceRange.max) {
                return false
            }
            return true
        })
    }, [products, searchQuery, selectedCategory, selectedSize, selectedPriceRange])

    const visibleProducts = filteredProducts.slice(0, visibleCount)
    const hasMore = visibleCount < filteredProducts.length

    // Infinite scroll sentinel
    const sentinelRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!hasMore || loading) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => prev + 8)
                }
            },
            { rootMargin: "200px" }
        )
        const el = sentinelRef.current
        if (el) observer.observe(el)
        return () => { if (el) observer.unobserve(el) }
    }, [hasMore, loading, filteredProducts.length])

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedCategory(fixedCategory || "All")
        setSelectedSize(null)
        setSelectedPriceRange(PRICE_RANGES[0])
    }

    const activeFilterCount = [
        !fixedCategory && selectedCategory !== "All",
        selectedSize !== null,
        selectedPriceRange !== PRICE_RANGES[0],
    ].filter(Boolean).length

    const formatPrice = (price: string) => {
        const num = parseFloat(price)
        return `₹${num.toLocaleString("en-IN")}`
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Shop</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-6 md:px-12 py-4 border-b border-border/60 sticky top-16 z-40 bg-background/80 backdrop-blur-xl">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                    />
                </div>

                {/* Filter Toggle & Sort */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none h-10 text-[10px] uppercase tracking-[0.1em] gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="rounded-none h-10 text-[10px] uppercase tracking-[0.1em]" onClick={clearFilters}>
                            <X className="h-3.5 w-3.5 mr-1" /> Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="px-6 md:px-12 py-5 border-b border-border/60 bg-secondary/10 flex flex-wrap gap-6">
                    {/* Category */}
                    {!fixedCategory && (
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Category</label>
                            <div className="flex flex-wrap gap-1.5">
                                {CATEGORIES.map((cat) => (
                                    <Button
                                        key={cat}
                                        variant={selectedCategory === cat ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-none h-8 text-[10px] tracking-wide"
                                        onClick={() => {
                                            setSelectedCategory(cat)
                                            setSelectedSize(null)
                                        }}
                                    >
                                        {CATEGORY_LABELS[cat] || cat}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size */}
                    {selectedCategory !== "accessory" && (
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Size</label>
                            <div className="flex flex-wrap gap-1.5">
                                {(NUMBER_SIZE_CATEGORIES.includes(selectedCategory) ? NUMBER_SIZES : selectedCategory === "All" ? [...DEFAULT_SIZES, ...NUMBER_SIZES] : DEFAULT_SIZES).map((size) => (
                                    <Button
                                        key={size}
                                        variant={selectedSize === size ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-none h-8 text-[10px] tracking-wide"
                                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                                    >
                                        {size}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Price */}
                    <div className="space-y-2.5">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Price</label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRICE_RANGES.map((range) => (
                                <Button
                                    key={range.label}
                                    variant={selectedPriceRange === range ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-none h-8 text-[10px] tracking-wide"
                                    onClick={() => setSelectedPriceRange(range)}
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Product Grid */}
            <div className="py-10 px-6 md:px-12">
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="aspect-[3/4] bg-muted animate-pulse" />
                                <div className="space-y-2 px-1">
                                    <div className="h-3 bg-muted animate-pulse w-3/4" />
                                    <div className="h-3 bg-muted animate-pulse w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <p className="text-[10px] text-muted-foreground mb-6 uppercase tracking-[0.15em] tabular-nums">{filteredProducts.length} products</p>
                        {visibleProducts.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                                {visibleProducts.map((product) => (
                                    <Link href={`/product/${product.id}`} key={product.id} className="group">
                                        <Card className="bg-transparent border-0 rounded-none hover-lift">
<CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-muted/30">
                                                <BargainDiscountStrip maxBargainDiscount={product.maxBargainDiscount} className="z-10" />
                                                <Image
                                                    src={product.images?.[0] || "/placeholder.jpg"}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, 25vw"
                                                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                                                />
                                                {product.isNew && (
                                                    <span className="absolute top-3 left-3 bg-foreground text-background text-[10px] px-2.5 py-1 uppercase tracking-[0.1em] font-medium">
                                                        New
                                                    </span>
                                                )}
                                                {product.stock === 0 && (
                                                    <span className="absolute top-3 right-3 badge-sold-out">
                                                        Sold out
                                                    </span>
                                                )}
                                            </CardContent>
                                            <CardFooter className="flex flex-col items-start px-1 sm:px-2 pt-4 pb-2 space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
                                                    {CATEGORY_LABELS[product.category] || product.category}
                                                </p>
                                                <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                                                    <h3 className="font-medium tracking-tight text-sm line-clamp-1">{product.name}</h3>
                                                    <div className="text-left sm:text-right">
                                                        <span className="font-semibold text-sm tabular-nums">{formatPrice(product.sellingPrice)}</span>
                                                        {parseFloat(product.mrp) > parseFloat(product.sellingPrice) && (
                                                            <span className="text-[10px] text-muted-foreground line-through ml-1 sm:ml-2 tabular-nums">
                                                                {formatPrice(product.mrp)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24">
                                <p className="text-sm text-muted-foreground">No products found matching your filters</p>
                                <Button variant="link" onClick={clearFilters} className="mt-2 text-xs">
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && !loading && (
                <div ref={sentinelRef} className="py-8 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    )
}

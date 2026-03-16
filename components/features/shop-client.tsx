"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"

interface Product {
    id: string
    name: string
    slug: string
    sellingPrice: string
    mrp: string
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
const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo"]
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
}

export function ShopClient({ genderFilter = "all", title = "All Products", subtitle, initialSearch = "" }: ShopClientProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(initialSearch)
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0])
    const [showFilters, setShowFilters] = useState(false)
    const [visibleCount, setVisibleCount] = useState(8)

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
    }, [genderFilter])

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
        setSelectedCategory("All")
        setSelectedSize(null)
        setSelectedPriceRange(PRICE_RANGES[0])
    }

    const activeFilterCount = [
        selectedCategory !== "All",
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
            <div className="px-6 py-8 border-b border-white/10">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">{title}</h1>
                {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-6 py-4 border-b border-white/10 glass sticky top-16 z-40">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>

                {/* Filter Toggle & Sort */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none h-10 text-xs uppercase gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="rounded-none h-10 text-xs uppercase" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-1" /> Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="px-6 py-4 border-b border-white/10 bg-secondary/20 flex flex-wrap gap-6">
                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-none h-8 text-xs"
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

                    {/* Size */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Size</label>
                        <div className="flex flex-wrap gap-2">
                            {(NUMBER_SIZE_CATEGORIES.includes(selectedCategory) ? NUMBER_SIZES : selectedCategory === "All" ? [...DEFAULT_SIZES, ...NUMBER_SIZES] : DEFAULT_SIZES).map((size) => (
                                <Button
                                    key={size}
                                    variant={selectedSize === size ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-none h-8 text-xs"
                                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                                >
                                    {size}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price</label>
                        <div className="flex flex-wrap gap-2">
                            {PRICE_RANGES.map((range) => (
                                <Button
                                    key={range.label}
                                    variant={selectedPriceRange === range ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-none h-8 text-xs"
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
            <div className="py-8 px-6">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-6">{filteredProducts.length} products</p>
                        {visibleProducts.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                                {visibleProducts.map((product) => (
                                    <Link href={`/product/${product.id}`} key={product.id} className="group">
                                        <Card className="rounded-none border-0 bg-transparent shadow-none hover-lift">
                                            <CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                                    style={{ backgroundImage: `url(${product.images?.[0] || "/placeholder.jpg"})` }}
                                                />
                                                {product.isNew && (
                                                    <span className="absolute top-2 left-2 bg-foreground text-background text-xs px-2 py-1 uppercase tracking-wider">
                                                        New
                                                    </span>
                                                )}
                                                {product.stock === 0 && (
                                                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 uppercase tracking-wider">
                                                        Sold Out
                                                    </span>
                                                )}
                                            </CardContent>
                                            <CardFooter className="flex flex-col items-start p-2 sm:p-4 space-y-1">
                                                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                                                    {CATEGORY_LABELS[product.category] || product.category}
                                                </p>
                                                <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                                                    <h3 className="font-medium tracking-tight text-sm sm:text-lg line-clamp-1">{product.name}</h3>
                                                    <div className="text-left sm:text-right">
                                                        <span className="font-semibold text-sm sm:text-base">{formatPrice(product.sellingPrice)}</span>
                                                        {parseFloat(product.mrp) > parseFloat(product.sellingPrice) && (
                                                            <span className="text-[10px] sm:text-xs text-muted-foreground line-through ml-1 sm:ml-2">
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
                            <div className="text-center py-20">
                                <p className="text-muted-foreground">No products found matching your filters.</p>
                                <Button variant="link" onClick={clearFilters} className="mt-2">
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
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    )
}

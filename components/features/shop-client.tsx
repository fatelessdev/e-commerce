"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BargainDiscountStrip } from "@/components/ui/bargain-discount-strip"
import Image from "next/image"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"
import { normalizeProductImage } from "@/lib/image"
import { getDisplaySizes, productMatchesGender, useShopCatalog, type CatalogProduct } from "@/components/features/use-shop-catalog"
import { ViewportPrefetchLink } from "@/components/ui/viewport-prefetch-link"

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

type ShopRestoreState = {
    scrollY: number
    visibleCount: number
    historyIndex: number | null
    searchQuery: string
    selectedCategory: string
    selectedSize: string | null
    selectedPriceRangeLabel: string
    clickedProductId: string
}

const SHOP_SCROLL_PREFIX = "xilar-shop-scroll:"

interface ShopClientProps {
    genderFilter?: "men" | "women" | "unisex" | "all"
    title?: string
    subtitle?: string
    initialSearch?: string
    fixedCategory?: string
    initialProducts?: CatalogProduct[]
}

export function ShopClient({ genderFilter = "all", title = "All Products", subtitle, initialSearch = "", fixedCategory, initialProducts }: ShopClientProps) {
    const pathname = usePathname()
    const [searchQuery, setSearchQuery] = useState(initialSearch)
    const [selectedCategory, setSelectedCategory] = useState(fixedCategory || "All")
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0])
    const [showFilters, setShowFilters] = useState(false)
    const [visibleCount, setVisibleCount] = useState(8)
    const pendingRestoreRef = useRef<ShopRestoreState | null>(null)
    const restoredRef = useRef(false)

    useEffect(() => {
        if (initialSearch !== undefined) {
            setSearchQuery(initialSearch)
        }
    }, [initialSearch])

    const { data: products = [], isLoading: loading } = useShopCatalog(initialProducts)

    const filteredProducts = useMemo(() => {
        const effectiveSelectedCategory = fixedCategory || selectedCategory
        return products.filter((product) => {
            if (!productMatchesGender(product, genderFilter)) {
                return false
            }
            // Search
            if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }
            // Category
            if (effectiveSelectedCategory !== "All" && product.category !== effectiveSelectedCategory) {
                return false
            }
            // Size
            if (selectedSize && !getDisplaySizes(product).includes(selectedSize)) {
                return false
            }
            // Price
            const price = parseFloat(product.sellingPrice)
            if (price < selectedPriceRange.min || price > selectedPriceRange.max) {
                return false
            }
            return true
        })
    }, [fixedCategory, genderFilter, products, searchQuery, selectedCategory, selectedSize, selectedPriceRange])

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

    useEffect(() => {
        if (restoredRef.current || typeof window === "undefined") return
        restoredRef.current = true

        const applyUrlSearch = () => {
            const urlSearch = new URLSearchParams(window.location.search).get("search")
            if (urlSearch) {
                setSearchQuery(urlSearch)
                setVisibleCount(8)
            }
        }

        const raw = window.sessionStorage.getItem(`${SHOP_SCROLL_PREFIX}${pathname}`)
        if (!raw) {
            applyUrlSearch()
            return
        }

        try {
            const saved = JSON.parse(raw) as ShopRestoreState
            const currentHistoryIndex = typeof window.history.state?.idx === "number" ? window.history.state.idx : null
            const shouldRestore =
                saved.historyIndex === null ||
                currentHistoryIndex === null ||
                currentHistoryIndex <= saved.historyIndex

            if (!shouldRestore) {
                window.sessionStorage.removeItem(`${SHOP_SCROLL_PREFIX}${pathname}`)
                applyUrlSearch()
                return
            }

            pendingRestoreRef.current = saved
            const timer = window.setTimeout(() => {
                const urlSearch = new URLSearchParams(window.location.search).get("search")
                setSearchQuery(urlSearch !== null ? urlSearch : saved.searchQuery)
                setSelectedCategory(fixedCategory || saved.selectedCategory || "All")
                setSelectedSize(saved.selectedSize)
                setSelectedPriceRange(
                    PRICE_RANGES.find((range) => range.label === saved.selectedPriceRangeLabel) || PRICE_RANGES[0]
                )
                setVisibleCount(Math.max(8, saved.visibleCount))
            }, 0)
            return () => window.clearTimeout(timer)
        } catch {
            window.sessionStorage.removeItem(`${SHOP_SCROLL_PREFIX}${pathname}`)
        }
    }, [fixedCategory, pathname])

    useEffect(() => {
        const saved = pendingRestoreRef.current
        if (!saved || loading || filteredProducts.length === 0) return

        const clickedIndex = filteredProducts.findIndex((product) => product.id === saved.clickedProductId)
        const requiredVisibleCount = Math.max(saved.visibleCount, clickedIndex >= 0 ? clickedIndex + 1 : 8)

        if (visibleCount < requiredVisibleCount) {
            setVisibleCount(requiredVisibleCount)
            return
        }

        let attempts = 0
        const restore = () => {
            attempts += 1
            const maxReachableScroll = document.documentElement.scrollHeight - window.innerHeight
            if (maxReachableScroll >= saved.scrollY || attempts > 24) {
                window.scrollTo({ top: saved.scrollY, behavior: "smooth" })
                pendingRestoreRef.current = null
                return
            }
            window.requestAnimationFrame(restore)
        }

        window.requestAnimationFrame(restore)
    }, [filteredProducts, loading, visibleCount])

    const saveScrollState = (clickedProductId: string) => {
        if (typeof window === "undefined") return
        const state: ShopRestoreState = {
            scrollY: window.scrollY,
            visibleCount,
            historyIndex: typeof window.history.state?.idx === "number" ? window.history.state.idx : null,
            searchQuery,
            selectedCategory,
            selectedSize,
            selectedPriceRangeLabel: selectedPriceRange.label,
            clickedProductId,
        }
        window.sessionStorage.setItem(`${SHOP_SCROLL_PREFIX}${pathname}`, JSON.stringify(state))
    }

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedCategory(fixedCategory || "All")
        setSelectedSize(null)
        setSelectedPriceRange(PRICE_RANGES[0])
        setVisibleCount(8)
    }

    const activeFilterCount = [
        !fixedCategory && selectedCategory !== "All",
        selectedSize !== null,
        selectedPriceRange !== PRICE_RANGES[0],
    ].filter(Boolean).length
    const effectiveSelectedCategory = fixedCategory || selectedCategory

    const formatPrice = (price: string) => {
        const num = parseFloat(price)
        return `₹${num.toLocaleString("en-IN")}`
    }

    const discountPercent = (product: CatalogProduct) => {
        const mrp = parseFloat(product.mrp)
        const price = parseFloat(product.sellingPrice)
        if (!Number.isFinite(mrp) || !Number.isFinite(price) || mrp <= price) return null
        return Math.round(((mrp - price) / mrp) * 100)
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Shop</p>
                <h1 className="font-display text-4xl md:text-6xl">{title}</h1>
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
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setVisibleCount(8)
                        }}
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
                                            setVisibleCount(8)
                                        }}
                                    >
                                        {CATEGORY_LABELS[cat] || cat}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size */}
                    {effectiveSelectedCategory !== "accessory" && (
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Size</label>
                            <div className="flex flex-wrap gap-1.5">
                                {(NUMBER_SIZE_CATEGORIES.includes(effectiveSelectedCategory) ? NUMBER_SIZES : effectiveSelectedCategory === "All" ? [...DEFAULT_SIZES, ...NUMBER_SIZES] : DEFAULT_SIZES).map((size) => (
                                    <Button
                                        key={size}
                                        variant={selectedSize === size ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-none h-8 text-[10px] tracking-wide"
                                        onClick={() => {
                                            setSelectedSize(selectedSize === size ? null : size)
                                            setVisibleCount(8)
                                        }}
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
                                    onClick={() => {
                                        setSelectedPriceRange(range)
                                        setVisibleCount(8)
                                    }}
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
                                    <ViewportPrefetchLink
                                        href={`/product/${product.id}`}
                                        key={product.id}
                                        onClick={() => saveScrollState(product.id)}
                                    >
                                        <Card className="bg-transparent border-0 rounded-none hover-lift">
<CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-muted/30">
                                                {product.stock > 0 && (
                                                    <BargainDiscountStrip maxBargainDiscount={product.maxBargainDiscount} className="z-10" />
                                                )}
                                                <Image
                                                    src={normalizeProductImage(product.images?.[0])}
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
                                                <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                                                    <h3 className="min-w-0 truncate font-medium tracking-tight text-sm">{product.name}</h3>
                                                    <div className="flex flex-none flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap text-right">
                                                        <span className="font-semibold text-sm tabular-nums">{formatPrice(product.sellingPrice)}</span>
                                                        {parseFloat(product.mrp) > parseFloat(product.sellingPrice) && (
                                                            <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                                                                {formatPrice(product.mrp)}
                                                            </span>
                                                        )}
                                                        {discountPercent(product) !== null && (
                                                            <span className="flex-none bg-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-background">
                                                                {discountPercent(product)}% off
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {getDisplaySizes(product).length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                        {getDisplaySizes(product).slice(0, 5).map((size) => (
                                                            <span
                                                                key={size}
                                                                className="border border-border/70 px-2 py-1 text-[10px] uppercase leading-none text-muted-foreground"
                                                            >
                                                                {size}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    </ViewportPrefetchLink>
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

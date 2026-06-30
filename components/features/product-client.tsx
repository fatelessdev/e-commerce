"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ProductGrid } from "@/components/features/product-grid"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import {
    addWishlistItem,
    getProductWishlist,
    removeWishlistItem,
} from "@/lib/actions/wishlist"
import { Heart, Check, X, ChevronLeft, ChevronRight, Eye, Star, Timer } from "lucide-react"
import Image from "next/image"
import { normalizeProductImage } from "@/lib/image"
import { buildProductPath } from "@/lib/seo"
import type { ProductDetails } from "@/lib/product-detail"
import { ViewportPrefetchLink } from "@/components/ui/viewport-prefetch-link"
import { ProductAssistant } from "@/components/features/bargain-ai"

type Product = ProductDetails

const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo", "shorts"]

function formatPrice(value: string | number) {
    const amount = typeof value === "number" ? value : Number(value)
    return `₹${amount.toLocaleString("en-IN")}`
}

function seededNumber(seed: string) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
    }
    return hash
}

function getMockProductStats(seed: string) {
    const value = seededNumber(seed)
    return {
        rating: (4.6 + (value % 4) / 10).toFixed(1),
        reviews: 86 + (value % 58),
        viewers: 12 + (value % 9),
    }
}

function getViewerSequence(seed: string) {
    const value = seededNumber(seed)
    const anchor = 14 + (value % 8)
    return [
        anchor,
        anchor + 1 + (value % 3),
        anchor + 4 + (value % 5),
        Math.max(8, anchor - 2 - (value % 4)),
        anchor + 2,
        anchor - 1,
    ]
}

function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen bg-background pb-24 lg:pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative overflow-hidden bg-muted/30">
                    <div className="aspect-[4/5] w-full animate-pulse bg-muted" />
                </div>
                <div className="lg:min-h-[calc(100svh-8rem)] lg:sticky lg:top-20 p-8 lg:p-14 lg:pt-10 flex flex-col justify-start space-y-8">
                    <div className="space-y-5">
                        <div className="h-3 w-32 animate-pulse bg-muted" />
                        <div className="space-y-3">
                            <div className="h-10 w-4/5 animate-pulse bg-muted md:h-16" />
                            <div className="h-10 w-3/5 animate-pulse bg-muted md:h-16" />
                        </div>
                        <div className="h-5 w-48 animate-pulse bg-muted" />
                        <div className="space-y-2">
                            <div className="h-3 w-full max-w-md animate-pulse bg-muted" />
                            <div className="h-3 w-3/4 max-w-md animate-pulse bg-muted" />
                        </div>
                    </div>
                    <div className="grid gap-3 rounded-sm border border-border/70 bg-background/60 p-4">
                        <div className="h-8 w-56 animate-pulse bg-muted" />
                        <div className="h-8 w-64 animate-pulse bg-muted" />
                        <div className="h-8 w-60 animate-pulse bg-muted" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ProductClient({ id, initialProduct }: { id: string; initialProduct?: Product }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedColor, setSelectedColor] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [added, setAdded] = useState(false)
    const [wishlistPending, setWishlistPending] = useState(false)
    const [wishlistError, setWishlistError] = useState<string | null>(null)
    const [viewerCount, setViewerCount] = useState<number | null>(null)
    const { addItem } = useCart()
    const shouldReduceMotion = useReducedMotion()
    const {
        data: product,
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ["product", id],
        queryFn: async () => {
            const res = await fetch(`/api/products/${id}`)
            if (!res.ok) throw new Error("Product not found")
            return (await res.json()) as Product
        },
        initialData: initialProduct,
        enabled: initialProduct === undefined,
        staleTime: 1000 * 60 * 5,
    })
    const { data: wishlistState } = useQuery({
        queryKey: ["wishlist-product", id],
        queryFn: () => getProductWishlist(id),
        staleTime: 1000 * 30,
    })

    // Scroll to top on navigation
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [id])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSelectedSize(null)
            setSelectedColor(null)
            setSelectedImage(0)
            setViewerCount(null)
        }, 0)

        return () => window.clearTimeout(timer)
    }, [id])

    useEffect(() => {
        if (!product) return

        const sequence = getViewerSequence(`${product.slug}-${Date.now()}-${Math.random()}`)
        let index = Math.floor(Math.random() * sequence.length)
        const initialTimer = window.setTimeout(() => {
            setViewerCount(sequence[index])
        }, 0)

        const timer = window.setInterval(() => {
            index = (index + 1 + Math.floor(Math.random() * 2)) % sequence.length
            setViewerCount(sequence[index])
        }, 10000 + Math.floor(Math.random() * 5000))

        return () => {
            window.clearTimeout(initialTimer)
            window.clearInterval(timer)
        }
    }, [product])

    // Memoize variants for O(1) lookups during render loop
    const variantMap = useMemo(() => {
        const map = new Map<string, number>()
        if (!product?.variants) return map

        product.variants.forEach(v => {
            const key = `${v.size}|${v.color}`
            map.set(key, v.stock)
        })
        return map
    }, [product])

    // Helper: get stock for a specific variant (size + color combo)
    const getVariantStock = (size: string, color: string | null): number => {
        if (!product?.variants || product.variants.length === 0) {
            // Fallback to product-level stock if no variants
            return product?.stock ?? 0
        }

        const exactKey = `${size}|${color}`
        if (variantMap.has(exactKey)) return variantMap.get(exactKey)!

        return 0
    }

    // Helper: check if a size is available for any color
    const isSizeAvailable = (size: string): boolean => {
        if (!product?.variants || product.variants.length === 0) return (product?.stock ?? 0) > 0
        if (selectedColor) {
            return getVariantStock(size, selectedColor) > 0
        }
        // No color selected: size is available if ANY color has stock for this size
        if (product.colors && product.colors.length > 0) {
            return product.colors.some((c) => getVariantStock(size, c.name) > 0)
        }
        return getVariantStock(size, null) > 0
    }

    // Helper: check if a color is available for any size
    const isColorAvailable = (colorName: string): boolean => {
        if (!product?.variants || product.variants.length === 0) return (product?.stock ?? 0) > 0
        const resolvedSize = selectedSize || (product?.category === "accessory" ? "One Size" : null)
        if (resolvedSize) {
            return getVariantStock(resolvedSize, colorName) > 0
        }
        // No size selected: color is available if ANY size has stock for this color
        return (product.sizes || []).some((s) => getVariantStock(s, colorName) > 0)
    }

    // Currently selected variant stock
    const selectedVariantStock = (): number | null => {
        const resolvedSize = selectedSize || (product?.category === "accessory" ? "One Size" : null)
        if (!resolvedSize) return null
        if ((product?.colors || []).length > 0 && !selectedColor) return null
        const color = selectedColor || null
        return getVariantStock(resolvedSize, color)
    }

    const currentStock = selectedVariantStock()
    // Performance optimization: Extracting optional chaining (product?.images) to a local variable
    // prevents React Compiler dependency mismatch warnings and ensures proper memoization.
    const productImages = product?.images;
    const images = useMemo(() => {
        const imgs = productImages || []
        return imgs.length > 0
            ? imgs.map((image) => normalizeProductImage(image))
            : [normalizeProductImage()]
    }, [productImages])

    useEffect(() => {
        if (!product || images.length <= 1) return

        const preloadGalleryImages = () => {
            images.slice(1).forEach((src) => {
                const image = new window.Image()
                image.src = src
            })
        }

        const idle = window.requestIdleCallback
        if (idle) {
            const idleId = idle(preloadGalleryImages, { timeout: 1500 })
            return () => window.cancelIdleCallback?.(idleId)
        }

        const timer = window.setTimeout(preloadGalleryImages, 200)
        return () => window.clearTimeout(timer)
    }, [images, product])

    if (loading && !product) {
        return <ProductDetailSkeleton />
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Product Not Found</h1>
                    <p className="text-muted-foreground">{error instanceof Error ? error.message : "This product doesn't exist."}</p>
                    <Button asChild variant="outline" className="rounded-none">
                        <Link href="/shop">Back to Shop</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const isAccessory = product.category === "accessory"
    const effectiveSelectedSize = selectedSize || (isAccessory ? "One Size" : null)

    const price = parseFloat(product.sellingPrice)
    const mrp = parseFloat(product.mrp)
    const hasDiscount = mrp > price
    const displayPrice = `₹${price.toLocaleString("en-IN")}`
    const displayMrp = `₹${mrp.toLocaleString("en-IN")}`
    const productSizes = product.sizes || []
    const productAssistantContext = {
        id: product.id,
        name: product.name,
        mrp,
        sellingPrice: price,
        category: product.category,
        fabric: product.fabric ?? undefined,
        features: product.features ?? undefined,
        sizes: product.sizes ?? undefined,
        description: product.description ?? undefined,
    }
    const productColors = product.colors || []
    const productFeatures = product.features || []

    const inWishlist = Boolean(wishlistState?.saved)
    const hasRelatedContent = (product.relatedCombos?.length || 0) > 0 || (product.relatedProducts?.length || 0) > 0
    const shouldUseComboRelated = hasRelatedContent
    const mockStats = getMockProductStats(product.slug || product.id)
    const realRemainingStock = currentStock ?? product.stock
    const middleImageIndex = Math.floor(images.length / 2)
    const spotlightAttributes = [
        product.fabric ? `Fabric: ${product.fabric}` : null,
        product.gsm ? `${product.gsm} GSM` : null,
        ...productFeatures.slice(0, 2),
    ].filter(Boolean) as string[]
    const shouldShowSpotlight = selectedImage === middleImageIndex && spotlightAttributes.length > 0
    const relatedDiscountPercent = (related: { mrp: string; sellingPrice: string }) => {
        const relatedMrp = Number(related.mrp)
        const relatedPrice = Number(related.sellingPrice)
        if (!Number.isFinite(relatedMrp) || !Number.isFinite(relatedPrice) || relatedMrp <= relatedPrice) return null
        return Math.round(((relatedMrp - relatedPrice) / relatedMrp) * 100)
    }
    const relatedSizeChips = (sizes?: string[]) => {
        if (!sizes || sizes.length === 0) return null
        return (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {sizes.slice(0, 5).map((size) => (
                    <span key={size} className="border border-border/70 px-2 py-1 text-[10px] uppercase leading-none text-muted-foreground">
                        {size}
                    </span>
                ))}
            </div>
        )
    }

    const handleAddToCart = () => {
        if (!effectiveSelectedSize) return
        if (!isAccessory && productColors.length > 0 && !selectedColor) return
        const stock = currentStock
        if (stock !== null && stock <= 0) return
        if (product.stock === 0) return
        
        addItem({
            id: product.id,
            name: product.name,
            price: price,
            displayPrice: displayPrice,
            image: images[0],
            size: effectiveSelectedSize,
            color: selectedColor || undefined,
        })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    const handleWishlist = async () => {
        if (wishlistPending) return

        if (wishlistState && !wishlistState.authenticated) {
            router.push(`/account?redirect=${encodeURIComponent(buildProductPath(product.slug))}`)
            return
        }

        setWishlistPending(true)
        setWishlistError(null)
        const result = inWishlist
            ? await removeWishlistItem(product.id)
            : await addWishlistItem(product.id)

        if (!result.success) {
            setWishlistError(result.error)
            setWishlistPending(false)
            return
        }

        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["wishlist-product", product.id] }),
            queryClient.invalidateQueries({ queryKey: ["wishlist-nav"] }),
        ])
        setWishlistPending(false)
    }

    return (
        <>
        <div className="min-h-screen bg-background pb-24 lg:pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Gallery Section — Horizontal Slider */}
                <div className="relative bg-white/5 overflow-hidden group">
                    <div className="aspect-[4/5] w-full relative">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.div
                                key={selectedImage}
                                className="absolute inset-0 w-full h-full object-cover object-center"
                                initial={{ opacity: 0.4 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0.4 }}
                                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                style={{ willChange: "opacity" }}
                            >
                                <Image
                                    src={images[selectedImage]}
                                    alt={`${product.name} — image ${selectedImage + 1}`}
                                    fill
                                    priority={selectedImage === 0}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover object-center"
                                    draggable={false}
                                />
                            </motion.div>
                        </AnimatePresence>

                        <AnimatePresence>
                            {shouldShowSpotlight && (
                                <motion.div
                                    key="style-spotlight"
                                    className="pointer-events-none absolute left-6 top-1/2 z-20 max-w-[70%] -translate-y-1/2 text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] md:left-8"
                                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.32, 0.72, 0, 1] }}
                                    style={{ willChange: "opacity" }}
                                >
                                    <motion.p
                                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -22, filter: "blur(6px)" }}
                                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                        transition={{ duration: shouldReduceMotion ? 0.01 : 0.58, ease: [0.32, 0.72, 0, 1] }}
                                        style={{ willChange: "transform, opacity, filter" }}
                                        className="font-display text-4xl leading-none md:text-5xl"
                                    >
                                        Style Spotlight
                                    </motion.p>
                                    <div className="mt-7 flex flex-col gap-x-8 gap-y-4">
                                        {spotlightAttributes.map((attribute, index) => (
                                            <motion.p
                                                key={attribute}
                                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, filter: "blur(5px)" }}
                                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                                transition={{
                                                    duration: shouldReduceMotion ? 0.01 : 0.52,
                                                    delay: shouldReduceMotion ? 0 : 0.16 + index * 0.12,
                                                    ease: [0.32, 0.72, 0, 1],
                                                }}
                                                className="text-sm font-bold md:text-base"
                                            >
                                                {attribute}
                                            </motion.p>
                                            
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Swipe overlay — invisible drag target */}
                        {images.length > 1 && (
                            <motion.div
                                className="absolute inset-0 z-10 touch-pan-y"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.15}
                                onDragEnd={(_e, info) => {
                                    const swipe = info.offset.x
                                    const velocity = info.velocity.x
                                    if (swipe < -40 || velocity < -300) {
                                        setSelectedImage((prev) => Math.min(prev + 1, images.length - 1))
                                    } else if (swipe > 40 || velocity > 300) {
                                        setSelectedImage((prev) => Math.max(prev - 1, 0))
                                    }
                                }}
                            />
                        )}

                        {/* Chevron navigation — desktop hover */}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 disabled:opacity-0"
                                    onClick={() => setSelectedImage((prev) => Math.max(prev - 1, 0))}
                                    disabled={selectedImage === 0}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 disabled:opacity-0"
                                    onClick={() => setSelectedImage((prev) => Math.min(prev + 1, images.length - 1))}
                                    disabled={selectedImage === images.length - 1}
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Dot indicators */}
                    {images.length > 1 && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                        selectedImage === i
                                            ? "w-6 h-1.5 bg-red-accent"
                                            : "w-1.5 h-1.5 bg-neutral-400 hover:bg-neutral-300"
                                    }`}
                                    onClick={() => setSelectedImage(i)}
                                    aria-label={`Go to image ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info Section */}
                <div className="lg:min-h-[calc(100svh-8rem)] lg:sticky lg:top-20 p-8 lg:p-14 lg:pt-10 flex flex-col justify-start space-y-8">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                {isAccessory ? product.category : `${product.category} · ${product.gender}`}
                            </p>
                            <h1 className="font-display text-4xl leading-[0.92] md:text-6xl lg:text-7xl">{product.name}</h1>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <p className="text-xl font-semibold tabular-nums">{displayPrice}</p>
                            {hasDiscount && (
                                <>
                                    <p className="text-base text-muted-foreground line-through tabular-nums">{displayMrp}</p>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium tabular-nums">
                                        {Math.round(((mrp - price) / mrp) * 100)}% off
                                    </span>
                                </>
                            )}
                        </div>
                        {product.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{product.description}</p>
                        )}
                        {(product.fabric || product.gsm) && (
                            <div className="space-y-1 text-xs text-muted-foreground">
                                {product.fabric && (
                                    <p>
                                        <span className="font-medium text-foreground">Fabric:</span> {product.fabric}
                                    </p>
                                )}
                                {product.gsm && (
                                    <p>
                                        <span className="font-medium text-foreground">GSM:</span> {product.gsm}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 rounded-sm border border-border/70 bg-background/60 p-4 text-sm shadow-sm">
                        <div className="flex items-center gap-3 font-semibold">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7b464]/40 bg-[#d7b464]/10 text-[#c99b35]">
                                <Star className="h-4 w-4 fill-current" />
                            </span>
                            <span>{mockStats.rating}/5 <span className="text-muted-foreground">({mockStats.reviews}+ reviews)</span></span>
                        </div>
                        <div className="flex items-center gap-3 font-semibold">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                <Eye className="h-4 w-4" />
                            </span>
                            <span>{viewerCount ?? mockStats.viewers} people viewing right now</span>
                        </div>
                        <div className="flex items-center gap-3 font-semibold">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-300">
                                <Timer className="h-4 w-4" />
                            </span>
                            {realRemainingStock > 0 ? (
                                <span>Only {realRemainingStock} left in stock <span className="text-muted-foreground">— selling fast</span></span>
                            ) : (
                                <span className="text-destructive">Out of stock</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Size Selection */}
                        {!isAccessory && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center justify-between">
                                    <span>Select size</span>
                                    {!selectedSize && <span className="text-destructive font-normal normal-case text-[10px]">Required</span>}
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {(NUMBER_SIZE_CATEGORIES.includes(product.category)
                                        ? productSizes.filter((s) => /^\d+$/.test(s))
                                        : productSizes
                                    ).map((size) => {
                                        const available = isSizeAvailable(size)
                                        return (
                                            <Button
                                                key={size}
                                                variant={selectedSize === size ? "default" : "outline"}
                                                className={`w-12 h-12 rounded-none border-input transition-all duration-300 relative text-xs disabled:cursor-not-allowed ${
                                                    !available
                                                        ? "opacity-30 cursor-not-allowed line-through"
                                                        : "hover:border-foreground"
                                                }`}
                                                onClick={() => {
                                                    if (available) setSelectedSize(size)
                                                }}
                                                disabled={!available}
                                                title={available ? size : `${size} — Out of stock`}
                                            >
                                                {size}
                                                {!available && (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <span className="block w-[1px] h-full bg-muted-foreground/60 rotate-45 absolute" />
                                                    </span>
                                                )}
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Color Selection */}
                        {productColors.length > 0 && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center justify-between">
                                    <span>Select color</span>
                                    {selectedColor && <span className="text-muted-foreground font-normal normal-case text-[10px]">{selectedColor}</span>}
                                </label>
                                <div className="flex gap-3 flex-wrap">
                                    {productColors.map((color) => {
                                        const available = isColorAvailable(color.name)
                                        return (
                                            <button
                                                key={color.name}
                                                type="button"
                                                className={`w-9 h-9 rounded-full border-2 transition-all duration-300 relative ${
                                                    selectedColor === color.name 
                                                        ? "ring-2 ring-offset-2 ring-foreground ring-offset-background border-foreground" 
                                                        : available
                                                            ? "border-border hover:border-foreground"
                                                            : "border-border opacity-25 cursor-not-allowed"
                                                }`}
                                                style={{ backgroundColor: color.hex }}
                                                onClick={() => {
                                                    if (available) setSelectedColor(color.name)
                                                }}
                                                disabled={!available}
                                                title={available ? color.name : `${color.name} — Out of stock`}
                                                aria-label={
                                                    available
                                                        ? `${selectedColor === color.name ? "Selected" : "Select"} ${color.name} color`
                                                        : `${color.name} color unavailable`
                                                }
                                            >
                                                {!available && (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <X className="h-4 w-4 text-white drop-shadow-md" />
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stock indicator */}
                        {currentStock !== null && currentStock <= 5 && currentStock > 0 && (
                            <p className="text-xs text-orange-500 font-medium">Only {currentStock} left for this variant</p>
                        )}
                        {currentStock !== null && currentStock === 0 && (
                            <p className="text-xs text-red-500 font-medium">Out of stock for selected variant</p>
                        )}
                        {currentStock === null && product.stock === 0 && (
                            <p className="text-xs text-red-500 font-medium">Out of stock</p>
                        )}
                        {currentStock === null && product.stock > 0 && !isAccessory && (
                            <p className="text-xs text-muted-foreground">Select a size to check availability</p>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex flex-col gap-3">
                            <div className="flex gap-3">
                                <Button
                                    size="lg"
                                    className="flex-1 h-13 rounded-none text-xs uppercase tracking-[0.2em] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={handleAddToCart}
                                    disabled={!effectiveSelectedSize || (!isAccessory && productColors.length > 0 && !selectedColor) || product.stock === 0 || (currentStock !== null && currentStock === 0)}
                                >
                                    {product.stock === 0 ? (
                                        "Out of stock"
                                    ) : currentStock !== null && currentStock === 0 ? (
                                        "Out of stock"
                                    ) : added ? (
                                        <>
                                            <Check className="h-4 w-4 mr-2" /> Added
                                        </>
                                    ) : (
                                        "Add to cart"
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-13 w-13 rounded-none"
                                    onClick={handleWishlist}
                                    disabled={wishlistPending}
                                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
                                </Button>
                            </div>
                            {wishlistError && (
                                <p className="text-[11px] leading-relaxed text-destructive">{wishlistError}</p>
                            )}
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.15em]">Free shipping on orders above ₹999</p>
                        </div>

                        {/* Features */}
                        {productFeatures.length > 0 && (
                            <div className="pt-6 border-t border-border/60 space-y-3">
                                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em]">Features</h4>
                                <ul className="space-y-1.5">
                                    {productFeatures.map((feature, i) => (
                                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                            <span className="text-red-accent mt-0.5">·</span> {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products */}
            <div className="border-t border-border/60 mt-24 px-6 md:px-12 lg:px-16">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6 mt-12">You may also like</h2>
                {shouldUseComboRelated ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                        {/* Render combos first */}
                        {(product.relatedCombos || []).map((combo) => (
                            <ViewportPrefetchLink key={combo.id} href={`/combo/${combo.id}`} className="group flex-shrink-0 w-[200px] sm:w-[240px] snap-start">
                                <div className="space-y-3">
                                    <div className="relative aspect-[3/4] overflow-hidden bg-muted/30 grid grid-cols-2 gap-px">
                                        <div className="relative">
                                            <Image
                                                src={normalizeProductImage(combo.productA.images?.[0])}
                                                alt={combo.productA.name}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 20vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Image
                                                src={normalizeProductImage(combo.productB.images?.[0])}
                                                alt={combo.productB.name}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 20vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium line-clamp-2 uppercase">
                                            {combo.productA.name}
                                            <br />+ {combo.productB.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-semibold tabular-nums">
                                                {formatPrice(Number(combo.productA.sellingPrice) + Number(combo.productB.sellingPrice))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </ViewportPrefetchLink>
                        ))}
                        {/* Then render related products */}
                        {(product.relatedProducts || []).map((related) => (
                            <ViewportPrefetchLink key={related.id} href={buildProductPath(related.slug)} className={`group flex-shrink-0 w-[200px] sm:w-[240px] snap-start ${related.stock <= 0 ? "cursor-not-allowed" : ""}`}>
                                <div className="space-y-3">
                                    <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
                                        <Image
                                            src={normalizeProductImage(related.images?.[0])}
                                            alt={related.name}
                                            fill
                                            sizes="240px"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium line-clamp-1 uppercase">{related.name}</p>
                                        <div className="flex max-w-full flex-nowrap items-center gap-1.5 whitespace-nowrap">
                                            <p className="text-xs font-semibold tabular-nums">₹{Number(related.sellingPrice).toLocaleString("en-IN")}</p>
                                            {Number(related.mrp) > Number(related.sellingPrice) && (
                                                <p className="truncate text-[10px] text-muted-foreground line-through tabular-nums">₹{Number(related.mrp).toLocaleString("en-IN")}</p>
                                            )}
                                            {relatedDiscountPercent(related) !== null && (
                                                <span className="flex-none bg-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-background">
                                                    {relatedDiscountPercent(related)}% off
                                                </span>
                                            )}
                                        </div>
                                        {relatedSizeChips(related.availableSizes || related.sizes || undefined)}
                                    </div>
                                </div>
                            </ViewportPrefetchLink>
                        ))}
                    </div>
                ) : (
                    <ProductGrid title="" layout="scroll" />
                )}
            </div>
        </div>
        <ProductAssistant key={product.id} productContext={productAssistantContext} />
        </>
    )
}

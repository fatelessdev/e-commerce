"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ProductGrid } from "@/components/features/product-grid"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { Heart, Check, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react"

interface ProductVariant {
    id: string;
    productId: string;
    size: string;
    color: string | null;
    stock: number;
}

interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    mrp: string
    sellingPrice: string
    images: string[]
    sizes: string[]
    colors: { name: string; hex: string; images?: string[] }[]
    fabric: string | null
    gsm: number | null
    features: string[]
    category: string
    gender: string
    stock: number
    variants?: ProductVariant[]
}

const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo", "shorts"]

export function ProductClient({ id }: { id: string }) {
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedColor, setSelectedColor] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [added, setAdded] = useState(false)
    const { addItem } = useCart()
    const { isInWishlist, toggleItem } = useWishlist()

    // Scroll to top on navigation
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [id])

    useEffect(() => {
        async function fetchProduct() {
            try {
                setLoading(true)
                setSelectedSize(null)
                setSelectedColor(null)
                setSelectedImage(0)
                const res = await fetch(`/api/products/${id}`)
                if (!res.ok) {
                    throw new Error("Product not found")
                }
                const data = await res.json()
                setProduct(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load product")
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    // Helper: get stock for a specific variant (size + color combo)
    const getVariantStock = (size: string, color: string | null): number => {
        if (!product?.variants || product.variants.length === 0) {
            // Fallback to product-level stock if no variants
            return product?.stock ?? 0
        }
        const variant = product.variants.find(
            (v) => v.size === size && (v.color === color || (v.color === null && color === null))
        )
        return variant?.stock ?? 0
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
        if (selectedSize) {
            return getVariantStock(selectedSize, colorName) > 0
        }
        // No size selected: color is available if ANY size has stock for this color
        return product.sizes.some((s) => getVariantStock(s, colorName) > 0)
    }

    // Currently selected variant stock
    const selectedVariantStock = (): number | null => {
        if (!selectedSize) return null
        if (product?.colors?.length && product.colors.length > 0 && !selectedColor) return null
        const color = selectedColor || null
        return getVariantStock(selectedSize, color)
    }

    const currentStock = selectedVariantStock()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Product Not Found</h1>
                    <p className="text-muted-foreground">{error || "This product doesn't exist."}</p>
                    <Button asChild variant="outline" className="rounded-none">
                        <a href="/shop">Back to Shop</a>
                    </Button>
                </div>
            </div>
        )
    }

    const price = parseFloat(product.sellingPrice)
    const mrp = parseFloat(product.mrp)
    const hasDiscount = mrp > price
    const displayPrice = `₹${price.toLocaleString("en-IN")}`
    const displayMrp = `₹${mrp.toLocaleString("en-IN")}`
    const images = product.images.length > 0 ? product.images : ["/clothes/placeholder.jpeg"]

    const inWishlist = isInWishlist(product.id)

    const handleAddToCart = () => {
        if (!selectedSize) return
        if (product.colors.length > 0 && !selectedColor) return
        const stock = currentStock
        if (stock !== null && stock <= 0) return
        if (product.stock === 0) return
        
        addItem({
            id: product.id,
            name: product.name,
            price: price,
            displayPrice: displayPrice,
            image: images[0],
            size: selectedSize,
            color: selectedColor || undefined,
        })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    const handleWishlist = () => {
        toggleItem({
            id: product.id,
            name: product.name,
            price: price,
            displayPrice: displayPrice,
            image: images[0],
        })
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Gallery Section — Horizontal Slider */}
                <div className="relative bg-white/5 overflow-hidden group">
                    <div className="aspect-[4/5] w-full relative">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.img
                                key={selectedImage}
                                src={images[selectedImage]}
                                alt={`${product.name} — image ${selectedImage + 1}`}
                                className="absolute inset-0 w-full h-full object-cover object-center"
                                initial={{ opacity: 0.4 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0.4 }}
                                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                draggable={false}
                            />
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
                <div className="lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 p-8 lg:p-14 flex flex-col justify-center space-y-8">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">{product.category} · {product.gender}</p>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.9]">{product.name}</h1>
                        </div>
                        <div className="flex items-baseline gap-3">
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
                        {product.fabric && (
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Fabric:</span> {product.fabric} {product.gsm && `(${product.gsm} GSM)`}
                            </p>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Size Selection */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center justify-between">
                                <span>Select size</span>
                                {!selectedSize && <span className="text-destructive font-normal normal-case text-[10px]">Required</span>}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {(NUMBER_SIZE_CATEGORIES.includes(product.category)
                                    ? product.sizes.filter((s) => /^\d+$/.test(s))
                                    : product.sizes
                                ).map((size) => {
                                    const available = isSizeAvailable(size)
                                    return (
                                        <Button
                                            key={size}
                                            variant={selectedSize === size ? "default" : "outline"}
                                            className={`w-12 h-12 rounded-none border-input transition-all duration-300 relative text-xs ${
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

                        {/* Color Selection */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center justify-between">
                                    <span>Select color</span>
                                    {selectedColor && <span className="text-muted-foreground font-normal normal-case text-[10px]">{selectedColor}</span>}
                                </label>
                                <div className="flex gap-3 flex-wrap">
                                    {product.colors.map((color) => {
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
                        {currentStock === null && product.stock > 0 && (
                            <p className="text-xs text-muted-foreground">Select a size to check availability</p>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex flex-col gap-3">
                            <div className="flex gap-3">
                                <Button
                                    size="lg"
                                    className="flex-1 h-13 rounded-none text-xs uppercase tracking-[0.2em] font-semibold disabled:opacity-40"
                                    onClick={handleAddToCart}
                                    disabled={!selectedSize || (product.colors.length > 0 && !selectedColor) || product.stock === 0 || (currentStock !== null && currentStock === 0)}
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
                                >
                                    <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
                                </Button>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.15em]">Free shipping on orders above ₹999</p>
                        </div>

                        {/* Features */}
                        {product.features.length > 0 && (
                            <div className="pt-6 border-t border-border/60 space-y-3">
                                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em]">Features</h4>
                                <ul className="space-y-1.5">
                                    {product.features.map((feature, i) => (
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
            <div className="border-t border-border/60 mt-24">
                <ProductGrid title="You may also like" />
            </div>
        </div>
    )
}

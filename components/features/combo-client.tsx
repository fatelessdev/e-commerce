"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { normalizeProductImage } from "@/lib/image"

interface ProductVariant {
  id: string
  productId: string
  size: string
  color: string | null
  stock: number
}

interface ComboProduct {
  id: string
  name: string
  sellingPrice: string
  mrp: string
  images: string[]
  sizes: string[]
  colors: { name: string; hex: string }[]
  variants: ProductVariant[]
  category: string
}

interface Combo {
  id: string
  discountAmount: string
  productA: ComboProduct
  productB: ComboProduct
}

const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo", "shorts"]

function sizeOptions(product: ComboProduct) {
  if (NUMBER_SIZE_CATEGORIES.includes(product.category)) {
    return product.sizes.filter((size) => /^\d+$/.test(size))
  }
  return product.sizes
}

function formatPrice(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value)
  return `₹${amount.toLocaleString("en-IN")}`
}

function getVariantStock(variantMap: Map<string, number>, size: string, color: string | null) {
  return variantMap.get(`${size}|${color}`) ?? 0
}

function isColorAvailable(variantMap: Map<string, number>, colorName: string, selectedSize: string | null) {
  if (!selectedSize) return false
  return getVariantStock(variantMap, selectedSize, colorName) > 0
}

export function ComboClient({ id, initialCombo }: { id: string; initialCombo?: Combo }) {
  const [selectedImageA, setSelectedImageA] = useState(0)
  const [selectedImageB, setSelectedImageB] = useState(0)
  const [selectedSizeA, setSelectedSizeA] = useState<string | null>(null)
  const [selectedColorA, setSelectedColorA] = useState<string | null>(null)
  const [selectedSizeB, setSelectedSizeB] = useState<string | null>(null)
  const [selectedColorB, setSelectedColorB] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const { addCombo } = useCart()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const {
    data: combo,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["combo", id],
    queryFn: async () => {
      const res = await fetch(`/api/combo/${id}`)
      if (!res.ok) throw new Error("Combo not found")
      return (await res.json()) as Combo
    },
    initialData: initialCombo,
    enabled: initialCombo === undefined,
    staleTime: 1000 * 60 * 5,
  })


  const variantsA = combo?.productA.variants
  // ⚡ Bolt: Memoize variants to a Map indexed by size|color for O(1) lookups instead of O(N) array traversals during render
  const variantMapA = useMemo(() => {
    const map = new Map<string, number>()
    if (!variantsA) return map
    variantsA.forEach(v => map.set(`${v.size}|${v.color}`, v.stock))
    return map
  }, [variantsA])

  const variantsB = combo?.productB.variants
  // ⚡ Bolt: Memoize variants to a Map indexed by size|color for O(1) lookups instead of O(N) array traversals during render
  const variantMapB = useMemo(() => {
    const map = new Map<string, number>()
    if (!variantsB) return map
    variantsB.forEach(v => map.set(`${v.size}|${v.color}`, v.stock))
    return map
  }, [variantsB])



  const requiredColorA = combo?.productA.colors.length ? true : false
  const requiredColorB = combo?.productB.colors.length ? true : false

  const selectedStockA = selectedSizeA ? getVariantStock(variantMapA, selectedSizeA, requiredColorA ? selectedColorA : null) : null
  const selectedStockB = selectedSizeB ? getVariantStock(variantMapB, selectedSizeB, requiredColorB ? selectedColorB : null) : null

  const canAdd = Boolean(
    combo &&
      selectedSizeA &&
      selectedSizeB &&
      (!requiredColorA || selectedColorA) &&
      (!requiredColorB || selectedColorB) &&
      selectedStockA &&
      selectedStockA > 0 &&
      selectedStockB &&
      selectedStockB > 0
  )

  const handleAddCombo = () => {
    if (!combo || !selectedSizeA || !selectedSizeB) return

    const maxDiscountAmount = Number(combo.discountAmount)

    addCombo({
      comboId: combo.id,
      comboName: `${combo.productA.name} + ${combo.productB.name}`,
      maxDiscountAmount,
      items: [
        {
          id: combo.productA.id,
          name: combo.productA.name,
          price: Number(combo.productA.sellingPrice),
          displayPrice: formatPrice(combo.productA.sellingPrice),
          image: normalizeProductImage(combo.productA.images?.[0]),
          size: selectedSizeA,
          color: selectedColorA || undefined,
        },
        {
          id: combo.productB.id,
          name: combo.productB.name,
          price: Number(combo.productB.sellingPrice),
          displayPrice: formatPrice(combo.productB.sellingPrice),
          image: normalizeProductImage(combo.productB.images?.[0]),
          size: selectedSizeB,
          color: selectedColorB || undefined,
        },
      ],
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="aspect-[4/5] animate-pulse bg-muted" />
          <div className="aspect-[4/5] animate-pulse bg-muted/70" />
        </div>
        <div className="border-t border-border/60 px-6 md:px-12 py-14 md:py-20">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-4">
              <div className="h-3 w-28 animate-pulse bg-muted" />
              <div className="h-7 w-3/4 animate-pulse bg-muted" />
              <div className="h-5 w-32 animate-pulse bg-muted" />
            </div>
            <div className="space-y-4">
              <div className="h-3 w-28 animate-pulse bg-muted" />
              <div className="h-7 w-3/4 animate-pulse bg-muted" />
              <div className="h-5 w-32 animate-pulse bg-muted" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !combo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Combo Not Found</h1>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : "This combo doesn't exist."}</p>
          <Button asChild variant="outline" className="rounded-none">
            <Link href="/shop/men">Back to Shop</Link>
          </Button>
        </div>
      </div>
    )
  }

  const priceA = parseFloat(combo.productA.sellingPrice)
  const priceB = parseFloat(combo.productB.sellingPrice)
  const totalPrice = priceA + priceB
  const maxDiscount = Number(combo.discountAmount)

  const imagesA = combo.productA.images.map((img) => normalizeProductImage(img))
  const imagesB = combo.productB.images.map((img) => normalizeProductImage(img))

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      {/* <div className="border-b border-border/60 px-6 md:px-12 py-14 md:py-20">
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Bundle Deal</p>
          <h1 className="font-display text-4xl leading-[0.96] md:text-6xl lg:text-7xl">
            {combo.productA.name}
            <br />
            <span className="text-muted-foreground">+</span>
            <br />
            {combo.productB.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
            Choose sizes and colors for both items. Get up to {formatPrice(maxDiscount)} in bargaining power on checkout.
          </p>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Product A Gallery */}
        <div className="relative bg-white/5 overflow-hidden group border-r border-border/60">
          <div className="aspect-[4/5] w-full relative">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={selectedImageA}
                className="absolute inset-0 w-full h-full object-cover object-center"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                style={{ willChange: "opacity" }}
              >
                <Image
                  src={imagesA[selectedImageA]}
                  alt={`${combo.productA.name} — image ${selectedImageA + 1}`}
                  fill
                  priority={selectedImageA === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Swipe overlay */}
            {imagesA.length > 1 && (
              <motion.div
                className="absolute inset-0 z-10 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_e, info) => {
                  const swipe = info.offset.x
                  const velocity = info.velocity.x
                  if (swipe < -40 || velocity < -300) {
                    setSelectedImageA((prev) => Math.min(prev + 1, imagesA.length - 1))
                  } else if (swipe > 40 || velocity > 300) {
                    setSelectedImageA((prev) => Math.max(prev - 1, 0))
                  }
                }}
              />
            )}

            {/* Chevron navigation */}
            {imagesA.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 disabled:opacity-0"
                  onClick={() => setSelectedImageA((prev) => Math.max(prev - 1, 0))}
                  disabled={selectedImageA === 0}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 disabled:opacity-0"
                  onClick={() => setSelectedImageA((prev) => Math.min(prev + 1, imagesA.length - 1))}
                  disabled={selectedImageA === imagesA.length - 1}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {imagesA.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {imagesA.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      selectedImageA === i ? "w-6 h-1.5 bg-red-accent" : "w-1.5 h-1.5 bg-neutral-400 hover:bg-neutral-300"
                    }`}
                    onClick={() => setSelectedImageA(i)}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product B Gallery */}
        <div className="relative bg-white/5 overflow-hidden group">
          <div className="aspect-[4/5] w-full relative">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={selectedImageB}
                className="absolute inset-0 w-full h-full object-cover object-center"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                style={{ willChange: "opacity" }}
              >
                <Image
                  src={imagesB[selectedImageB]}
                  alt={`${combo.productB.name} — image ${selectedImageB + 1}`}
                  fill
                  priority={selectedImageB === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Swipe overlay */}
            {imagesB.length > 1 && (
              <motion.div
                className="absolute inset-0 z-10 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_e, info) => {
                  const swipe = info.offset.x
                  const velocity = info.velocity.x
                  if (swipe < -40 || velocity < -300) {
                    setSelectedImageB((prev) => Math.min(prev + 1, imagesB.length - 1))
                  } else if (swipe > 40 || velocity > 300) {
                    setSelectedImageB((prev) => Math.max(prev - 1, 0))
                  }
                }}
              />
            )}

            {/* Chevron navigation */}
            {imagesB.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 disabled:opacity-0"
                  onClick={() => setSelectedImageB((prev) => Math.max(prev - 1, 0))}
                  disabled={selectedImageB === 0}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 disabled:opacity-0"
                  onClick={() => setSelectedImageB((prev) => Math.min(prev + 1, imagesB.length - 1))}
                  disabled={selectedImageB === imagesB.length - 1}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {imagesB.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {imagesB.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      selectedImageB === i ? "w-6 h-1.5 bg-red-accent" : "w-1.5 h-1.5 bg-neutral-400 hover:bg-neutral-300"
                    }`}
                    onClick={() => setSelectedImageB(i)}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection & CTA Section */}
      <div className="border-t border-border/60 px-6 md:px-12 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product A Selection */}
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.15em] font-medium text-muted-foreground">Product A</p>
                <h2 className="font-display text-3xl leading-tight md:text-4xl">{combo.productA.name}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold tabular-nums">{formatPrice(combo.productA.sellingPrice)}</p>
                  {Number(combo.productA.mrp) > Number(combo.productA.sellingPrice) && (
                    <p className="text-sm text-muted-foreground line-through tabular-nums">
                      {formatPrice(combo.productA.mrp)}
                    </p>
                  )}
                </div>
              </div>

              {/* Size Selection A */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions(combo.productA).map((size) => (
                    <Button
                      key={size}
                      type="button"
                      size="sm"
                      variant={selectedSizeA === size ? "default" : "outline"}
                      className="rounded-none text-[10px]"
                      onClick={() => setSelectedSizeA(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Selection A */}
              {combo.productA.colors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {combo.productA.colors.map((color) => {
                      const available = isColorAvailable(variantMapA, color.name, selectedSizeA)
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            if (available) setSelectedColorA(color.name)
                          }}
                          disabled={!available}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selectedColorA === color.name ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                          } ${available ? "cursor-pointer border-border" : "opacity-30 cursor-not-allowed border-border/40"}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Product B Selection */}
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.15em] font-medium text-muted-foreground">Product B</p>
                <h2 className="font-display text-3xl leading-tight md:text-4xl">{combo.productB.name}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold tabular-nums">{formatPrice(combo.productB.sellingPrice)}</p>
                  {Number(combo.productB.mrp) > Number(combo.productB.sellingPrice) && (
                    <p className="text-sm text-muted-foreground line-through tabular-nums">
                      {formatPrice(combo.productB.mrp)}
                    </p>
                  )}
                </div>
              </div>

              {/* Size Selection B */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions(combo.productB).map((size) => (
                    <Button
                      key={size}
                      type="button"
                      size="sm"
                      variant={selectedSizeB === size ? "default" : "outline"}
                      className="rounded-none text-[10px]"
                      onClick={() => setSelectedSizeB(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Selection B */}
              {combo.productB.colors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {combo.productB.colors.map((color) => {
                      const available = isColorAvailable(variantMapB, color.name, selectedSizeB)
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            if (available) setSelectedColorB(color.name)
                          }}
                          disabled={!available}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selectedColorB === color.name ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                          } ${available ? "cursor-pointer border-border" : "opacity-30 cursor-not-allowed border-border/40"}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Combo Summary & CTA */}
          <div className="mt-16 space-y-6 border-t border-border/60 pt-14">
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Combo Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{combo.productA.name}</span>
                  <span className="font-semibold">{formatPrice(combo.productA.sellingPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{combo.productB.name}</span>
                  <span className="font-semibold">{formatPrice(combo.productB.sellingPrice)}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex items-center justify-between font-bold text-base">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            {maxDiscount > 0 && (
              <div className="p-4 bg-red-accent/5 border border-red-accent/20 rounded">
                <p className="text-[10px] uppercase tracking-[0.15em] text-red-accent font-semibold">
                  Bargain cap: {formatPrice(maxDiscount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Negotiate further on checkout</p>
              </div>
            )}

            <Button
              className="w-full rounded-none uppercase tracking-[0.15em] text-[10px] h-11 md:h-12"
              disabled={!canAdd}
              onClick={handleAddCombo}
              size="lg"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Added to Cart
                </>
              ) : (
                "Add Combo to Cart"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="border-t border-border/60 px-6 md:px-12 py-8 text-center">
        <Link href="/shop/men" className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
          ← Back to shop
        </Link>
      </div>
    </div>
  )
}

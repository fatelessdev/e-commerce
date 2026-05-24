"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { normalizeProductImage } from "@/lib/image"
import { useQuery } from "@tanstack/react-query"

interface ReelProduct {
    id: string
    name: string
    sellingPrice: string
    mrp: string
    images: string[]
}

function formatPrice(price: string) {
    return `₹${Number(price).toLocaleString("en-IN")}`
}

export function ShopTheReels() {
    const [audibleProductId, setAudibleProductId] = useState<string | null>(null)
    const scrollerRef = useRef<HTMLDivElement>(null)
    const videoRefs = useRef(new Map<string, HTMLVideoElement>())

    const { data: products = [] } = useQuery({
        queryKey: ["shop-the-reels"],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: "4", isFeatured: "true" })
            const res = await fetch(`/api/products?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch reels products")
            const data = await res.json()
            return (data.products || []) as ReelProduct[]
        },
        staleTime: 1000 * 60 * 5,
    })

    const scrollByCard = (direction: 1 | -1) => {
        scrollerRef.current?.scrollBy({
            left: direction * 300,
            behavior: "smooth",
        })
    }

    const toggleAudio = (productId: string) => {
        const nextAudibleId = audibleProductId === productId ? null : productId
        setAudibleProductId(nextAudibleId)

        videoRefs.current.forEach((video, id) => {
            const shouldPlayAudio = id === nextAudibleId
            video.muted = !shouldPlayAudio
            if (shouldPlayAudio) {
                video.volume = 0.65
                video.play().catch(() => {
                    video.muted = true
                    setAudibleProductId(null)
                })
            }
        })
    }

    if (products.length === 0) return null

    return (
        <section className="border-t border-border/60 bg-background px-6 py-16 md:px-12 md:py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-10 text-center">
                    <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.45em] text-muted-foreground">
                        Trending now
                    </p>
                    <h2 className="text-3xl font-black uppercase tracking-normal md:text-4xl">Shop the Reels</h2>
                </div>

                <div className="relative">
                    <div
                        ref={scrollerRef}
                        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 md:gap-5"
                    >
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group relative aspect-[9/16] w-[245px] flex-none snap-start overflow-hidden rounded-md bg-neutral-950 shadow-sm md:w-[260px]"
                            >
                                <video
                                    ref={(node) => {
                                        if (node) {
                                            videoRefs.current.set(product.id, node)
                                        } else {
                                            videoRefs.current.delete(product.id)
                                        }
                                    }}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.025]"
                                    src="/hero/reels/reel1.mp4"
                                    autoPlay
                                    muted={audibleProductId !== product.id}
                                    loop
                                    playsInline
                                    preload="metadata"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                                    onClick={() => toggleAudio(product.id)}
                                    aria-label={audibleProductId === product.id ? "Mute reel audio" : "Play reel audio"}
                                >
                                    {audibleProductId === product.id ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                </button>
                                <Link
                                    href={`/product/${product.id}`}
                                    className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 rounded-md bg-black/45 p-2 text-white shadow-2xl backdrop-blur-md"
                                >
                                    <div className="relative h-12 w-12 flex-none overflow-hidden rounded bg-white/10">
                                        <Image
                                            src={normalizeProductImage(product.images?.[0])}
                                            alt={product.name}
                                            fill
                                            sizes="48px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-1 text-[11px] font-semibold">{product.name}</p>
                                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold">
                                            {Number(product.mrp) > Number(product.sellingPrice) && (
                                                <span className="text-white/60 line-through">{formatPrice(product.mrp)}</span>
                                            )}
                                            <span>{formatPrice(product.sellingPrice)}</span>
                                        </div>
                                    </div>
                                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white text-neutral-950">
                                        <ShoppingBag className="h-4 w-4" />
                                    </div>
                                </Link>
                                <Link href={`/product/${product.id}`} className="absolute inset-0 z-0" aria-label={`Shop ${product.name}`} />
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-0 top-1/2 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-lg md:flex"
                        onClick={() => scrollByCard(-1)}
                        aria-label="Scroll reels left"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 translate-x-1/2 rounded-full bg-background shadow-lg md:flex"
                        onClick={() => scrollByCard(1)}
                        aria-label="Scroll reels right"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </section>
    )
}

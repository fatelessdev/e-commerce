"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { normalizeProductImage } from "@/lib/image"
import { ViewportPrefetchLink } from "@/components/ui/viewport-prefetch-link"

function formatPrice(price: string) {
    return `₹${Number(price).toLocaleString("en-IN")}`
}

export function ShopTheReels() {
    const [audibleProductId, setAudibleProductId] = useState<string | null>(null)
    const scrollerRef = useRef<HTMLDivElement>(null)
    const videoRefs = useRef(new Map<string, HTMLVideoElement>())

    // const { data: products = [] } = useQuery({
    //     queryKey: ["shop-the-reels"],
    //     queryFn: async () => {
    //         const params = new URLSearchParams({ limit: "4", isFeatured: "true" })
    //         const res = await fetch(`/api/products?${params.toString()}`)
    //         if (!res.ok) throw new Error("Failed to fetch reels products")
    //         const data = await res.json()
    //         return (data.products || []) as ReelProduct[]
    //     },
    //     staleTime: 1000 * 60 * 5,
    // })

    const products = [
        {
            id: "249fb306-8f60-4f67-8e48-3c6085c2b1fc",
            name: "Xilar InkDistort",
            sellingPrice: "799",
            mrp: "1,498.97",
            src: "/hero/reels/reel1.mp4",
            images: "https://res.cloudinary.com/du44kbibc/image/upload/v1773690782/xilar/products/nw9hmqyoc0ul5jcqblw5.webp"
        },
        {
            id: "f8964c87-0a46-4fb9-98c4-cc7cac816c4b",
            name: "Xilar HypeRiot",
            sellingPrice: "799",
            mrp: "1199",
            src: "/hero/reels/reel2.mp4",
            images: "https://res.cloudinary.com/du44kbibc/image/upload/v1773689124/xilar/products/jfo39kv36zcksesbeccn.webp"
        }

    ];

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

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const intersectingIdsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const handleMenuToggle = (e: Event) => {
            setIsMenuOpen((e as CustomEvent).detail.open)
        }
        window.addEventListener("xilar-mobile-menu", handleMenuToggle)
        setIsMenuOpen(document.body.classList.contains("mobile-menu-open"))
        return () => {
            window.removeEventListener("xilar-mobile-menu", handleMenuToggle)
        }
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target as HTMLVideoElement
                const productId = video.getAttribute("data-product-id") || ""
                if (entry.isIntersecting) {
                    intersectingIdsRef.current.add(productId)
                    if (!document.body.classList.contains("mobile-menu-open")) {
                        video.play().catch(() => {
                            // ignore play interruption errors
                        })
                    }
                } else {
                    intersectingIdsRef.current.delete(productId)
                    video.pause()
                }
            })
        }, {
            threshold: 0.25 // play when at least 25% of the video is in viewport
        })

        videoRefs.current.forEach((video) => {
            observer.observe(video)
        })

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        videoRefs.current.forEach((video, productId) => {
            if (isMenuOpen) {
                video.pause()
            } else if (intersectingIdsRef.current.has(productId)) {
                video.play().catch(() => {
                    // ignore play interruption errors
                })
            }
        })
    }, [isMenuOpen])

    if (products.length === 0) return null

    return (
        <section className="border-t border-border/60 bg-background px-6 py-16 md:px-12 md:py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 md:mb-12 text-center">
                    <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-3">
                        Trending now
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight">Shop the Reels</h2>
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
                                    data-product-id={product.id}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.025]"
                                    src={product.src}
                                    muted={audibleProductId !== product.id}
                                    loop
                                    playsInline
                                    preload="none"
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
                                <ViewportPrefetchLink
                                    href={`/product/${product.id}`}
                                    className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 rounded-md bg-black/45 p-2 text-white shadow-2xl backdrop-blur-md"
                                >
                                    <div className="relative h-12 w-12 flex-none overflow-hidden rounded bg-white/10">
                                        <Image
                                            src={normalizeProductImage(product.images)}
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
                                </ViewportPrefetchLink>
                                <ViewportPrefetchLink href={`/product/${product.id}`} className="absolute inset-0 z-0" aria-label={`Shop ${product.name}`} />
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

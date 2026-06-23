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

interface ReelProduct {
    id: string;
    name: string;
    sellingPrice: string;
    mrp: string;
    images: string | string[];
}

interface ReelItem {
    id: string;
    src: string;
    products: ReelProduct[];
}

export function ShopTheReels() {
    const [audibleReelId, setAudibleReelId] = useState<string | null>(null)
    const scrollerRef = useRef<HTMLDivElement>(null)
    const videoRefs = useRef(new Map<string, HTMLVideoElement>())

    const reels: ReelItem[] = [
        {
            id: "reel-1",
            src: "/hero/reels/reel1.mp4",
            products: [
                {
                    id: "2439572f-d1b6-4aaa-aef3-547649dfa07f",
                    name: "Xilar Rebel Print Tee",
                    sellingPrice: "749.00",
                    mrp: "999.00",
                    images: "https://res.cloudinary.com/du44kbibc/image/upload/v1778015911/xilar/products/pplhmwsksojnzjvmi4dk.webp"
                },
                {
                    id: "b72305dc-5fc9-453b-b4dc-830d628c4fd8",
                    name: "Xilar DualForm",
                    sellingPrice: "799.00",
                    mrp: "1499.00",
                    images: "https://res.cloudinary.com/du44kbibc/image/upload/v1777205097/xilar/products/prp1pabevyxyjkzewzo3.webp"
                }
            ]
        },
        {
            id: "reel-2",
            src: "/hero/reels/reel2.mp4",
            products: [
                {
                    id: "249fb306-8f60-4f67-8e48-3c6085c2b1fc",
                    name: "Xilar InkDistort",
                    sellingPrice: "799",
                    mrp: "1,498.97",
                    images: "https://res.cloudinary.com/du44kbibc/image/upload/v1773690782/xilar/products/nw9hmqyoc0ul5jcqblw5.webp"
                }
            ]
        },
        {
            id: "reel-3",
            src: "/hero/reels/reel3.mp4",
            products: [
                {
                    id: "f8964c87-0a46-4fb9-98c4-cc7cac816c4b",
                    name: "Xilar HypeRiot",
                    sellingPrice: "799",
                    mrp: "1199",
                    images: "https://res.cloudinary.com/du44kbibc/image/upload/v1773689124/xilar/products/jfo39kv36zcksesbeccn.webp"
                }
            ]
        }
    ];

    const scrollByCard = (direction: 1 | -1) => {
        scrollerRef.current?.scrollBy({
            left: direction * 300,
            behavior: "smooth",
        })
    }

    const toggleAudio = (reelId: string) => {
        const nextAudibleId = audibleReelId === reelId ? null : reelId
        setAudibleReelId(nextAudibleId)

        videoRefs.current.forEach((video, id) => {
            const shouldPlayAudio = id === nextAudibleId
            video.muted = !shouldPlayAudio
            if (shouldPlayAudio) {
                video.volume = 0.65
                video.play().catch(() => {
                    video.muted = true
                    setAudibleReelId(null)
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
        const timer = window.setTimeout(() => {
            setIsMenuOpen(document.body.classList.contains("mobile-menu-open"))
        }, 0)
        return () => {
            window.clearTimeout(timer)
            window.removeEventListener("xilar-mobile-menu", handleMenuToggle)
        }
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target as HTMLVideoElement
                const reelId = video.getAttribute("data-reel-id") || ""
                if (entry.isIntersecting) {
                    intersectingIdsRef.current.add(reelId)
                    if (!document.body.classList.contains("mobile-menu-open")) {
                        video.play().catch(() => {
                            // ignore play interruption errors
                        })
                    }
                } else {
                    intersectingIdsRef.current.delete(reelId)
                    video.pause()
                }
            })
        }, {
            threshold: 0.1,
            rootMargin: typeof window !== "undefined" && window.innerWidth < 768 ? "50px 0px 50px 0px" : "150px 0px 150px 0px"
        })

        videoRefs.current.forEach((video) => {
            observer.observe(video)
        })

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        videoRefs.current.forEach((video, reelId) => {
            if (isMenuOpen) {
                video.pause()
            } else if (intersectingIdsRef.current.has(reelId)) {
                video.play().catch(() => {
                    // ignore play interruption errors
                })
            }
        })
    }, [isMenuOpen])

    if (reels.length === 0) return null

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
                        {reels.map((reel) => (
                            <div
                                key={reel.id}
                                className="group relative aspect-[9/16] w-[245px] flex-none snap-start overflow-hidden rounded-md bg-neutral-950 shadow-sm md:w-[260px]"
                            >
                                <video
                                    ref={(node) => {
                                        if (node) {
                                            videoRefs.current.set(reel.id, node)
                                        } else {
                                            videoRefs.current.delete(reel.id)
                                        }
                                    }}
                                    data-reel-id={reel.id}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.025]"
                                    src={reel.src}
                                    muted={audibleReelId !== reel.id}
                                    loop
                                    playsInline
                                    preload="none"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                                    onClick={() => toggleAudio(reel.id)}
                                    aria-label={audibleReelId === reel.id ? "Mute reel audio" : "Play reel audio"}
                                >
                                    {audibleReelId === reel.id ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                </button>
                                
                                <div className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2">
                                    {reel.products.map((product) => (
                                        <ViewportPrefetchLink
                                            key={product.id}
                                            href={`/product/${product.id}`}
                                            className="flex items-center gap-2 rounded-md bg-black/45 p-2 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:bg-black/60 hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            <div className="relative h-12 w-12 flex-none overflow-hidden rounded bg-white/10">
                                                <Image
                                                    src={normalizeProductImage(Array.isArray(product.images) ? product.images[0] : product.images)}
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
                                            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white text-neutral-950 transition-transform duration-300 hover:scale-110">
                                                <ShoppingBag className="h-4 w-4" />
                                            </div>
                                        </ViewportPrefetchLink>
                                    ))}
                                </div>

                                {reel.products.length === 1 ? (
                                    <ViewportPrefetchLink 
                                        href={`/product/${reel.products[0].id}`} 
                                        className="absolute inset-0 z-0" 
                                        aria-label={`Shop ${reel.products[0].name}`} 
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => toggleAudio(reel.id)}
                                        className="absolute inset-0 z-0 w-full h-full bg-transparent cursor-pointer"
                                        aria-label="Toggle audio"
                                    />
                                )}
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

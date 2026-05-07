"use client"

import { useWishlist } from "@/lib/wishlist-context"
import { useCart } from "@/lib/cart-context"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag, Trash2 } from "lucide-react"
import { normalizeProductImage } from "@/lib/image"

export default function WishlistPage() {
    const { items, removeItem } = useWishlist()
    const { addItem, setIsOpen } = useCart()

    const handleAddToCart = (item: typeof items[0]) => {
        addItem({
            ...item,
            size: "M",
        })
        setIsOpen(true)
    }

    return (
        <div className="min-h-screen">
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Saved</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
                    Wishlist
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">{items.length} saved items</p>
            </div>

            <div className="p-6 md:px-12">
                {items.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
                            <Heart className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">No saved items yet</p>
                        <p className="text-xs text-muted-foreground mb-6 max-w-[260px] mx-auto">Tap the heart icon on any product to save it here for later.</p>
                        <Link href="/shop">
                            <Button variant="outline" className="rounded-none text-xs uppercase tracking-[0.1em]">
                                Browse products
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="bg-transparent border-0 rounded-none">
                                <CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-muted/30">
                                    <Link href={`/product/${item.id}`}>
                                        <Image
                                            src={normalizeProductImage(item.image)}
                                            alt={item.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105"
                                        />
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background backdrop-blur-sm"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </CardContent>
                                <CardFooter className="flex flex-col items-start px-1 sm:px-2 pt-4 pb-2 space-y-3">
                                    <div className="w-full">
                                        <h3 className="font-medium tracking-tight text-sm leading-tight">{item.name}</h3>
                                        <span className="font-semibold text-sm tabular-nums">{item.displayPrice}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-none h-10 text-[10px] uppercase tracking-[0.15em]"
                                        onClick={() => handleAddToCart(item)}
                                    >
                                        <ShoppingBag className="h-3.5 w-3.5 mr-2" /> Add to cart
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

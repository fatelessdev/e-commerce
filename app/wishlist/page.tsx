"use client"

import { useWishlist } from "@/lib/wishlist-context"
import { useCart } from "@/lib/cart-context"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, ShoppingBag, Trash2 } from "lucide-react"

export default function WishlistPage() {
    const { items, removeItem } = useWishlist()
    const { addItem, setIsOpen } = useCart()

    const handleAddToCart = (item: typeof items[0]) => {
        addItem({
            ...item,
            size: "M", // Default size when adding from wishlist
        })
        setIsOpen(true)
    }

    return (
        <div className="min-h-screen">
            <div className="px-6 py-12 border-b border-border">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase flex items-center gap-4">
                    <Heart className="h-10 w-10" /> Wishlist
                </h1>
                <p className="text-muted-foreground mt-2">{items.length} saved items</p>
            </div>

            <div className="p-6">
                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-lg mb-4">Your wishlist is empty</p>
                        <Link href="/shop">
                            <Button variant="outline" className="rounded-none">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="rounded-none border-0 bg-transparent shadow-none">
                                <CardContent className="p-0 relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                                    <Link href={`/product/${item.id}`}>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105"
                                            style={{ backgroundImage: `url(${item.image})` }}
                                        />
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                                <CardFooter className="flex flex-col items-start p-4 space-y-3">
                                    <div className="w-full">
                                        <h3 className="font-medium tracking-tight text-lg">{item.name}</h3>
                                        <span className="font-semibold">{item.displayPrice}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-none h-10 text-xs uppercase"
                                        onClick={() => handleAddToCart(item)}
                                    >
                                        <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
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

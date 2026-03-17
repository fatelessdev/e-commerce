"use client"

import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"

export function CartDrawer() {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()
    const { data: session } = useSession()
    const router = useRouter()

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        <h2 className="text-lg font-bold uppercase tracking-tight">Your Cart ({totalItems})</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">Your cart is empty</p>
                            <Button variant="outline" className="rounded-none" onClick={() => setIsOpen(false)}>
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={`${item.id}-${item.size}-${item.color || ''}`} className="flex gap-4 border-b border-border pb-4">
                                <div
                                    className="w-20 h-24 bg-cover bg-center bg-neutral-900 flex-shrink-0"
                                    style={{ backgroundImage: `url(${item.image})` }}
                                />
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-medium">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Size: {item.size}{item.color && ` • ${item.color}`}
                                    </p>
                                    <p className="font-semibold">{item.displayPrice}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-none"
                                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-none"
                                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 self-start"
                                    onClick={() => removeItem(item.id, item.size, item.color)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-border space-y-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                        </div>
                        {!session ? (
                            <div className="space-y-2">
                                <Button
                                    className="w-full h-14 rounded-none text-lg uppercase tracking-widest font-bold"
                                    onClick={() => {
                                        setIsOpen(false)
                                        router.push("/account?redirect=/checkout")
                                    }}
                                >
                                    Sign In to Checkout
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Sign in required to place an order
                                </p>
                            </div>
                        ) : (
                            <Link href="/checkout" onClick={() => setIsOpen(false)}>
                                <Button className="w-full h-14 rounded-none text-lg uppercase tracking-widest font-bold">
                                    Checkout
                                </Button>
                            </Link>
                        )}
                        <Button
                            variant="ghost"
                            className="w-full text-xs uppercase tracking-widest"
                            onClick={clearCart}
                        >
                            Clear Cart
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}

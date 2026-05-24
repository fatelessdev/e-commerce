"use client"

import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { X, Minus, Plus, ShoppingBag, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { useEffect, useRef } from "react"
import { normalizeProductImage } from "@/lib/image"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants"

export function CartDrawer() {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()
    const { data: session } = useSession()
    const router = useRouter()
    const drawerRef = useRef<HTMLDivElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const freeShippingUnlocked = totalPrice >= FREE_SHIPPING_THRESHOLD
    const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice)

    // Focus trap: focus close button when drawer opens
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus()
        }
    }, [isOpen])

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, setIsOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer */}
                    <motion.div
                        ref={drawerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Shopping cart"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border/60 z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border/60">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-4 w-4" />
                                <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Cart ({totalItems})</h2>
                            </div>
                            <Button ref={closeButtonRef} variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)} aria-label="Close cart">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
                                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                        <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-medium">Nothing here yet</p>
                                        <p className="text-xs text-muted-foreground max-w-[220px]">Browse our latest drops and find something bold. Free shipping on orders above ₹999.</p>
                                    </div>
                                    <Button variant="outline" className="rounded-none text-xs uppercase tracking-[0.1em]" onClick={() => { setIsOpen(false); router.push("/shop"); }}>
                                        Explore the shop
                                    </Button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={`${item.comboGroupId || "single"}-${item.id}-${item.size}-${item.color || ''}`} className="flex gap-4 pb-5 border-b border-border/40">
                                        <Image
                                            src={normalizeProductImage(item.image)}
                                            alt={item.name}
                                            width={80}
                                            height={96}
                                            className="w-20 h-24 object-cover flex-shrink-0 bg-muted/30"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                                            {item.comboName && (
                                                <p className="text-[10px] uppercase tracking-[0.15em] text-red-accent">
                                                    Combo: {item.comboName}
                                                </p>
                                            )}
                                            {!(item.size === "One Size" && !item.color) && (
                                                <p className="text-xs text-muted-foreground">
                                                    Size: {item.size}{item.color && ` · ${item.color}`}
                                                </p>
                                            )}
                                            <p className="font-semibold text-sm tabular-nums">{item.displayPrice}</p>
                                            <div className="flex items-center gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-none"
                                                    aria-label={`Decrease quantity of ${item.name}`}
                                                    onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color, item.comboGroupId)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-none"
                                                    aria-label={`Increase quantity of ${item.name}`}
                                                    onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color, item.comboGroupId)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 self-start text-muted-foreground hover:text-foreground"
                                            aria-label={`Remove ${item.name} from cart`}
                                            onClick={() => removeItem(item.id, item.size, item.color, item.comboGroupId)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-border/60 space-y-4">
                                <div
                                    className={`border px-4 py-3 text-sm font-semibold ${
                                        freeShippingUnlocked
                                            ? "border-emerald-700/20 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                                            : "border-border/70 bg-secondary/20 text-foreground"
                                    }`}
                                >
                                    {freeShippingUnlocked ? (
                                        <span className="flex items-center gap-2">
                                            <Check className="h-4 w-4" />
                                            You’ve unlocked free shipping!
                                        </span>
                                    ) : (
                                        <span className="block">
                                            Add ₹{freeShippingRemaining.toLocaleString("en-IN")} more to unlock free shipping
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm font-semibold uppercase tracking-[0.1em]">
                                    <span>Total</span>
                                    <span className="tabular-nums">₹{totalPrice.toLocaleString("en-IN")}</span>
                                </div>
                                {!session ? (
                                    <div className="space-y-2">
                                        <Button
                                            className="w-full h-13 rounded-none text-xs uppercase tracking-[0.2em] font-semibold"
                                            onClick={() => {
                                                setIsOpen(false)
                                                router.push("/account?redirect=/checkout")
                                            }}
                                        >
                                            Sign in to checkout
                                        </Button>
                                        <p className="text-[10px] text-center text-muted-foreground tracking-wide">
                                            Sign in required to place an order
                                        </p>
                                    </div>
                                ) : (
                                    <Link href="/checkout" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full h-13 rounded-none text-xs uppercase tracking-[0.2em] font-semibold">
                                            Checkout
                                        </Button>
                                    </Link>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
                                    onClick={clearCart}
                                >
                                    Clear cart
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

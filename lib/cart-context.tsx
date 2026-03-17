"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface CartItem {
    id: string
    name: string
    price: number
    displayPrice: string
    image: string
    size: string
    color?: string
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, "quantity">) => void
    removeItem: (id: string, size: string, color?: string) => void
    updateQuantity: (id: string, size: string, quantity: number, color?: string) => void
    clearCart: () => void
    totalItems: number
    totalPrice: number
    isOpen: boolean
    setIsOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") return []
        const stored = localStorage.getItem("xilar-cart")
        return stored ? JSON.parse(stored) : []
    })
    const [isOpen, setIsOpen] = useState(false)
    const [isHydrated] = useState(() => typeof window !== "undefined")

    // Save to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("xilar-cart", JSON.stringify(items))
        }
    }, [items, isHydrated])

    const addItem = (newItem: Omit<CartItem, "quantity">) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === newItem.id && i.size === newItem.size && i.color === newItem.color)
            if (existing) {
                return prev.map((i) =>
                    i.id === newItem.id && i.size === newItem.size && i.color === newItem.color
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            }
            return [...prev, { ...newItem, quantity: 1 }]
        })
        setIsOpen(true)
    }

    const removeItem = (id: string, size: string, color?: string) => {
        setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size && i.color === color)))
    }

    const updateQuantity = (id: string, size: string, quantity: number, color?: string) => {
        if (quantity <= 0) {
            removeItem(id, size, color)
            return
        }
        // Cap at 10 units per variant to prevent abuse (server enforces actual stock limits)
        const cappedQuantity = Math.min(quantity, 10)
        setItems((prev) =>
            prev.map((i) => (i.id === id && i.size === size && i.color === color ? { ...i, quantity: cappedQuantity } : i))
        )
    }

    const clearCart = () => setItems([])

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
    const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                isOpen,
                setIsOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}

"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { generateSecureCode } from "@/lib/utils"

export interface CartItem {
    id: string
    name: string
    price: number
    displayPrice: string
    image: string
    size: string
    color?: string
    comboId?: string
    comboGroupId?: string
    comboName?: string
    comboMaxDiscountAmount?: number
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, "quantity">) => void
    addCombo: (combo: {
        comboId: string
        comboName: string
        maxDiscountAmount: number
        items: [
            Omit<CartItem, "quantity" | "comboId" | "comboGroupId" | "comboName" | "comboMaxDiscountAmount">,
            Omit<CartItem, "quantity" | "comboId" | "comboGroupId" | "comboName" | "comboMaxDiscountAmount">
        ]
    }) => void
    removeItem: (id: string, size: string, color?: string, comboGroupId?: string) => void
    updateQuantity: (id: string, size: string, quantity: number, color?: string, comboGroupId?: string) => void
    clearCart: () => void
    totalItems: number
    totalPrice: number
    isHydrated: boolean
    isOpen: boolean
    setIsOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function readStoredCart() {
    const stored = localStorage.getItem("xilar-cart")
    if (!stored) return []

    try {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        localStorage.removeItem("xilar-cart")
        return []
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        queueMicrotask(() => {
            setItems(readStoredCart())
            setIsHydrated(true)
        })
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("xilar-cart", JSON.stringify(items))
        }
    }, [items, isHydrated])

    const addItem = (newItem: Omit<CartItem, "quantity">) => {
        setItems((prev) => {
            const existing = prev.find((i) =>
                !i.comboGroupId &&
                i.id === newItem.id &&
                i.size === newItem.size &&
                i.color === newItem.color
            )
            if (existing) {
                return prev.map((i) =>
                    !i.comboGroupId &&
                    i.id === newItem.id &&
                    i.size === newItem.size &&
                    i.color === newItem.color
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            }
            return [...prev, { ...newItem, quantity: 1 }]
        })
        setIsOpen(true)
    }

    const addCombo: CartContextType["addCombo"] = (combo) => {
        const comboGroupId = `combo-${Date.now()}-${generateSecureCode("", 6).toLowerCase()}`
        setItems((prev) => [
            ...prev,
            ...combo.items.map((item) => ({
                ...item,
                quantity: 1,
                comboId: combo.comboId,
                comboGroupId,
                comboName: combo.comboName,
                comboMaxDiscountAmount: combo.maxDiscountAmount,
            })),
        ])
        setIsOpen(true)
    }

    const removeItem = (id: string, size: string, color?: string, comboGroupId?: string) => {
        setItems((prev) => {
            const target = prev.find((i) =>
                i.id === id &&
                i.size === size &&
                i.color === color &&
                (comboGroupId ? i.comboGroupId === comboGroupId : true)
            )

            if (!target) return prev

            if (target.comboGroupId) {
                return prev.filter((i) => i.comboGroupId !== target.comboGroupId)
            }

            return prev.filter((i) => !(i.id === id && i.size === size && i.color === color && !i.comboGroupId))
        })
    }

    const updateQuantity = (id: string, size: string, quantity: number, color?: string, comboGroupId?: string) => {
        if (quantity <= 0) {
            removeItem(id, size, color, comboGroupId)
            return
        }
        // Cap at 10 units per variant to prevent abuse (server enforces actual stock limits)
        const cappedQuantity = Math.min(quantity, 10)
        setItems((prev) => {
            const target = prev.find((i) =>
                i.id === id &&
                i.size === size &&
                i.color === color &&
                (comboGroupId ? i.comboGroupId === comboGroupId : true)
            )

            if (!target) return prev

            if (target.comboGroupId) {
                return prev.map((i) =>
                    i.comboGroupId === target.comboGroupId ? { ...i, quantity: cappedQuantity } : i
                )
            }

            return prev.map((i) =>
                i.id === id && i.size === size && i.color === color && !i.comboGroupId
                    ? { ...i, quantity: cappedQuantity }
                    : i
            )
        })
    }

    const clearCart = () => setItems([])

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
    const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                addCombo,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                isHydrated,
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

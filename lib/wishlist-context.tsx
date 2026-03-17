"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface WishlistItem {
    id: string
    name: string
    price: number
    displayPrice: string
    image: string
}

interface WishlistContextType {
    items: WishlistItem[]
    addItem: (item: WishlistItem) => void
    removeItem: (id: string) => void
    isInWishlist: (id: string) => boolean
    toggleItem: (item: WishlistItem) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>(() => {
        if (typeof window === "undefined") return []
        const stored = localStorage.getItem("xilar-wishlist")
        return stored ? JSON.parse(stored) : []
    })
    const [isHydrated] = useState(() => typeof window !== "undefined")

    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("xilar-wishlist", JSON.stringify(items))
        }
    }, [items, isHydrated])

    const addItem = (item: WishlistItem) => {
        setItems((prev) => {
            if (prev.find((i) => i.id === item.id)) return prev
            return [...prev, item]
        })
    }

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id))
    }

    const isInWishlist = (id: string) => items.some((i) => i.id === id)

    const toggleItem = (item: WishlistItem) => {
        if (isInWishlist(item.id)) {
            removeItem(item.id)
        } else {
            addItem(item)
        }
    }

    return (
        <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, toggleItem }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (!context) {
        throw new Error("useWishlist must be used within a WishlistProvider")
    }
    return context
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search, ShoppingBag, Heart, Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"

export function Navbar() {
    const router = useRouter()
    const { totalItems, setIsOpen } = useCart()
    const { items: wishlistItems } = useWishlist()
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearch, setShowSearch] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
            setShowSearch(false)
            setSearchQuery("")
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 glass bg-background/80">
            <div className="flex h-16 items-center px-4 md:px-6">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-2"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                    {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* Logo */}
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    {/* <span className="text-xl font-bold tracking-tighter">XILAR</span> */}
                    <img src="/logo.png" alt="XILAR" className="h-8 md:h-10 w-auto object-contain dark:invert" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    <Link href="/shop" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Shop
                    </Link>
                    <Link href="/new" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        New Arrivals
                    </Link>
                    <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        About
                    </Link>
                </nav>

                {/* Actions */}
                <div className="ml-auto flex items-center space-x-1 md:space-x-2">
                    {/* Search */}
                    {showSearch ? (
                        <form onSubmit={handleSearch} className="flex items-center">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                className="h-9 w-32 md:w-48 px-3 bg-secondary/50 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <Button type="submit" variant="ghost" size="icon" className="h-9 w-9">
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </form>
                    ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(true)}>
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Search</span>
                        </Button>
                    )}

                    {/* Wishlist */}
                    <Link href="/wishlist">
                        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                            <Heart className="h-4 w-4" />
                            {wishlistItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-xs flex items-center justify-center">
                                    {wishlistItems.length}
                                </span>
                            )}
                            <span className="sr-only">Wishlist</span>
                        </Button>
                    </Link>

                    {/* Account */}
                    <Link href="/account">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <User className="h-4 w-4" />
                            <span className="sr-only">Account</span>
                        </Button>
                    </Link>

                    {/* Cart */}
                    <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => setIsOpen(true)}>
                        <ShoppingBag className="h-4 w-4" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-xs flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                        <span className="sr-only">Cart</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="md:hidden border-t border-white/10 py-4 px-4 space-y-2 bg-background">
                    <Link href="/shop" className="block py-2 text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                        Shop All
                    </Link>
                    <Link href="/shop/men" className="block py-2 text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                        Men
                    </Link>
                    <Link href="/shop/women" className="block py-2 text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                        Women
                    </Link>
                    <Link href="/new" className="block py-2 text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                        New Arrivals
                    </Link>
                    <Link href="/about" className="block py-2 text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                        About
                    </Link>
                </div>
            )}
        </header>
    )
}

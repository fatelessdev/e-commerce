"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Search, Menu, X, ArrowRight } from "lucide-react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { cn } from "@/lib/utils"

export function Navbar() {
    const router = useRouter()
    const pathname = usePathname()
    const { totalItems, setIsOpen } = useCart()
    const { items: wishlistItems } = useWishlist()
    
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearch, setShowSearch] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    // Scroll handling for hide/show and background opacity
    const { scrollY } = useScroll()
    const [hidden, setHidden] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        
        // Background opacity based on scroll
        if (latest > 50) {
            setIsScrolled(true)
        } else {
            setIsScrolled(false)
        }

        // Hide/show logic based on scroll direction
        if (latest > 150 && latest > previous) {
            setHidden(true)
        } else {
            setHidden(false)
        }
    })

    // Search handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
            setShowSearch(false)
            setSearchQuery("")
        }
    }

    // Close overlays on route change
    useEffect(() => {
        setShowSearch(false)
        setShowMobileMenu(false)
    }, [pathname])

    // Prevent body scroll when overlays are open
    useEffect(() => {
        if (showSearch || showMobileMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [showSearch, showMobileMenu])

    const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
        <Link 
            href={href} 
            className="relative group text-[11px] md:text-xs uppercase tracking-[0.15em] font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-foreground origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
        </Link>
    )

    const NavButton = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
        <button 
            onClick={onClick}
            className="relative group text-[11px] md:text-xs uppercase tracking-[0.15em] font-medium text-foreground/80 hover:text-foreground transition-colors outline-none"
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-foreground origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
        </button>
    )

    return (
        <>
            <motion.header 
                variants={{
                    visible: { y: 0 },
                    hidden: { y: "-100%" }
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} // --ease-out-expo
                style={{ willChange: "transform" }}
                className={cn(
                    "fixed top-0 inset-x-0 z-50 w-full transition-colors duration-300",
                    isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border/50" : "bg-transparent border-transparent"
                )}
            >
                <div className="flex h-20 items-center justify-between px-6 md:px-12 lg:px-16">
                    
                    {/* Left: Mobile Menu Toggle / Desktop Nav */}
                    <div className="flex-1 flex items-center justify-start">
                        <button
                            className="md:hidden p-2 -ml-2 text-foreground"
                            onClick={() => setShowMobileMenu(true)}
                            aria-label="Open mobile menu"
                        >
                            <Menu className="h-5 w-5 stroke-[1.5]" />
                        </button>

                        <nav className="hidden md:flex items-center gap-8">
                            <NavLink href="/shop">Shop</NavLink>
                            <NavLink href="/new">New Arrivals</NavLink>
                            <NavLink href="/about">About</NavLink>
                        </nav>
                    </div>

                    {/* Center: Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center justify-center">
                        <Image 
                            src="/logo.png" 
                            alt="XILAR" 
                            width={140} 
                            height={45} 
                            priority
                            className="h-8 md:h-10 w-auto object-contain dark:invert" 
                        />
                    </Link>

                    {/* Right: Actions */}
                    <div className="flex-1 flex items-center justify-end gap-6 md:gap-8">
                        <NavButton onClick={() => setShowSearch(true)}>Search</NavButton>
                        <div className="hidden md:flex gap-8 items-center">
                            <NavLink href="/wishlist">Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}</NavLink>
                            <NavLink href="/account">Account</NavLink>
                        </div>
                        <NavButton onClick={() => setIsOpen(true)}>Cart {totalItems > 0 ? `[${totalItems}]` : `(0)`}</NavButton>
                    </div>

                </div>
            </motion.header>

            {/* Search Overlay */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ willChange: "opacity" }}
                        className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col"
                    >
                        <div className="flex justify-between items-center px-6 md:px-12 lg:px-16 h-20">
                            <div className="flex-1" />
                            <div className="flex-1 flex justify-center">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Search</span>
                            </div>
                            <div className="flex-1 flex justify-end">
                                <button onClick={() => setShowSearch(false)} className="p-2 -mr-2 text-foreground/80 hover:text-foreground" aria-label="Close search">
                                    <X className="h-6 w-6 stroke-[1]" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
                            <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
                                <input
                                    type="text"
                                    placeholder="WHAT ARE YOU LOOKING FOR?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full bg-transparent border-b-2 border-foreground/20 focus:border-foreground text-2xl md:text-4xl lg:text-5xl uppercase font-light pb-4 outline-none transition-colors placeholder:text-muted-foreground/30"
                                />
                                <button type="submit" className="absolute right-0 bottom-4 text-foreground hover:text-[var(--red)] transition-colors" aria-label="Submit search">
                                    <ArrowRight className="h-8 w-8 stroke-[1.5]" />
                                </button>
                            </form>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="mt-16 w-full max-w-2xl flex flex-col gap-4"
                            >
                                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Trending Searches</p>
                                <div className="flex flex-wrap gap-4">
                                    {['Oversized Tees', 'Cargo Pants', 'Summer Collection', 'Hoodies'].map((term) => (
                                        <button 
                                            key={term}
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery(term)
                                                router.push(`/shop?search=${encodeURIComponent(term)}`)
                                                setShowSearch(false)
                                            }}
                                            className="text-sm font-light hover:text-[var(--red)] transition-colors"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div 
                        initial={{ opacity: 0, x: "-100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "-100%" }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        style={{ willChange: "transform, opacity" }}
                        className="fixed inset-0 z-[60] bg-background flex flex-col md:hidden"
                    >
                        <div className="flex justify-between items-center px-6 h-20 border-b border-border/50">
                            <span className="text-[11px] uppercase tracking-widest font-medium">Menu</span>
                            <button onClick={() => setShowMobileMenu(false)} className="p-2 -mr-2" aria-label="Close menu">
                                <X className="h-5 w-5 stroke-[1.5]" />
                            </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col pt-12 px-8 gap-8 overflow-y-auto">
                            <Link href="/shop" className="text-3xl font-light tracking-tight hover:text-[var(--red)] transition-colors">Shop All</Link>
                            <Link href="/shop/men" className="text-3xl font-light tracking-tight hover:text-[var(--red)] transition-colors">Men</Link>
                            <Link href="/shop/women" className="text-3xl font-light tracking-tight hover:text-[var(--red)] transition-colors">Women</Link>
                            <Link href="/new" className="text-3xl font-light tracking-tight hover:text-[var(--red)] transition-colors">New Arrivals</Link>
                            <Link href="/about" className="text-3xl font-light tracking-tight hover:text-[var(--red)] transition-colors">About</Link>
                        </div>

                        <div className="p-8 flex flex-col gap-6 bg-secondary/20 mt-auto">
                            <Link href="/wishlist" className="text-xs uppercase tracking-widest font-medium flex justify-between">
                                Wishlist <span>{wishlistItems.length}</span>
                            </Link>
                            <Link href="/account" className="text-xs uppercase tracking-widest font-medium">
                                Account
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

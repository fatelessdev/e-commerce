"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Heart, Menu, X, User, Package, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { BARGAIN_BOT_BANNER_MESSAGE, CONTACT_PHONE } from "@/lib/constants";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const mobileLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop/men", label: "For Him" },
  { href: "/shop/women", label: "For Her" },
  { href: "/new", label: "New Drop" },
  { href: "/collections/essentials", label: "Collections" },
  { href: "/account", label: "Account" },
  { href: "/orders", label: "Orders" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* Bargain Bot Banner */}
      <div className="w-full bg-red-accent/8 border-b border-red-accent/10 py-1.5">
        <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.15em] uppercase text-red-accent font-medium">
          <Bot className="h-3 w-3" />
          <span>{BARGAIN_BOT_BANNER_MESSAGE}</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 md:h-16 items-center px-4 md:px-6 lg:px-8">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-expanded={showMobileMenu}
            aria-controls="mobile-menu"
            aria-label={showMobileMenu ? "Close menu" : "Open menu"}
          >
            <div className="relative h-5 w-5">
              <AnimatePresence mode="wait" initial={false}>
                {showMobileMenu ? (
                  <motion.div
                    key="close"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Button>

          {/* Logo */}
          <Link href="/" className="mr-6 flex items-center">
            <Image
              src="/logo.png"
              alt="XILAR"
              width={160}
              height={40}
              className="h-7 md:h-9 w-auto object-contain dark:invert"
            />
          </Link>

          {/* Questions - Desktop */}
          <div className="hidden lg:flex items-center text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
            Questions?{" "}
            <span className="ml-2 text-foreground font-medium">{CONTACT_PHONE}</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10 text-sm font-medium ml-auto mr-8 xl:mr-16">
            {[
              { href: "/shop/men", label: "For Him" },
              { href: "/shop/women", label: "For Her" },
              { href: "/new", label: "New Drop" },
              { href: "/collections/essentials", label: "Collections" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative tracking-[0.15em] uppercase text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-red-accent after:transition-all after:duration-500 after:ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center space-x-0.5 md:space-x-1">
            <ThemeToggleButton
              showLabel={false}
              variant="circle"
              start="top-right"
            />

            <Link href="/orders">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors duration-300" aria-label="Orders">
                <Package className="h-4 w-4" />
                <span className="sr-only">Orders</span>
              </Button>
            </Link>

            <Link href="/account" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors duration-300" aria-label="Account">
                <User className="h-4 w-4" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>

            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground transition-colors duration-300" aria-label="Wishlist">
                <Heart className="h-4 w-4" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-accent text-white text-[10px] flex items-center justify-center font-semibold">
                    {wishlistItems.length}
                  </span>
                )}
                <span className="sr-only">Wishlist</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative text-muted-foreground hover:text-foreground transition-colors duration-300"
              onClick={() => setIsOpen(true)}
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-accent text-white text-[10px] flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu — Staggered Reveal */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              id="mobile-menu"
              className="md:hidden border-t border-border overflow-hidden bg-background absolute top-full left-0 w-full z-50"
            >
              <div className="py-4 px-4 space-y-0">
                {mobileLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      duration: 0.35,
                      delay: i * 0.04,
                      ease: EASE_OUT_EXPO,
                    }}
                  >
                    <Link
                      href={link.href}
                      className="block py-3.5 text-sm font-medium tracking-[0.15em] uppercase border-b border-border/60 text-foreground/80 hover:text-foreground transition-colors duration-300"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

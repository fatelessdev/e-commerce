"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Heart, Menu, X, User, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { FREE_SHIPPING_THRESHOLD_DISPLAY } from "@/lib/constants";

export function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* Free Delivery Banner */}
      <div className="w-full bg-gold/10 border-b border-gold/20 py-1.5">
        <div className="flex items-center justify-center gap-2 text-xs tracking-wide text-gold">
          <Truck className="h-3.5 w-3.5" />
          <span>Free delivery on orders above {FREE_SHIPPING_THRESHOLD_DISPLAY}</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="flex h-14 md:h-16 items-center px-4 md:px-6">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <Link href="/" className="mr-6 flex items-center">
            <Image
              src="/logo.png"
              alt="XILAR"
              width={160}
              height={40}
              className="h-8 md:h-10 w-auto object-contain dark:invert"
            />
          </Link>

          {/* Questions - Desktop */}
          <div className="hidden lg:flex items-center text-xs tracking-wide text-muted-foreground">
            QUESTIONS?{" "}
            <span className="ml-2 text-foreground">+91 8090644991</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-sm font-medium ml-auto mr-8 xl:mr-16">
            <Link
              href="/shop/men"
              className="tracking-wider uppercase text-xs hover:text-gold transition-colors"
            >
              For Him
            </Link>
            <Link
              href="/shop/women"
              className="tracking-wider uppercase text-xs hover:text-gold transition-colors"
            >
              For Her
            </Link>
            <Link
              href="/new"
              className="tracking-wider uppercase text-xs hover:text-gold transition-colors"
            >
              New Drop
            </Link>
            <Link
              href="/collections"
              className="tracking-wider uppercase text-xs hover:text-gold transition-colors"
            >
              Collections
            </Link>
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center space-x-0.5 md:space-x-1">
            {/* Theme Toggle */}
            <ThemeToggleButton
              showLabel={false}
              variant="circle"
              start="top-right"
            />

            {/* Orders */}
            <Link href="/orders">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Package className="h-4 w-4" />
                <span className="sr-only">Orders</span>
              </Button>
            </Link>

            {/* Account - Hidden on mobile */}
            <Link href="/account" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-4 w-4" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Heart className="h-4 w-4" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-black text-xs flex items-center justify-center font-medium">
                    {wishlistItems.length}
                  </span>
                )}
                <span className="sr-only">Wishlist</span>
              </Button>
            </Link>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-black text-xs flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border py-4 px-4 space-y-1 bg-background absolute top-full left-0 w-full shadow-lg z-50 animate-in slide-in-from-top-2">
            <Link
              href="/shop"
              className="block py-3 text-sm font-medium tracking-wider uppercase border-b border-border"
              onClick={() => setShowMobileMenu(false)}
            >
              Shop All
            </Link>
            <Link
              href="/shop/men"
              className="block py-3 text-sm font-medium tracking-wider uppercase border-b border-border"
              onClick={() => setShowMobileMenu(false)}
            >
              For Him
            </Link>
            <Link
              href="/shop/women"
              className="block py-3 text-sm font-medium tracking-wider uppercase border-b border-border"
              onClick={() => setShowMobileMenu(false)}
            >
              For Her
            </Link>
            <Link
              href="/new"
              className="block py-3 text-sm font-medium tracking-wider uppercase border-b border-border"
              onClick={() => setShowMobileMenu(false)}
            >
              New Drop
            </Link>
            <Link
              href="/collections"
              className="block py-3 text-sm font-medium tracking-wider uppercase border-b border-border"
              onClick={() => setShowMobileMenu(false)}
            >
              Collections
            </Link>
            <Link
              href="/account"
              className="block py-3 text-sm font-medium tracking-wider uppercase text-muted-foreground border-b border-border"
              onClick={() => setShowMobileMenu(false)}
            >
              Account
            </Link>
            <Link
              href="/orders"
              className="block py-3 text-sm font-medium tracking-wider uppercase text-muted-foreground border-b border-border"
              onClick={() => setShowMobileMenu(false)}
            >
              Orders
            </Link>
            <Link
              href="/about"
              className="block py-3 text-sm font-medium tracking-wider uppercase text-muted-foreground"
              onClick={() => setShowMobileMenu(false)}
            >
              About
            </Link>
          </div>
        )}
      </header>
    </>
  );
}

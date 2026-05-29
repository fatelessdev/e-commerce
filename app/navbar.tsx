"use client";
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Heart, Menu, X, User, Package, ChevronLeft, ChevronRight, Bot, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { ANNOUNCEMENT_MESSAGES, CONTACT_PHONE } from "@/lib/constants";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const overlayLinks = [
  { href: "/shop/men", label: "Men", img: "/hero/image(4).webp" },
  { href: "/shop/women", label: "Women", img: "/clothes/topwear-women.jpeg" },
  { href: "/shop/accessories", label: "Accessories", img: "/hero/image(5).webp" },
  { href: "/collections/premium", label: "Premium", img: "/hero/image(2).webp" },
  { href: "/collections/summer-26", label: "Summer '26", img: "/hero/image(3).webp" },
];

const utilityLinks = [
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/account", label: "Account" },
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/policies", label: "Policies" },
];

function ArrowMarker() {
  return (
    <span className="hidden h-11 w-11 translate-x-2 items-center justify-center rounded-full border border-border opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:flex">
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}

export function Navbar() {
  const { totalItems, setIsOpen, isHydrated: isCartHydrated } = useCart();
  const { items: wishlistItems, isHydrated: isWishlistHydrated } = useWishlist();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState(overlayLinks[0].img);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const navContainerRef = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mainContainer = document.getElementById("main-content-container");
    const overlay = menuOverlayRef.current;
    const content = menuContentRef.current;
    if (!mainContainer || !overlay || !content || shouldReduceMotion) return;

    const links = gsap.utils.toArray<HTMLElement>("[data-xilar-menu-animate]");

    if (showMobileMenu) {
      gsap.killTweensOf([mainContainer, overlay, content, links]);

      gsap.to(mainContainer, {
        rotation: 10,
        x: 300,
        y: 450,
        scale: 1.5,
        duration: 1.25,
        ease: "power4.inOut",
      });

      gsap.to(content, {
        rotation: 0,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 1.25,
        ease: "power4.inOut",
      });

      gsap.to(links, {
        y: "0%",
        opacity: 1,
        delay: 0.55,
        duration: 1,
        stagger: 0.045,
        ease: "power3.out",
      });

      gsap.to(overlay, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 175%, 0% 100%)",
        duration: 1.25,
        ease: "power4.inOut",
      });
    } else {
      gsap.killTweensOf([mainContainer, overlay, content, links]);

      gsap.to(mainContainer, {
        rotation: 0,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.25,
        ease: "power4.inOut",
      });

      gsap.to(content, {
        rotation: -15,
        x: -100,
        y: -100,
        scale: 1.5,
        opacity: 0.25,
        duration: 1.25,
        ease: "power4.inOut",
      });

      gsap.to(overlay, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
        duration: 1.25,
        ease: "power4.inOut",
        onComplete: () => {
          gsap.set(links, { y: "120%", opacity: 0.25 });
        },
      });
    }
  }, { dependencies: [showMobileMenu, shouldReduceMotion], scope: navContainerRef });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAnnouncementIndex((current) => (current + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const rotateAnnouncement = (direction: 1 | -1) => {
    setAnnouncementIndex((current) => (
      current + direction + ANNOUNCEMENT_MESSAGES.length
    ) % ANNOUNCEMENT_MESSAGES.length);
  };

  useEffect(() => {
    if (!showMobileMenu) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => firstMenuLinkRef.current?.focus(), 120);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMobileMenu(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showMobileMenu]);

  return (
    <div ref={navContainerRef} className="contents">
      {/* Rotating announcement bar */}
      <div className="w-full bg-red-accent/8 border-b border-red-accent/10 py-1">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
          <button
            type="button"
            className="z-10 flex h-8 w-8 items-center justify-center text-red-accent/70 transition-colors duration-300 hover:text-red-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-accent/70"
            onClick={() => rotateAnnouncement(-1)}
            aria-label="Previous announcement"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="absolute left-1/2 top-1/2 h-7 w-[calc(100%-6rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden text-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={announcementIndex}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.45, ease: EASE_OUT_EXPO }}
                className="flex h-7 w-full min-w-0 items-center justify-center gap-2 text-[9px] font-medium uppercase tracking-[0.12em] text-red-accent sm:text-[10px] md:text-xs md:tracking-[0.15em]"
              >
                <Bot className="h-3 w-3 flex-none" />
                <span className="truncate">{ANNOUNCEMENT_MESSAGES[announcementIndex]}</span>
              </motion.p>
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="z-10 flex h-8 w-8 items-center justify-center text-red-accent/70 transition-colors duration-300 hover:text-red-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-accent/70"
            onClick={() => rotateAnnouncement(1)}
            aria-label="Next announcement"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 md:h-16 items-center px-4 md:px-6 lg:px-8">
          {/* Editorial Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-expanded={showMobileMenu}
            aria-controls="site-menu"
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
              { href: "/shop/accessories", label: "Accessories" },
              { href: "/new", label: "New Drop" },
              { href: "/collections/premium", label: "Collections" },
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
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors duration-300">
                <Package className="h-4 w-4" />
                <span className="sr-only">Orders</span>
              </Button>
            </Link>

            <Link href="/account" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors duration-300">
                <User className="h-4 w-4" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>

            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground transition-colors duration-300">
                <Heart className="h-4 w-4" />
                {isWishlistHydrated && wishlistItems.length > 0 && (
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
            >
              <ShoppingBag className="h-4 w-4" />
              {isCartHydrated && totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-accent text-white text-[10px] flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Left Editorial Menu */}
      <div
        ref={menuOverlayRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="fixed inset-0 z-[100] overflow-hidden bg-background text-foreground"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          pointerEvents: showMobileMenu ? "auto" : "none",
        }}
      >
        <div
          ref={menuContentRef}
          className="flex h-svh flex-col justify-between overflow-hidden px-5 py-5 md:px-10 md:py-6"
          style={{
            transform: "translateX(-100px) translateY(-100px) scale(1.5) rotate(-15deg)",
            opacity: 0.25,
            transformOrigin: "left bottom",
            willChange: "opacity, transform",
          }}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center" onClick={() => setShowMobileMenu(false)}>
              <Image
                src="/logo.png"
                alt="XILAR"
                width={160}
                height={40}
                className="h-8 w-auto object-contain dark:invert"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setShowMobileMenu(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid min-h-0 flex-1 content-center gap-5 py-3 md:grid-cols-[0.85fr_1.15fr] md:items-stretch md:gap-12 md:py-6">
            <div className="relative hidden h-full overflow-hidden bg-muted md:block">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={previewImage}
                  initial={{ opacity: 0, scale: 1.14, rotate: 4 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.05, rotate: -3 }}
                  transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                  className="absolute inset-0"
                >
                  <Image src={previewImage} alt="" fill sizes="34vw" className="object-cover" />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div>
              <p
                data-xilar-menu-animate
                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.42em] text-muted-foreground md:mb-5"
                style={{ transform: "translateY(120%)", opacity: 0.25, willChange: "transform" }}
              >
                Discover
              </p>
              <nav className="flex flex-col">
                {overlayLinks.map((link, i) => (
                  <div
                    key={link.href}
                    className="overflow-hidden border-b border-border/70"
                  >
                    <Link
                      ref={i === 0 ? firstMenuLinkRef : undefined}
                      href={link.href}
                      data-xilar-menu-animate
                      className="group flex items-center justify-between py-2 font-display text-[clamp(2.65rem,13vw,5.4rem)] leading-[0.84] text-foreground transition-colors duration-500 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:py-3 md:text-5xl lg:text-6xl"
                      style={{
                        transform: "translateY(120%)",
                        opacity: 0.25,
                        display: "inline-flex",
                        width: "100%",
                        willChange: "transform",
                      }}
                      onPointerEnter={() => setPreviewImage(link.img)}
                      onFocus={() => setPreviewImage(link.img)}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <span>{link.label}</span>
                      <ArrowMarker />
                    </Link>
                  </div>
                ))}
              </nav>

              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] uppercase tracking-[0.18em] text-muted-foreground sm:grid-cols-3 md:text-xs md:tracking-[0.2em]">
                {utilityLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-xilar-menu-animate
                    className="w-fit transition-colors duration-300 hover:text-foreground"
                    style={{
                      transform: "translateY(120%)",
                      opacity: 0.25,
                      willChange: "transform",
                    }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-3 border-t border-border/70 pt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
            <Link
              href="/policies/shipping"
              data-xilar-menu-animate
              style={{ transform: "translateY(120%)", opacity: 0.25, willChange: "transform" }}
              onClick={() => setShowMobileMenu(false)}
              className="hover:text-foreground"
            >
              Shipping
            </Link>
            <span
              data-xilar-menu-animate
              style={{ transform: "translateY(120%)", opacity: 0.25, willChange: "transform" }}
              className="hidden sm:inline"
            >
              Lucknow / Streetwise Minimalism
            </span>
            <Link
              href="/gallery"
              data-xilar-menu-animate
              style={{ transform: "translateY(120%)", opacity: 0.25, willChange: "transform" }}
              onClick={() => setShowMobileMenu(false)}
              className="hover:text-foreground"
            >
              Open Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

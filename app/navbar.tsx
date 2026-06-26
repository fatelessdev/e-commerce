"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, ArrowRight, Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { getWishlistNavState } from "@/lib/actions/wishlist";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { ANNOUNCEMENT_MESSAGES } from "@/lib/constants";
import { normalizeProductImage } from "@/lib/image";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

function StaggeredTextRoll({ text, shouldReduceMotion }: { text: string; shouldReduceMotion: boolean | null }) {
  if (shouldReduceMotion) {
    return <span>{text}</span>;
  }

  const chars = text.split("");

  return (
    <span aria-label={text} className="inline-flex overflow-hidden">
      {chars.map((char, i) => {
        if (char === " ") {
          return <span key={i} aria-hidden="true">&nbsp;</span>;
        }

        const delayVars = {
          "--nav-roll-enter-delay": `${i * 12}ms`,
          "--nav-roll-exit-delay": `${(chars.length - 1 - i) * 10}ms`,
        } as CSSProperties;

        return (
          <span
            key={i}
            aria-hidden="true"
            className="relative inline-block h-[1.2em] overflow-hidden align-top"
            style={delayVars}
          >
            <span className="inline-block will-change-transform transition-transform delay-[var(--nav-roll-exit-delay)] duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-full group-hover:delay-[var(--nav-roll-enter-delay)]">
              {char}
            </span>
            <span className="absolute left-0 top-0 inline-block translate-y-full text-foreground will-change-transform transition-transform delay-[var(--nav-roll-exit-delay)] duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 group-hover:delay-[var(--nav-roll-enter-delay)]">
              {char}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function StaggeredAnnouncementText({
  text,
  shouldReduceMotion,
}: {
  text: string;
  shouldReduceMotion: boolean | null;
}) {
  if (shouldReduceMotion) {
    return <span>{text}</span>;
  }

  const words = text.split(" ");
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.03,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.015,
        staggerDirection: -1 as const,
      },
    },
  };

  const wordVariants = {
    hidden: {
      y: "100%",
      opacity: 0,
      filter: "blur(4px)",
    },
    visible: {
      y: "0%",
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1] as const, // ease-out-expo
      },
    },
    exit: {
      y: "-100%",
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="inline-flex items-center justify-center overflow-hidden py-1 gap-x-1 md:gap-x-1.5 text-[9px] font-normal uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600 sm:text-[10px] md:text-xs md:tracking-[0.26em] w-full max-w-full"
    >
      {words.map((word, idx) => (
        <span key={idx} className="relative inline-block overflow-hidden">
          <motion.span
            variants={wordVariants}
            className="inline-block whitespace-nowrap"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}


const overlayLinks = [
  { href: "/shop/men", label: "Men", img: "/hero/image(7).webp" },
  { href: "/shop/women", label: "Women", img: "/hero/image(12).webp" },
  { href: "/shop/accessories", label: "Accessories", img: "/hero/image(13).webp" },
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

const searchableCatalogPaths = new Set([
  "/shop",
  "/shop/men",
  "/shop/women",
  "/shop/accessories",
  "/collections/premium",
  "/new",
]);

type SearchSuggestion = {
  id: string;
  name: string;
  category: string;
  sellingPrice: string;
  images: string[];
};

function ArrowMarker() {
  return (
    <span className="hidden h-11 w-11 translate-x-2 items-center justify-center rounded-full border border-border opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:flex">
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}

function SearchChip({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="text-xs md:text-sm font-light tracking-wide text-foreground/75 hover:text-foreground bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60"
    >
      {children}
    </motion.button>
  );
}

function CatalogSearchOverlay({
  showSearch,
  setShowSearch,
  shouldReduceMotion,
}: {
  showSearch: boolean;
  setShowSearch: (open: boolean) => void;
  shouldReduceMotion: boolean | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSeed, setSearchSeed] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionTerms, setSuggestionTerms] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!showSearch) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSearch(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setShowSearch, showSearch]);

  useEffect(() => {
    if (!showSearch) return;

    setSearchSeed(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;

    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      html.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      window.scrollTo({ top: scrollY });
    };
  }, [showSearch]);

  const getSearchHref = (query: string) => {
    const targetPath = searchableCatalogPaths.has(pathname) ? pathname : "/shop";
    return `${targetPath}?search=${encodeURIComponent(query)}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(getSearchHref(searchQuery.trim()));
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    const query = debouncedSearchQuery.trim();
    if (!showSearch || !searchSeed) {
      setSuggestions([]);
      setSuggestionTerms([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    void (async () => {
      setIsLoadingSuggestions(true);
      try {
        const params = new URLSearchParams({
          q: query,
          seed: searchSeed,
        });
        const response = await fetch(`/api/search/suggestions?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch suggestions");
        const data = (await response.json()) as { products?: SearchSuggestion[]; terms?: string[] };
        setSuggestions(data.products || []);
        setSuggestionTerms(data.terms || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch search suggestions:", error);
          setSuggestions([]);
          setSuggestionTerms([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchQuery, searchSeed, showSearch]);

  return (
    <AnimatePresence>
      {showSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          style={{ willChange: "opacity" }}
          className="fixed inset-0 z-[110] flex flex-col overflow-y-auto overscroll-contain bg-background/95 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex justify-between items-center px-6 md:px-12 lg:px-16 h-20"
          >
            <div className="flex-1" />
            <div className="flex-1 flex justify-center">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light tracking-[0.25em]">Search</span>
            </div>
            <div className="flex-1 flex justify-end">
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => setShowSearch(false)} 
                className="p-2 -mr-2 rounded-md text-foreground/80 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60"
                aria-label="Close search"
              >
                <X className="h-6 w-6 stroke-[1.5]" />
              </motion.button>
            </div>
          </motion.div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
            <motion.form 
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: shouldReduceMotion ? 0.01 : 0.65, ease: EASE_OUT_EXPO }}
              onSubmit={handleSearchSubmit} 
              className="w-full max-w-3xl relative"
            >
              <input
                type="text"
                placeholder="WHAT ARE YOU LOOKING FOR?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search for products"
                className="w-full bg-transparent border-b border-foreground/20 text-3xl md:text-5xl lg:text-6xl uppercase font-light pb-4 outline-none transition-colors placeholder:text-muted-foreground/30 font-display"
              />
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: EASE_OUT_EXPO }}
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-foreground origin-left"
                style={{ willChange: "transform" }}
              />
              <motion.button 
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                type="submit" 
                className="absolute right-0 bottom-6 -mr-1 rounded-md p-1 text-foreground hover:text-red-accent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60"
                aria-label="Submit search"
              >
                <ArrowRight className="h-8 w-8 md:h-10 md:w-10 stroke-[1.5]" />
              </motion.button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: shouldReduceMotion ? 0.01 : 0.6, ease: EASE_OUT_EXPO }}
              className="mt-12 w-full max-w-3xl"
            >
              {searchQuery.trim().length >= 2 ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Top Matches</p>
                    {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {suggestions.length > 0 ? (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                      className="grid gap-3"
                    >
                      {suggestions.map((product) => (
                        <motion.div
                          key={product.id}
                          variants={{
                            hidden: { opacity: 0, y: 12, filter: shouldReduceMotion ? "blur(0px)" : "blur(8px)" },
                            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 25 } }
                          }}
                          style={{ willChange: "opacity, filter, transform" }}
                        >
                          <Link
                            href={`/product/${product.id}`}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery("");
                            }}
                            className="group grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border/70 pb-3 text-left"
                          >
                            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                              <Image
                                src={normalizeProductImage(product.images?.[0])}
                                alt={product.name}
                                fill
                                sizes="64px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                            <div className="min-w-0 transition-transform duration-300 group-hover:translate-x-1.5">
                              <p className="truncate text-sm font-medium uppercase tracking-[0.08em] text-foreground/70 transition-colors duration-300 group-hover:text-foreground">{product.name}</p>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{product.category}</p>
                            </div>
                            <p className="text-sm font-semibold tabular-nums text-foreground/70 transition-colors duration-300 group-hover:text-foreground">₹{Number(product.sellingPrice).toLocaleString("en-IN")}</p>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : !isLoadingSuggestions ? (
                    <p className="text-sm text-muted-foreground">No exact matches yet. View all results for broader matches.</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      router.push(getSearchHref(searchQuery.trim()));
                      setShowSearch(false);
                    }}
                    className="group inline-flex items-center gap-2 rounded-sm text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:text-red-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60"
                  >
                    View all results
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Trending Searches</p>
                  {suggestions.length > 0 && (
                    <motion.div
                      key={`trending-products-${suggestions.length}`}
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                      className="grid gap-3"
                    >
                      {suggestions.slice(0, 3).map((product) => (
                        <motion.div
                          key={product.id}
                          variants={{
                            hidden: { opacity: 0, y: 12, filter: shouldReduceMotion ? "blur(0px)" : "blur(8px)" },
                            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 25 } }
                          }}
                          style={{ willChange: "opacity, filter, transform" }}
                        >
                          <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery("");
                            }}
                            className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border/70 pb-3 text-left"
                          >
                            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                              <Image
                                src={normalizeProductImage(product.images?.[0])}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                            <div className="min-w-0 transition-transform duration-300 group-hover:translate-x-1.5">
                              <p className="truncate text-sm font-medium uppercase tracking-[0.08em] text-foreground/70 transition-colors duration-300 group-hover:text-foreground">{product.name}</p>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{product.category}</p>
                            </div>
                            <p className="text-sm font-semibold tabular-nums text-foreground/70 transition-colors duration-300 group-hover:text-foreground">₹{Number(product.sellingPrice).toLocaleString("en-IN")}</p>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  <motion.div
                    key={`trending-terms-${suggestionTerms.length}`}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.04 } }
                    }}
                    className="flex flex-wrap gap-2 md:gap-3 items-center"
                  >
                    {suggestionTerms.slice(0, 4).map((term) => (
                      <motion.div
                        key={term}
                        variants={{
                          hidden: { opacity: 0, scale: 0.95, filter: shouldReduceMotion ? "blur(0px)" : "blur(6px)" },
                          visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 350, damping: 25 } }
                        }}
                        style={{ willChange: "opacity, filter, transform" }}
                      >
                        <SearchChip
                          onClick={() => {
                            setSearchQuery(term);
                            router.push(getSearchHref(term));
                            setShowSearch(false);
                          }}
                        >
                          {term}
                        </SearchChip>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Navbar() {
  const { totalItems, setIsOpen, isHydrated: isCartHydrated } = useCart();
  const { data: wishlistNavState } = useQuery({
    queryKey: ["wishlist-nav"],
    queryFn: getWishlistNavState,
    staleTime: 1000 * 30,
  });
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const [previewImage, setPreviewImage] = useState(overlayLinks[0].img);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const navContainerRef = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  const [isAnnouncementInViewport, setIsAnnouncementInViewport] = useState(true);

  useGSAP(() => {
    const mainContainer = document.getElementById("main-content-container");
    const overlay = menuOverlayRef.current;
    const content = menuContentRef.current;
    if (!mainContainer || !overlay || !content) return;

    if (shouldReduceMotion) {
      if (showMobileMenu) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return;
    }

    const links = gsap.utils.toArray<HTMLElement>("[data-xilar-menu-animate]");

    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
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
          document.body.style.overflow = "";
        },
      });
    }
  }, { dependencies: [showMobileMenu, shouldReduceMotion], scope: navContainerRef });

  useGSAP(() => {
    const header = headerRef.current;
    if (!header) return;

    if (showMobileMenu || shouldReduceMotion) {
      gsap.to(header, {
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      const scrollY = window.scrollY;
      const headerHeight = header.offsetHeight;
      if (scrollY > 50) {
        gsap.to(header, {
          y: -headerHeight,
          duration: 0.5,
          ease: "power4.out",
        });
      } else {
        gsap.to(header, {
          y: 0,
          duration: 0.5,
          ease: "power4.out",
        });
      }
    }
  }, { dependencies: [showMobileMenu, shouldReduceMotion], scope: navContainerRef });

  useEffect(() => {
    const header = headerRef.current;
    if (!header || showMobileMenu || shouldReduceMotion) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerHeight = header.offsetHeight;

      if (scrollY <= 50) {
        gsap.to(header, {
          y: 0,
          duration: 0.8,
          ease: "power4.out",
        });
      } else if (scrollY < lastScrollY) {
        // Scrolling UP -> Reveal Navbar
        gsap.to(header, {
          y: 0,
          duration: 0.8,
          ease: "power4.out",
        });
      } else if (scrollY > lastScrollY) {
        // Scrolling DOWN -> Hide Navbar
        gsap.to(header, {
          y: -headerHeight,
          duration: 0.8,
          ease: "power4.out",
        });
      }
      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showMobileMenu, shouldReduceMotion]);

  useEffect(() => {
    const el = announcementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsAnnouncementInViewport(entry.isIntersecting);
    }, {
      threshold: 0
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isAnnouncementInViewport || showMobileMenu) return;

    const timer = window.setInterval(() => {
      setAnnouncementIndex((current) => (current + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isAnnouncementInViewport, showMobileMenu]);

  useEffect(() => {
    if (!showMobileMenu) return;

    if (showMobileMenu) {
      window.setTimeout(() => firstMenuLinkRef.current?.focus(), 120);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showMobileMenu]);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }
    window.dispatchEvent(new CustomEvent("xilar-mobile-menu", { detail: { open: showMobileMenu } }));
  }, [showMobileMenu]);

  return (
    <div ref={navContainerRef} className="contents">
      {/* Rotating announcement bar */}
      <div ref={announcementRef} className="w-full bg-[#0a0a0a] dark:bg-neutral-100 border-b border-white/[0.04] dark:border-neutral-200 py-1 select-none">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 md:px-8 h-7">
          <div className="h-7 w-full overflow-hidden text-center flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <StaggeredAnnouncementText
                key={announcementIndex}
                text={ANNOUNCEMENT_MESSAGES[announcementIndex]}
                shouldReduceMotion={shouldReduceMotion}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      <header ref={headerRef} className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-colors duration-500 hover:bg-background">
        <div className="flex h-14 md:h-20 items-center justify-between px-4 md:px-8 lg:px-12">
          
          {/* Left: Mobile Menu Toggle / Desktop Nav */}
          <div className="flex-1 flex items-center justify-start gap-4 lg:gap-8">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2"
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
                      <X className="h-5 w-5 stroke-[1.5]" />
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
                      <Menu className="h-5 w-5 stroke-[1.5]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Button>

            <button
              type="button"
              onClick={() => setShowSearch(true)}
              aria-label="Search products"
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors duration-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60 sm:hidden"
            >
              <Search className="h-4 w-4 stroke-[1.5]" />
            </button>

            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {[
                { href: "/shop/men", label: "For Him" },
                { href: "/shop/women", label: "For Her" },
                { href: "/new", label: "New Drop" },
                { href: "/collections/premium", label: "Collections" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative px-3 py-1.5 tracking-[0.15em] uppercase text-[11px] font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
                >
                  <StaggeredTextRoll text={link.label} shouldReduceMotion={shouldReduceMotion} />
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center justify-center">
            <span className="font-[family-name:var(--font-instrument-serif)] text-3xl md:text-4xl text-foreground">Xilar</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end space-x-1.5 lg:space-x-3.5">
            <ThemeToggleButton showLabel={false} variant="ghost" />

            <button
              type="button"
              onClick={() => setShowSearch(true)}
              aria-label="Search products"
              className="hidden h-9 w-9 items-center justify-center text-muted-foreground transition-colors duration-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60 sm:flex"
            >
              <Search className="h-4 w-4 stroke-[1.5]" />
            </button>

            <Link
              href="/account"
              className="group relative hidden px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:text-foreground sm:block"
            >
              <StaggeredTextRoll text="ACCOUNT" shouldReduceMotion={shouldReduceMotion} />
            </Link>

            <Link
              href="/wishlist"
              className="group relative hidden px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:text-foreground md:block"
            >
              <StaggeredTextRoll 
                text={`WISHLIST ${wishlistNavState?.count ? `(${wishlistNavState.count})` : ""}`}
                shouldReduceMotion={shouldReduceMotion} 
              />
            </Link>

            <button
              type="button"
              className="group relative px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:text-foreground"
              onClick={() => setIsOpen(true)}
            >
              <StaggeredTextRoll 
                text={`CART [${isCartHydrated ? totalItems : 0}]`} 
                shouldReduceMotion={shouldReduceMotion} 
              />
            </button>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <CatalogSearchOverlay
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          shouldReduceMotion={shouldReduceMotion}
        />
      </Suspense>

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
          willChange: "clip-path",
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
              <span className="font-[family-name:var(--font-instrument-serif)] text-3xl md:text-4xl text-foreground">Xilar</span>
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
                  style={{ willChange: "transform, opacity" }}
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

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const PANEL_TRANSITION = {
  duration: 0.46,
  ease: EASE_OUT_EXPO,
} as const;
const HERO_IMAGES = [
  {
    src: "/hero/newhero.jpeg",
    alt: "Model wearing a dark green number 9 varsity graphic tee",
    eyebrow: "Number 9 drop",
    title: "Varsity green tee",
    cta: "Shop graphic tees",
    href: "/shop/men",
  },
  {
    src: "/hero/newhero1.webp",
    alt: "Model wearing a white knit polo with striped short sleeves",
    eyebrow: "Clean collar edit",
    title: "Striped knit polo",
    cta: "Shop polos",
    href: "/shop/men",
  },
  {
    src: "/hero/newhero2.webp",
    alt: "Model wearing a beige palm-print polo with relaxed white trousers",
    eyebrow: "Sunlit summer fit",
    title: "Resort polo set",
    cta: "Shop summer fits",
    href: "/collections/summer-26",
  },
  {
    src: "/hero/newhero3.jpeg",
    alt: "Model wearing a brown oversized tee with a back graphic under red lighting",
    eyebrow: "Red room graphics",
    title: "Backprint brown tee",
    cta: "Shop backprints",
    href: "/shop/men",
  },
  {
    src: "/hero/newhero4.jpeg",
    alt: "Model wearing a black oversized graphic tee outside a XILAR storefront",
    eyebrow: "Storefront drop",
    title: "Gallery black tee",
    cta: "Shop new arrivals",
    href: "/new",
  },
  {
    src: "/hero/newhero5.jpeg",
    alt: "Model wearing an olive tee with tonal embossed back artwork",
    eyebrow: "Tonal streetwear",
    title: "Embossed olive tee",
    cta: "Shop premium tees",
    href: "/collections/premium",
  },
];

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const activeSlide = HERO_IMAGES[activeIndex];
  const heroRef = useRef<HTMLElement>(null);
  const [isInViewport, setIsInViewport] = useState(true);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInViewport(entry.isIntersecting);
    }, {
      threshold: 0.05 // Active when at least 5% is visible
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuToggle = (e: Event) => {
      setIsMenuOpen((e as CustomEvent).detail.open);
    };
    window.addEventListener("xilar-mobile-menu", handleMenuToggle);
    const timer = window.setTimeout(() => {
      setIsMenuOpen(document.body.classList.contains("mobile-menu-open"));
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("xilar-mobile-menu", handleMenuToggle);
    };
  }, []);

  useEffect(() => {
    if (!isInViewport || isMenuOpen) return;

    const timer = window.setTimeout(() => {
      setSlideDirection(1);
      setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [activeIndex, isInViewport, isMenuOpen]);

  const goToSlide = (index: number) => {
    const nextIndex = (index + HERO_IMAGES.length) % HERO_IMAGES.length;
    const forwardDistance = (nextIndex - activeIndex + HERO_IMAGES.length) % HERO_IMAGES.length;
    setSlideDirection(forwardDistance === 0 ? 1 : forwardDistance <= HERO_IMAGES.length / 2 ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  const getSlide = (offset: number) => HERO_IMAGES[(activeIndex + offset + HERO_IMAGES.length) % HERO_IMAGES.length];
  const visibleSlides = [getSlide(-1), activeSlide, getSlide(1)];

  return (
    <section ref={heroRef} className="relative w-full overflow-hidden bg-background">
      <div className="relative mx-auto min-h-[calc(100svh-7rem)] max-w-[1800px] overflow-hidden">
        <div className="absolute inset-0 hidden grid-cols-[0.34fr_0.92fr_0.34fr] gap-2 md:grid">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleSlides.map((slide, panelIndex) => {
              const isActive = panelIndex === 1;
              const shouldPrioritize = activeIndex === 0 && isActive;
              const targetIndex = panelIndex === 0
                ? activeIndex - 1
                : panelIndex === 2
                  ? activeIndex + 1
                  : activeIndex;

              return (
                <motion.div
                  key={slide.src}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.82, x: slideDirection > 0 ? 120 : -120 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82, x: slideDirection > 0 ? -120 : 120 }}
                  transition={shouldReduceMotion ? { duration: 0.01 } : PANEL_TRANSITION}
                  className="group relative min-h-[calc(100svh-8.5rem)] overflow-hidden bg-neutral-950 text-left will-change-transform"
                  onClick={() => {
                    if (!isActive) goToSlide(targetIndex);
                  }}
                  role={isActive ? undefined : "button"}
                  tabIndex={isActive ? undefined : 0}
                  onKeyDown={(event) => {
                    if (!isActive && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      goToSlide(targetIndex);
                    }
                  }}
                  aria-label={isActive ? undefined : `Show ${slide.title}`}
                >
                  <motion.div style={{ willChange: "transform" }} className="absolute inset-0">
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      sizes={isActive ? "(max-width: 768px) 100vw, 56vw" : "22vw"}
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.025]"
                      priority={shouldPrioritize}
                    />
                  </motion.div>
                  <div className={`absolute inset-0 z-10 ${isActive ? "bg-gradient-to-t from-black/76 via-black/24 to-black/8" : "bg-black/20"}`} />
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 z-20 touch-pan-y"
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.12}
                      onDragEnd={(_event, info) => {
                        if (info.offset.x < -45 || info.velocity.x < -300) {
                          setSlideDirection(1);
                          goToSlide(activeIndex + 1);
                        }
                        if (info.offset.x > 45 || info.velocity.x > 300) {
                          setSlideDirection(-1);
                          goToSlide(activeIndex - 1);
                        }
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {isActive ? (
                    <div className="absolute inset-x-0 bottom-0 z-30 px-6 pb-10 text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.45)] md:px-12 md:pb-14">
                      <motion.p
                        key={`${activeIndex}-eyebrow`}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.55, delay: 0.2, ease: EASE_OUT_EXPO }}
                        className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/75"
                      >
                        {activeSlide.eyebrow}
                      </motion.p>
                      <motion.h1
                        key={`${activeIndex}-title`}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.72, delay: 0.16, ease: EASE_OUT_EXPO }}
                        className="font-display max-w-2xl text-6xl leading-[0.86] md:text-8xl lg:text-9xl"
                      >
                        {activeSlide.title}
                      </motion.h1>
                      <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link href={activeSlide.href}>
                          <Button
                            size="lg"
                            className="group/cta h-13 rounded-full bg-white px-8 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-950 transition-all duration-500 hover:bg-red-accent hover:text-white"
                          >
                            {activeSlide.cta}
                            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-500 group-hover/cta:translate-x-1" />
                          </Button>
                        </Link>
                        <Link href="/shop">
                          <Button
                            size="lg"
                            variant="outline"
                            className="h-13 rounded-full border-white/35 bg-transparent px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white/70 hover:text-red-accent"
                          >
                            View all
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute bottom-8 left-6 z-30 text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">{slide.eyebrow}</p>
                      <p className="font-display mt-2 max-w-[12rem] text-3xl leading-none">{slide.title}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="absolute inset-0 overflow-hidden bg-neutral-950 md:hidden">
          <AnimatePresence initial={false} custom={slideDirection}>
            <motion.div
              key={activeSlide.src}
              custom={slideDirection}
              initial={shouldReduceMotion ? { opacity: 1 } : { x: `${slideDirection * 14}%`, opacity: 1, scale: 1.03 }}
              animate={{ x: "0%", opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: `${slideDirection * -14}%`, opacity: 1, scale: 0.985 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.46, ease: EASE_OUT_EXPO }}
              style={{ willChange: "transform, opacity" }}
              className="group absolute inset-0 min-h-[72svh] overflow-hidden bg-neutral-950 text-left"
            >
              <Image
                src={activeSlide.src}
                alt={activeSlide.alt}
                fill
                sizes="100vw"
                className="object-cover"
                priority={activeIndex === 0}
              />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/76 via-black/24 to-black/8" />
              <motion.div
                className="absolute inset-0 z-20 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_event, info) => {
                  if (info.offset.x < -45 || info.velocity.x < -300) {
                    setSlideDirection(1);
                    goToSlide(activeIndex + 1);
                  }
                  if (info.offset.x > 45 || info.velocity.x > 300) {
                    setSlideDirection(-1);
                    goToSlide(activeIndex - 1);
                  }
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 z-30 px-6 pb-10 text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.45)]">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/75">
                  {activeSlide.eyebrow}
                </p>
                <motion.h1
                  key={`${activeIndex}-mobile-title`}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.62, delay: 0.12, ease: EASE_OUT_EXPO }}
                  className="font-display max-w-2xl text-6xl leading-[0.86]"
                >
                  {activeSlide.title}
                </motion.h1>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={activeSlide.href}>
                    <Button
                      size="lg"
                      className="group/cta h-13 rounded-full bg-white px-8 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-950 transition-all duration-500 hover:bg-red-accent hover:text-white"
                    >
                      {activeSlide.cta}
                      <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-500 group-hover/cta:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-13 rounded-full border-white/35 bg-transparent px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white/70 hover:text-white"
                    >
                      View all
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {HERO_IMAGES.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === activeIndex ? "w-9 bg-white" : "w-1.5 bg-white/45 hover:bg-white/75"
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to hero slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-950 shadow-lg shadow-black/10 transition-transform duration-300 hover:scale-105 md:flex"
          onClick={() => goToSlide(activeIndex - 1)}
          aria-label="Previous hero slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-950 shadow-lg shadow-black/10 transition-transform duration-300 hover:scale-105 md:flex"
          onClick={() => goToSlide(activeIndex + 1)}
          aria-label="Next hero slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

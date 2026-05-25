"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const HERO_IMAGES = [
  {
    src: "/hero/image.webp",
    eyebrow: "New season",
    title: "Premium shirts",
    href: "/shop/men",
  },
  {
    src: "/hero/image(1).webp",
    eyebrow: "Everyday essentials",
    title: "Longlasting Attars",
    href: "/shop",
  },
  {
    src: "/hero/image(2).webp",
    eyebrow: "Clean fits",
    title: "Streetwear basics",
    href: "/collections/essentials",
  },
  {
    src: "/hero/image(3).webp",
    eyebrow: "Fresh drops",
    title: "New arrivals",
    href: "/new",
  },
  {
    src: "/hero/image(4).webp",
    eyebrow: "For him",
    title: "Premium polos",
    href: "/shop/men",
  },
  {
    src: "/hero/image(5).webp",
    eyebrow: "For him",
    title: "Finish the fit",
    href: "/shop/accessories",
  },
];

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const activeSlide = HERO_IMAGES[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideDirection(1);
      setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    const nextIndex = (index + HERO_IMAGES.length) % HERO_IMAGES.length;
    const forwardDistance = (nextIndex - activeIndex + HERO_IMAGES.length) % HERO_IMAGES.length;
    setSlideDirection(forwardDistance === 0 ? 1 : forwardDistance <= HERO_IMAGES.length / 2 ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  const getSlide = (offset: number) => HERO_IMAGES[(activeIndex + offset + HERO_IMAGES.length) % HERO_IMAGES.length];
  const visibleSlides = [getSlide(-1), activeSlide, getSlide(1)];

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative mx-auto grid min-h-[calc(100dvh-7rem)] max-w-[1800px] grid-cols-1 gap-2 overflow-hidden md:grid-cols-[0.34fr_0.92fr_0.34fr]">
        <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
          <motion.div
            key={activeIndex}
            custom={slideDirection}
            initial={shouldReduceMotion ? { opacity: 1 } : { x: `${slideDirection * 100}%`, opacity: 0.9 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: `${slideDirection * -100}%`, opacity: 0.9 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.82, ease: EASE_OUT_EXPO }}
            className="absolute inset-0 grid grid-cols-1 gap-2 md:grid-cols-[0.34fr_0.92fr_0.34fr]"
          >
            {visibleSlides.map((slide, panelIndex) => {
              const isActive = panelIndex === 1;
              const targetIndex = panelIndex === 0
                ? activeIndex - 1
                : panelIndex === 2
                  ? activeIndex + 1
                  : activeIndex;

              return (
                <div
                  key={`${slide.src}-${panelIndex}`}
                  className={`group relative min-h-[72dvh] overflow-hidden bg-neutral-950 text-left md:min-h-[calc(100dvh-8.5rem)] ${
                    isActive ? "" : "hidden md:block"
                  }`}
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
                <motion.div
                  key={slide.src}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ scale: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.82, ease: EASE_OUT_EXPO }}
                >
                  <Image
                    src={slide.src}
                    alt={slide.title}
                    fill
                    sizes={isActive ? "(max-width: 768px) 100vw, 56vw" : "22vw"}
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.025]"
                    priority={isActive}
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
                    // key={`${activeIndex}-eyebrow`}
                    // initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(4px)" }}
                    // animate={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_EXPO }}
                    // className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/75"
                  >
                    {activeSlide.eyebrow}
                  </motion.p>
                  <motion.h1
                    key={`${activeIndex}-title`}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.72, delay: 0.16, ease: EASE_OUT_EXPO }}
                    className="max-w-2xl text-5xl font-black uppercase leading-[0.86] tracking-tight md:text-7xl lg:text-8xl"
                  >
                    {activeSlide.title}
                  </motion.h1>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href={activeSlide.href}>
                      <Button
                        size="lg"
                        className="group/cta h-13 rounded-none bg-white px-8 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-950 transition-all duration-500 hover:bg-red-accent hover:text-white"
                      >
                        Shop now
                        <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-500 group-hover/cta:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href="/shop">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-13 rounded-none border-white/35 bg-transparent px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white/70 hover:text-white"
                      >
                        View all
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-8 left-6 z-30 text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">{slide.eyebrow}</p>
                  <p className="mt-2 max-w-[12rem] text-2xl font-black uppercase leading-none tracking-tight">{slide.title}</p>
                </div>
              )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

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

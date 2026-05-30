"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { normalizeProductImage } from "@/lib/image";

gsap.registerPlugin(ScrollTrigger);

export type GalleryBandItem = {
  src: string;
  alt: string;
};

const FALLBACK_IMAGES: GalleryBandItem[] = [
  { src: "/clothes/shirt1.jpeg", alt: "XILAR shirt" },
  { src: "/clothes/topwear-men1.jpeg", alt: "XILAR topwear" },
  { src: "/clothes/topwear-women.jpeg", alt: "XILAR womenswear" },
  { src: "/clothes/denim1.jpeg", alt: "XILAR denim" },
  { src: "/clothes/shirts8.jpeg", alt: "XILAR printed shirt" },
  { src: "/clothes/pants1.jpeg", alt: "XILAR pants" },
  { src: "/clothes/clothes4.jpeg", alt: "XILAR outfit" },
  { src: "/clothes/jackets-men1.jpeg", alt: "XILAR jacket" },
];

export function Dec2024GalleryBand({ items }: { items?: GalleryBandItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const resolvedItems = useMemo(() => {
    const clean = (items || [])
      .filter((item) => item.src)
      .map((item) => ({ ...item, src: normalizeProductImage(item.src) }));
    const source = clean.length > 0 ? clean : FALLBACK_IMAGES;
    const repeated: GalleryBandItem[] = [];
    while (repeated.length < 32) {
      repeated.push(...source);
    }
    return repeated.slice(0, 32);
  }, [items]);

  const [isVisible, setIsVisible] = useState(true);
  const scrollTriggersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!rootRef.current) return;

    const el = rootRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, {
      threshold: 0
    });

    observer.observe(el);

    if (shouldReduceMotion) {
      return () => observer.disconnect();
    }

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-xilar-origin-row]");
      const isMobileView = window.innerWidth <= 900;

      const getStartX = (index: number) => {
        const direction = index % 2 === 0 ? 1 : -1;
        return direction * (isMobileView ? 150 : 300);
      };

      rows.forEach((row, index) => {
        const startX = getStartX(index);
        gsap.set(row, { x: startX });

        const anim = gsap.to(row, {
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: isMobileView ? 0.5 : 1,
            onUpdate: (self) => {
              const moveAmount = startX * (1 - self.progress);
              gsap.set(row, {
                x: moveAmount,
              });
            },
          },
        });

        if (anim.scrollTrigger) {
          scrollTriggersRef.current.push(anim.scrollTrigger);
        }
      });
    }, rootRef);

    return () => {
      observer.disconnect();
      ctx.revert();
      scrollTriggersRef.current = [];
    };
  }, [shouldReduceMotion]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuToggle = (e: Event) => {
      setIsMenuOpen((e as CustomEvent).detail.open);
    };
    window.addEventListener("xilar-mobile-menu", handleMenuToggle);
    setIsMenuOpen(document.body.classList.contains("mobile-menu-open"));
    return () => window.removeEventListener("xilar-mobile-menu", handleMenuToggle);
  }, []);

  useEffect(() => {
    scrollTriggersRef.current.forEach((trigger) => {
      if (trigger) {
        if (isVisible && !isMenuOpen) {
          trigger.enable();
        } else {
          trigger.disable(false);
        }
      }
    });
  }, [isVisible, isMenuOpen]);

  const rows = [0, 1, 2, 3].map((row) => resolvedItems.slice(row * 8, row * 8 + 8));

  return (
    <section
      ref={rootRef}
      style={{ visibility: isVisible ? "visible" : "hidden" }}
      className="relative min-h-[78svh] overflow-hidden border-t border-border/60 bg-background px-6 py-16 text-foreground md:min-h-[94svh] md:px-12 md:py-24"
      aria-label="XILAR moving product gallery"
      data-cursor="explore"
      data-cursor-label="XILAR"
    >
      <div className="pointer-events-none absolute left-1/2 top-[56%] z-0 w-[220vw] -translate-x-1/2 -translate-y-1/2 rotate-[28deg] scale-125 md:top-1/2">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            data-xilar-origin-row
            style={{ willChange: "transform" }}
            className="relative mb-5 flex h-44 justify-center gap-5 md:h-72 md:gap-8"
          >
            {row.map((item, index) => (
              <div
                key={`${item.src}-${rowIndex}-${index}`}
                className="relative aspect-[4/5] h-full overflow-hidden bg-muted/30 shadow-2xl shadow-black/15"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 42vw, 24vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}


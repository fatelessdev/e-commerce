"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
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
  const cursorRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!rootRef.current || shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-xilar-origin-row]");
      const isMobile = window.innerWidth <= 900;

      rows.forEach((row, index) => {
        const startX = (index % 2 === 0 ? 1 : -1) * (isMobile ? 130 : 300);
        gsap.set(row, { x: startX });
        gsap.to(row, {
          x: 0,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: isMobile ? 0.5 : 1,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!cursorRef.current || shouldReduceMotion) return;

    const cursor = cursorRef.current;
    gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0.15, opacity: 0 });

    const onMove = (event: PointerEvent) => {
      gsap.to(cursor, {
        x: event.clientX,
        y: event.clientY,
        opacity: 1,
        duration: 0.45,
        ease: "power2.out",
      });
    };

    const onEnter = () => {
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" });
    };

    const onLeave = () => {
      gsap.to(cursor, { scale: 0.15, opacity: 0, duration: 0.35, ease: "power2.out" });
    };

    const root = rootRef.current;
    root?.addEventListener("pointerenter", onEnter);
    root?.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      root?.removeEventListener("pointerenter", onEnter);
      root?.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onMove);
    };
  }, [shouldReduceMotion]);

  const rows = [0, 1, 2, 3].map((row) => resolvedItems.slice(row * 8, row * 8 + 8));

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100svh] overflow-hidden border-t border-border/60 bg-background px-6 py-20 text-foreground md:px-12 md:py-28"
    >
      {!shouldReduceMotion && (
        <div
          ref={cursorRef}
          className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-20 w-20 items-center justify-center rounded-full bg-white text-neutral-950 shadow-2xl mix-blend-difference md:flex"
          aria-hidden="true"
        >
          <ArrowRight className="h-5 w-5" />
        </div>
      )}

      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.95fr_1fr] md:items-end">
        <div className="max-w-[42rem]">
          <p
            className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground"
            style={{ textShadow: "0 1px 18px var(--background), 0 0 2px var(--background)" }}
          >
            <ArrowRight className="h-3 w-3" />
            XILAR Spirit
          </p>
          <p
            className="text-2xl font-medium leading-[1.35] text-foreground md:text-4xl"
            style={{ textShadow: "0 2px 24px var(--background), 0 0 3px var(--background)" }}
          >
            The XILAR spirit is movement without excess. Whether you are finding your first uniform, rebuilding your
            daily rotation, or returning to the pieces that feel like you, the fit stays sharp and the signal stays calm.
          </p>
        </div>
        <h2
          className="font-display text-5xl leading-[0.92] text-foreground md:text-7xl lg:text-8xl"
          style={{ textShadow: "0 2px 28px var(--background), 0 0 4px var(--background)" }}
        >
          From corners of the street, we are united by style.
        </h2>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[58%] z-0 w-[220vw] -translate-x-1/2 -translate-y-1/2 rotate-[28deg] scale-125 md:top-1/2">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            data-xilar-origin-row
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

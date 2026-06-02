"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";

const DEFAULT_ITEMS = [
  "Future Wear",
  "New Drops",
  "Bargain Smarter",
  "Free Shipping Above Rs. 999",
];

function ArrowGlyph() {
  return (
    <span
      className="mx-5 inline-flex h-8 w-6 shrink-0 items-center justify-center md:mx-8 md:h-11 md:w-8"
      aria-hidden="true"
    >
      <svg viewBox="0 0 72 100" className="h-full w-full fill-current">
        <path d="M70.4,58.9L70.1,57l-0.2-0.9c0,0,0,0,0,0l-0.2-0.9c-18.7,3.4-27.6,13.4-31.9,22.7V3h-0.9H35h-0.9v75.3c-4.2-9.7-13.2-20.2-31.9-23.2L1.9,57L1.7,58c0,0,0,0,0,0l-0.1,0.9c28.7,4.5,32.2,27.6,32.5,35.3c-0.1,1.7,0,2.7,0,2.8l0.9-0.1v0l0.5,0l2.4,0.1c0,0,0-0.6,0-1.5v-2.5C38.4,84.4,42.5,63.9,70.4,58.9z" />
      </svg>
    </span>
  );
}

export function DirectionalMarquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lastScrollRef = useRef(0);
  const shouldReduceMotion = useReducedMotion();
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion || !rootRef.current) return;

    const track = rootRef.current.querySelector<HTMLElement>("[data-marquee-track]");
    const arrows = rootRef.current.querySelectorAll<HTMLElement>("[data-marquee-arrow]");

    if (!track) return;

    gsap.set(track, { xPercent: 0 });
    tweenRef.current = gsap.to(track, {
      xPercent: -50,
      repeat: -1,
      duration: 16,
      ease: "none",
    });

    const onScroll = () => {
      const isScrollingDown = window.scrollY > lastScrollRef.current;
      gsap.to(tweenRef.current, { timeScale: isScrollingDown ? 1 : -1, duration: 0.6 });
      arrows.forEach((arrow) => {
        arrow.dataset.active = isScrollingDown ? "false" : "true";
        arrow.style.transform = isScrollingDown ? "rotate(90deg)" : "rotate(-90deg)";
      });
      lastScrollRef.current = window.scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(([entry]) => {
      isIntersectingRef.current = entry.isIntersecting;
      if (entry.isIntersecting && !document.body.classList.contains("mobile-menu-open")) {
        tweenRef.current?.play();
      } else {
        tweenRef.current?.pause();
      }
    }, {
      threshold: 0.05 // Active when at least 5% is visible
    });

    observer.observe(rootRef.current);

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    const handleMenuToggle = (e: Event) => {
      const isMenuOpen = (e as CustomEvent).detail.open;
      if (isMenuOpen) {
        tweenRef.current?.pause();
      } else if (isIntersectingRef.current) {
        tweenRef.current?.play();
      }
    };
    window.addEventListener("xilar-mobile-menu", handleMenuToggle);
    return () => {
      window.removeEventListener("xilar-mobile-menu", handleMenuToggle);
    };
  }, []);

  const sequence = [...items, ...items];

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden border-y border-border/70 bg-foreground py-3 text-background md:py-4"
      aria-label="XILAR highlights"
    >
      <div data-marquee-track className="flex w-fit flex-row whitespace-nowrap will-change-transform">
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0 items-center">
            {sequence.map((item, index) => (
              <div
                key={`${group}-${item}-${index}`}
                className="flex shrink-0 items-center text-2xl font-black uppercase leading-none tracking-normal md:text-5xl lg:text-6xl"
              >
                <span>{item}</span>
                <span
                  data-marquee-arrow
                  className="inline-flex transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ transform: "rotate(90deg)" }}
                >
                  <ArrowGlyph />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

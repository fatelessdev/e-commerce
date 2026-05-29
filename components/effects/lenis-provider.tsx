"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";

const easeOutExpo = (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t));

export function LenisProvider({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const lenisRef = useRef<LenisRef | null>(null);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 1000);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return children;

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        duration: isMobile ? 0.78 : 1.12,
        easing: easeOutExpo,
        gestureOrientation: "vertical",
        orientation: "vertical",
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: isMobile ? 1.45 : 1.9,
        wheelMultiplier: 1,
      }}
    >
      {children}
    </ReactLenis>
  );
}


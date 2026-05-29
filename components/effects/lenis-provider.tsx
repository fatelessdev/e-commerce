"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

const easeOutExpo = (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t));

export function LenisProvider({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 1000);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  if (shouldReduceMotion) return children;

  return (
    <ReactLenis
      root
      options={{
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

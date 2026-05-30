"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";

/*──────────────────────────────────────────────────────────────────────────────
  CursorDot — Global interactive cursor follower
  ─────────────────────────────────────────────────────────────────────────────
  States:
    default   — small dot (10px)
    pointer   — expanded ring (40px) for links / buttons / interactive elements
    explore   — large circle (80px) with contextual label, for gallery / special sections
    text      — thin vertical bar for text inputs
    hidden    — invisible (for elements that manage their own cursor)
  
  Opt-in via data attributes on any ancestor:
    data-cursor="pointer"  |  data-cursor="explore"  |  data-cursor="text"  |  data-cursor="none"
    data-cursor-label="..."  — custom text inside the explore circle
    data-cursor-magnetic     — subtle magnetic pull toward element center

  Desktop only (hidden on touch / small screens). Respects prefers-reduced-motion.
──────────────────────────────────────────────────────────────────────────────*/

type CursorState = "default" | "pointer" | "explore" | "text" | "hidden";

// Elements that naturally trigger the "pointer" cursor state
const POINTER_SELECTOR = 'a, button, [role="button"], label[for], summary, [data-cursor="pointer"]';

function resolveCursorState(target: HTMLElement): { state: CursorState; label: string | null; magnetic: HTMLElement | null } {
  let el: HTMLElement | null = target;
  let label: string | null = null;
  let magnetic: HTMLElement | null = null;

  while (el && el !== document.body) {
    // Explicit data-cursor always wins
    const cursor = el.getAttribute("data-cursor");
    if (cursor === "none") return { state: "hidden", label: null, magnetic: null };
    if (cursor === "explore") {
      label = el.getAttribute("data-cursor-label") || null;
      return { state: "explore", label, magnetic: null };
    }
    if (cursor === "text") return { state: "text", label: null, magnetic: null };
    if (cursor === "pointer") {
      magnetic = el.hasAttribute("data-cursor-magnetic") ? el : null;
      return { state: "pointer", label: null, magnetic };
    }

    // Check natural interactive elements
    if (el.matches(POINTER_SELECTOR)) {
      magnetic = el.hasAttribute("data-cursor-magnetic") ? el : null;
      return { state: "pointer", label: null, magnetic };
    }

    // Input / textarea → text state
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const type = el.getAttribute("type");
      if (!type || type === "text" || type === "email" || type === "password" || type === "search" || type === "url" || type === "tel" || type === "number") {
        return { state: "text", label: null, magnetic: null };
      }
    }

    el = el.parentElement;
  }

  return { state: "default", label: null, magnetic: null };
}

export function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Skip on admin pages
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    // Only mount on desktop devices with fine pointer
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(pointer: fine)");
    if (!mql.matches) return;
    setMounted(true);

    const onChange = (e: MediaQueryListEvent) => setMounted(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mounted || shouldReduceMotion || isAdmin) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring) return;

    // Add cursor-hidden class to body
    document.body.classList.add("xilar-custom-cursor");

    let currentState: CursorState = "default";
    let mouseX = -100;
    let mouseY = -100;
    let isVisible = false;

    // Initial position off-screen
    gsap.set(dot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    gsap.set(ring, { xPercent: -50, yPercent: -50, x: -100, y: -100, scale: 0, opacity: 0 });

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        gsap.to(dot, { opacity: 1, duration: 0.3, ease: "power2.out" });
      }

      // Dot follows tightly
      gsap.to(dot, {
        x: mouseX,
        y: mouseY,
        duration: 0.15,
        ease: "power2.out",
        overwrite: "auto",
      });

      // Ring follows with more lag for fluid feel
      gsap.to(ring, {
        x: mouseX,
        y: mouseY,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const applyState = (state: CursorState, labelText: string | null, magneticEl: HTMLElement | null) => {
      if (state === currentState && state !== "explore") return;
      currentState = state;

      switch (state) {
        case "default":
          gsap.to(dot, { width: 10, height: 10, opacity: 0.85, duration: 0.35, ease: "power3.out" });
          gsap.to(ring, { scale: 0, opacity: 0, duration: 0.3, ease: "power3.out" });
          if (label) label.textContent = "";
          break;

        case "pointer":
          gsap.to(dot, { width: 6, height: 6, opacity: 1, duration: 0.35, ease: "power3.out" });
          gsap.to(ring, { scale: 1, opacity: 1, width: 44, height: 44, duration: 0.4, ease: "back.out(1.4)" });
          if (label) label.textContent = "";
          break;

        case "explore":
          gsap.to(dot, { width: 6, height: 6, opacity: 0, duration: 0.25, ease: "power2.out" });
          gsap.to(ring, { scale: 1, opacity: 1, width: 88, height: 88, duration: 0.5, ease: "back.out(1.2)" });
          if (label) {
            label.textContent = labelText || "EXPLORE";
            gsap.fromTo(label, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, delay: 0.1, ease: "power2.out" });
          }
          break;

        case "text":
          gsap.to(dot, { width: 3, height: 22, opacity: 0.8, borderRadius: 1, duration: 0.3, ease: "power3.out" });
          gsap.to(ring, { scale: 0, opacity: 0, duration: 0.25, ease: "power3.out" });
          if (label) label.textContent = "";
          break;

        case "hidden":
          gsap.to(dot, { opacity: 0, duration: 0.2, ease: "power2.out" });
          gsap.to(ring, { scale: 0, opacity: 0, duration: 0.2, ease: "power2.out" });
          if (label) label.textContent = "";
          break;
      }
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const { state, label: labelText, magnetic } = resolveCursorState(target);
      applyState(state, labelText, magnetic);

      // Magnetic pull
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        gsap.to(ring, {
          x: cx,
          y: cy,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };

    const onOut = (e: PointerEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || related === document.documentElement) {
        // Cursor left the window
        isVisible = false;
        gsap.to(dot, { opacity: 0, duration: 0.3, ease: "power2.out" });
        gsap.to(ring, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.out" });
        currentState = "default";
        return;
      }
      const { state, label: labelText, magnetic } = resolveCursorState(related);
      applyState(state, labelText, magnetic);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.body.classList.remove("xilar-custom-cursor");
      gsap.killTweensOf([dot, ring]);
    };
  }, [mounted, shouldReduceMotion, isAdmin]);

  if (!mounted || shouldReduceMotion || isAdmin) return null;

  return createPortal(
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[10001] hidden md:block"
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: "white",
          mixBlendMode: "difference",
          opacity: 0,
          willChange: "transform",
        }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[10000] hidden items-center justify-center md:flex"
        aria-hidden="true"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1.5px solid white",
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      >
        <span
          ref={labelRef}
          className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white select-none"
          style={{ mixBlendMode: "difference" }}
        />
      </div>
    </>,
    document.body,
  );
}

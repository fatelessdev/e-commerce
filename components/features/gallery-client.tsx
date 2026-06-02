"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { CustomEase } from "gsap/dist/CustomEase";
import { X, ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { normalizeProductImage } from "@/lib/image";

export type XilarGalleryItem = {
  id: string;
  title: string;
  src: string;
  href: string;
  price?: string;
};


const FALLBACK_ITEMS: XilarGalleryItem[] = [
  { id: "fallback-shirt", title: "XILAR Shirt", src: "/clothes/shirt1.jpeg", href: "/shop" },
  { id: "fallback-topwear", title: "XILAR Topwear", src: "/clothes/topwear-men1.jpeg", href: "/shop" },
  { id: "fallback-denim", title: "XILAR Denim", src: "/clothes/denim1.jpeg", href: "/shop" },
  { id: "fallback-printed", title: "XILAR Printed Shirt", src: "/clothes/shirts8.jpeg", href: "/shop" },
  { id: "fallback-jacket", title: "XILAR Jacket", src: "/clothes/jackets-men1.jpeg", href: "/shop" },
  { id: "fallback-women", title: "XILAR Womenswear", src: "/clothes/topwear-women.jpeg", href: "/shop" },
];

const ITEM_WIDTH = 126;
const ITEM_HEIGHT = 168;
const ITEM_GAP = 148;
function modulo(index: number, length: number) {
  return ((index % length) + length) % length;
}

function formatPrice(price?: string) {
  if (!price) return null;
  const parsed = Number(price);
  if (!Number.isFinite(parsed)) return null;
  return `Rs. ${parsed.toLocaleString("en-IN")}`;
}

export function GalleryClient({ items }: { items: XilarGalleryItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);
  const activeTextRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    startX: 0,
    startY: 0,
    dragVelocityX: 0,
    dragVelocityY: 0,
    lastDragTime: 0,
    lastX: 0,
    lastY: 0,
    lastUpdate: 0,
    isDragging: false,
    moved: false,
    canDrag: true,
    visibleTiles: new Set<string>(),
    activeKey: null as string | null,
  });

  const [active, setActive] = useState<{ item: XilarGalleryItem; rect: DOMRect; key: string } | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const introRanRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const galleryReady = introDone || shouldReduceMotion;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(CustomEase);
    CustomEase.create("hop", "0.9, 0, 0.1, 1");
  }, []);

  const galleryItems = useMemo(() => {
    const clean = items
      .filter((item) => item.src)
      .map((item) => ({ ...item, src: normalizeProductImage(item.src) }));
    return clean.length >= 6 ? clean : [...clean, ...FALLBACK_ITEMS];
  }, [items]);

  const updateVisibleTiles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cellWidth = ITEM_WIDTH + ITEM_GAP;
    const cellHeight = ITEM_HEIGHT + ITEM_GAP;
    const buffer = 1.6;

    const startCol = Math.floor((-state.currentX - width * buffer) / cellWidth);
    const endCol = Math.ceil((-state.currentX + width * (1 + buffer)) / cellWidth);
    const startRow = Math.floor((-state.currentY - height * buffer) / cellHeight);
    const endRow = Math.ceil((-state.currentY + height * (1 + buffer)) / cellHeight);

    const currentKeys = new Set<string>();

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        const key = `${col}:${row}`;
        currentKeys.add(key);

        if (state.visibleTiles.has(key)) continue;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = `tile-${key}`;
        btn.setAttribute("data-xilar-gallery-card", "true");
        btn.className = "absolute overflow-hidden bg-muted/40 text-left opacity-100 shadow-2xl shadow-black/10";
        
        const left = col * cellWidth;
        const top = row * cellHeight;
        btn.style.left = `${left}px`;
        btn.style.top = `${top}px`;
        btn.style.width = `${ITEM_WIDTH}px`;
        btn.style.height = `${ITEM_HEIGHT}px`;
        
        if (state.activeKey === key) {
          btn.style.visibility = "hidden";
        } else {
          btn.style.visibility = "visible";
        }

        const itemIndex = modulo(row * 5 + col, galleryItems.length);
        const item = galleryItems[itemIndex];

        const img = document.createElement("img");
        img.src = item.src;
        img.alt = item.title;
        img.className = "w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105";
        img.loading = "lazy";
        
        btn.appendChild(img);

        btn.addEventListener("click", () => {
          const s = stateRef.current;
          if (s.moved || s.isDragging || !s.canDrag) return;
          const rect = btn.getBoundingClientRect();
          setActive({ item, rect, key });
        });

        canvas.appendChild(btn);
        state.visibleTiles.add(key);
      }
    }

    state.visibleTiles.forEach((key) => {
      if (!currentKeys.has(key)) {
        const btn = document.getElementById(`tile-${key}`);
        if (btn && canvas.contains(btn)) {
          canvas.removeChild(btn);
        }
        state.visibleTiles.delete(key);
      }
    });
  }, [galleryItems]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.replaceChildren();
    }
    stateRef.current.visibleTiles.clear();

    updateVisibleTiles();

    if (!shouldReduceMotion && !introRanRef.current) {
      introRanRef.current = true;
      const allCards = gsap.utils.toArray<HTMLElement>("[data-xilar-gallery-card]");
      if (allCards.length > 0) {
        const state = stateRef.current;
        state.canDrag = false;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = width / 2 - ITEM_WIDTH / 2 - state.currentX;
        const centerY = height / 2 - ITEM_HEIGHT / 2 - state.currentY;

        const inViewport: HTMLElement[] = [];
        const outViewport: HTMLElement[] = [];

        allCards.forEach((card) => {
          const left = parseFloat(card.style.left) || 0;
          const top = parseFloat(card.style.top) || 0;
          if (
            left >= -ITEM_WIDTH &&
            left <= width &&
            top >= -ITEM_HEIGHT &&
            top <= height
          ) {
            inViewport.push(card);
          } else {
            outViewport.push(card);
          }
        });

        gsap.set(outViewport, {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          rotate: 0,
        });

        inViewport.forEach((card) => {
          const targetLeft = parseFloat(card.style.left) || 0;
          const targetTop = parseFloat(card.style.top) || 0;
          const startX = centerX - targetLeft;
          const startY = centerY - targetTop;

          gsap.set(card, {
            x: startX,
            y: startY,
            scale: 0,
            opacity: 0,
            rotate: () => (Math.random() - 0.5) * 35,
            transformOrigin: "50% 50%",
          });
        });

        const timeline = gsap.timeline({
          onComplete: () => {
            state.canDrag = true;
            setIntroDone(true);
          },
        });

        timeline.to(inViewport, {
          opacity: 1,
          scale: 2.2,
          duration: 0.65,
          stagger: 0.03,
          ease: "power2.out",
        });

        timeline.to(inViewport, {
          x: 0,
          y: 0,
          scale: 1,
          rotate: 0,
          duration: 1.25,
          stagger: 0.015,
          ease: "power4.inOut",
        }, "-=0.15");
      } else {
        Promise.resolve().then(() => setIntroDone(true));
      }
    } else {
      Promise.resolve().then(() => setIntroDone(true));
    }
  }, [updateVisibleTiles, shouldReduceMotion]);

  useEffect(() => {
    const state = stateRef.current;
    let frameId = 0;

    const animate = () => {
      if (canvasRef.current && state.canDrag) {
        state.currentX += (state.targetX - state.currentX) * 0.075;
        state.currentY += (state.targetY - state.currentY) * 0.075;
        canvasRef.current.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;

        const now = Date.now();
        const moved = Math.hypot(state.currentX - state.lastX, state.currentY - state.lastY);
        if (moved > 100 || now - state.lastUpdate > 140) {
          updateVisibleTiles();
          state.lastX = state.currentX;
          state.lastY = state.currentY;
          state.lastUpdate = now;
        }
      }
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    const handleResize = () => {
      updateVisibleTiles();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateVisibleTiles]);

  useEffect(() => {
    if (active) {
      stateRef.current.activeKey = active.key;
      const activeEl = document.getElementById(`tile-${active.key}`);
      if (activeEl) {
        activeEl.style.visibility = "hidden";
      }
    } else {
      const prevKey = stateRef.current.activeKey;
      if (prevKey) {
        const activeEl = document.getElementById(`tile-${prevKey}`);
        if (activeEl) {
          activeEl.style.visibility = "visible";
        }
        stateRef.current.activeKey = null;
      }
    }
  }, [active]);



  useEffect(() => {
    if (!active) return;

    const documentElement = document.documentElement;
    const body = document.body;
    const previousDocumentOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;

    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      documentElement.style.overflow = previousDocumentOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !activeCardRef.current || shouldReduceMotion) return;

    const card = activeCardRef.current;
    const text = activeTextRef.current;
    const isMobile = window.innerWidth < 768;
    const targetWidth = isMobile
      ? window.innerWidth
      : Math.min(window.innerWidth * 0.4, Math.max(0, (window.innerHeight - 64) / 1.2));
    const targetHeight = isMobile
      ? window.innerHeight
      : targetWidth * 1.2;
    const targetLeft = (window.innerWidth - targetWidth) / 2;
    const targetTop = (window.innerHeight - targetHeight) / 2;

    gsap.killTweensOf([card, text, "[data-xilar-gallery-card]"]);

    const timeline = gsap.timeline();

    timeline.to("[data-xilar-gallery-card]", {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    }, 0);

    timeline.fromTo(
      card,
      {
        width: active.rect.width,
        height: active.rect.height,
        x: active.rect.left,
        y: active.rect.top,
        opacity: 1,
      },
      {
        width: targetWidth,
        height: targetHeight,
        x: targetLeft,
        y: targetTop,
        duration: 1,
        ease: "hop",
      },
      0,
    );

    if (text) {
      const words = text.querySelectorAll("[data-gallery-word]");
      const details = text.querySelectorAll("[data-gallery-detail]");

      const textBottom = isMobile
        ? "calc(20px + env(safe-area-inset-bottom, 0px))"
        : (window.innerHeight - targetTop - targetHeight);
      gsap.set(text, {
        visibility: "visible",
        opacity: 1,
        left: targetLeft,
        right: window.innerWidth - targetLeft - targetWidth,
        bottom: textBottom,
      });

      gsap.set(words, { yPercent: 110 });
      gsap.set(details, { y: 18, opacity: 0 });

      timeline.to(words, {
        yPercent: 0,
        duration: 0.95,
        stagger: 0.08,
        ease: "power3.out",
      }, 0.58);
      timeline.to(details, {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      }, 0.76);
    }

    return () => {
      timeline.kill();
    };
  }, [active, shouldReduceMotion]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state.canDrag) return;
    state.isDragging = true;
    state.moved = false;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.lastDragTime = Date.now();
    if (!(event.target as HTMLElement).closest("[data-xilar-gallery-card]")) {
      containerRef.current?.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state.isDragging || !state.canDrag) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) state.moved = true;

    const now = Date.now();
    const dt = Math.max(10, now - state.lastDragTime);
    state.dragVelocityX = dx / dt;
    state.dragVelocityY = dy / dt;
    state.lastDragTime = now;
    state.targetX += dx;
    state.targetY += dy;
    state.startX = event.clientX;
    state.startY = event.clientY;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state.isDragging) return;
    state.isDragging = false;
    if (containerRef.current?.hasPointerCapture(event.pointerId)) {
      containerRef.current.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(state.dragVelocityX) > 0.1 || Math.abs(state.dragVelocityY) > 0.1) {
      state.targetX += state.dragVelocityX * 210;
      state.targetY += state.dragVelocityY * 210;
    }
  };

  const closeActive = useCallback(() => {
    if (!active) return;
    const card = activeCardRef.current;
    const text = activeTextRef.current;
    const overlay = overlayRef.current;

    if (!card || shouldReduceMotion) {
      setActive(null);
      return;
    }

    gsap.killTweensOf([card, text, overlay]);

    const words = text?.querySelectorAll("[data-gallery-word]") ?? [];
    const details = text?.querySelectorAll("[data-gallery-detail]") ?? [];
    const timeline = gsap.timeline({
      onComplete: () => {
        setActive(null);
      },
    });

    timeline.to(words, {
      yPercent: -110,
      duration: 0.38,
      stagger: 0.03,
      ease: "power3.in",
    }, 0);
    timeline.to(details, {
      y: -12,
      opacity: 0,
      duration: 0.26,
      stagger: 0.025,
      ease: "power2.in",
    }, 0);
    timeline.to(text, { opacity: 0, duration: 0.18, ease: "power2.out" }, 0.32);

    // Fade gallery tiles back to visible (they were set to opacity:0 on expand)
    timeline.to("[data-xilar-gallery-card]", {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    }, 0.55);

    timeline.to(card, {
      width: active.rect.width,
      height: active.rect.height,
      x: active.rect.left,
      y: active.rect.top,
      duration: 1,
      ease: "hop",
    }, 0.44);
  }, [active, shouldReduceMotion]);

  useEffect(() => {
    if (!active) return;
    const state = stateRef.current;
    state.canDrag = false;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeActive();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      state.canDrag = true;
    };
  }, [active, closeActive]);

  const activePrice = formatPrice(active?.item.price);
  const portalTarget = typeof document === "undefined" ? null : document.body;

  const overlay = active ? (
    <div ref={overlayRef} style={{ willChange: "opacity" }} className="fixed inset-0 z-[80] bg-background/96" onClick={closeActive}>
      <div
        ref={activeCardRef}
        className="fixed overflow-hidden bg-muted shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
        style={
          shouldReduceMotion
            ? (isMobile
                ? {
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                  }
                : {
                    left: "50%",
                    top: "50%",
                    width: "84vw",
                    height: "70svh",
                    transform: "translate(-50%, -50%)",
                  })
            : {
                left: 0,
                top: 0,
                transform: `translate(${active.rect.left}px, ${active.rect.top}px)`,
                width: active.rect.width,
                height: active.rect.height,
                willChange: "transform, width, height",
              }
        }
      >
        <Image
          src={active.item.src}
          alt={active.item.title}
          fill
          sizes={isMobile ? "100vw" : "84vw"}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-black/10" />
        <button
          type="button"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-950 transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
          onClick={closeActive}
          aria-label="Close gallery image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={activeTextRef}
        className="fixed z-[81] pointer-events-none p-5 text-white"
        style={
          shouldReduceMotion
            ? (isMobile
                ? { left: "20px", right: "20px", bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }
                : { left: "50%", right: "auto", bottom: "12svh", transform: "translateX(-50%)" })
            : { visibility: "hidden" }
        }
        onClick={(event) => event.stopPropagation()}
      >
        <p data-gallery-detail className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/65">
          {activePrice || "XILAR"}
        </p>
        <h2 className="font-display mt-2 text-4xl leading-none md:text-5xl" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)" }}>
          {active.item.title.split(" ").map((word, index) => (
            <span key={`${word}-${index}`} data-gallery-word className="mr-[0.16em] inline-block will-change-transform">
              {word}
            </span>
          ))}
        </h2>
        <Button
          data-gallery-detail
          asChild
          className="mt-5 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950 pointer-events-auto hover:bg-red-accent hover:text-white"
        >
          <Link href={active.item.href}>
            Shop product
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100svh-7rem)] cursor-grab overflow-hidden bg-background active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        ref={canvasRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ pointerEvents: galleryReady ? "auto" : "none" }}
      />

      {portalTarget && overlay ? createPortal(overlay, portalTarget) : null}
    </div>
  );
}

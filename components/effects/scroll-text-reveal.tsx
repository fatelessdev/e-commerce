"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type ScrollTextRevealProps = {
  text: string;
  className?: string;
  initialColor?: string;
  accentColor?: string;
  finalColor?: string;
};

type ScrollTextRevealStackProps = {
  sentences: string[];
  className?: string;
  sentenceClassName?: string;
  initialColor?: string;
  accentColor?: string;
  finalColor?: string;
};

export function ScrollTextReveal({
  text,
  className,
  initialColor = "var(--muted-foreground)",
  accentColor = "var(--red)",
  finalColor = "var(--foreground)",
}: ScrollTextRevealProps) {
  const rootRef = useRef<HTMLParagraphElement>(null);
  const charRefs = useRef<HTMLSpanElement[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const chars = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    if (shouldReduceMotion || !rootRef.current) return;

    const root = rootRef.current;
    const allChars = charRefs.current.filter(Boolean);
    const completed = new Set<number>();
    const timers = new Map<number, number>();
    let lastProgress = 0;

    gsap.set(allChars, { color: initialColor });

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top 88%",
      end: "bottom 35%",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const currentIndex = Math.floor(progress * allChars.length);
        const isForward = progress >= lastProgress;

        allChars.forEach((char, index) => {
          if (!isForward && index >= currentIndex) {
            const timer = timers.get(index);
            if (timer) window.clearTimeout(timer);
            timers.delete(index);
            completed.delete(index);
            gsap.set(char, { color: initialColor });
            return;
          }

          if (completed.has(index)) return;

          if (index <= currentIndex) {
            gsap.set(char, { color: accentColor });
            if (!timers.has(index)) {
              const timer = window.setTimeout(() => {
                gsap.to(char, {
                  color: finalColor,
                  duration: 0.16,
                  ease: "none",
                  onComplete: () => completed.add(index),
                });
                timers.delete(index);
              }, 90);
              timers.set(index, timer);
            }
          } else {
            gsap.set(char, { color: initialColor });
          }
        });

        lastProgress = progress;
      },
    });

    return () => {
      trigger.kill();
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [accentColor, finalColor, initialColor, shouldReduceMotion]);

  return (
    <p ref={rootRef} className={cn("text-muted-foreground", className)}>
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          ref={(node) => {
            if (node) charRefs.current[index] = node;
          }}
          className="transition-colors duration-150"
          aria-hidden="true"
        >
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </p>
  );
}

export function ScrollTextRevealStack({
  sentences,
  className,
  sentenceClassName,
  initialColor = "var(--muted-foreground)",
  accentColor = "var(--red)",
  finalColor = "var(--foreground)",
}: ScrollTextRevealStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !rootRef.current) return;

    const root = rootRef.current;
    const allChars = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-reveal-char]"));
    const completed = new Set<number>();
    const timers = new Map<number, number>();
    let lastProgress = 0;

    gsap.set(allChars, { color: initialColor });

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top 70%",
      end: "bottom 30%",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const currentIndex = Math.floor(progress * allChars.length);
        const isForward = progress >= lastProgress;

        allChars.forEach((char, index) => {
          if (!isForward && index >= currentIndex) {
            const timer = timers.get(index);
            if (timer) window.clearTimeout(timer);
            timers.delete(index);
            completed.delete(index);
            gsap.set(char, { color: initialColor });
            return;
          }

          if (completed.has(index)) return;

          if (index <= currentIndex) {
            gsap.set(char, { color: accentColor });
            if (!timers.has(index)) {
              const timer = window.setTimeout(() => {
                gsap.to(char, {
                  color: finalColor,
                  duration: 0.14,
                  ease: "none",
                  onComplete: () => completed.add(index),
                });
                timers.delete(index);
              }, 85);
              timers.set(index, timer);
            }
          } else {
            gsap.set(char, { color: initialColor });
          }
        });

        lastProgress = progress;
      },
    });

    return () => {
      trigger.kill();
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [accentColor, finalColor, initialColor, shouldReduceMotion]);

  return (
    <div ref={rootRef} className={cn("space-y-9", className)}>
      {sentences.map((sentence, sentenceIndex) => (
        <p key={sentence} className={cn("text-muted-foreground", sentenceClassName)}>
          {Array.from(sentence).map((char, charIndex) => (
            <span
              key={`${sentenceIndex}-${char}-${charIndex}`}
              data-scroll-reveal-char
              aria-hidden="true"
              className="transition-colors duration-150"
            >
              {char === " " ? "\u00a0" : char}
            </span>
          ))}
          <span className="sr-only">{sentence}</span>
        </p>
      ))}
    </div>
  );
}

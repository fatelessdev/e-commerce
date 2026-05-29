"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, SplitText);

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
  const shouldReduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (shouldReduceMotion || !rootRef.current) return;

      const completedChars = new Set<number>();
      const colorTransitionTimers = new Map<number, number>();
      const wordSplit = SplitText.create(rootRef.current, {
        type: "words",
        wordsClass: "word",
      });
      const charSplit = SplitText.create(wordSplit.words, {
        type: "chars",
        charsClass: "char",
      });
      const allChars = charSplit.chars as HTMLElement[];
      let lastScrollProgress = 0;

      // 0 = initial, 1 = accent, 2 = final
      const charStates = new Uint8Array(allChars.length);

      gsap.set(allChars, { color: initialColor });

      const scheduleFinalTransition = (char: HTMLElement, index: number) => {
        const existingTimer = colorTransitionTimers.get(index);
        if (existingTimer) window.clearTimeout(existingTimer);

        const timer = window.setTimeout(() => {
          if (!completedChars.has(index)) {
            gsap.to(char, {
              duration: 0.1,
              ease: "none",
              color: finalColor,
              onComplete: () => {
                completedChars.add(index);
                charStates[index] = 2;
              },
            });
          }
          colorTransitionTimers.delete(index);
        }, 100);

        colorTransitionTimers.set(index, timer);
      };

      const trigger = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top 90%",
        end: "top 10%",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalChars = allChars.length;
          const isScrollingDown = progress >= lastScrollProgress;
          const currentCharIndex = Math.floor(progress * totalChars);

          if (isScrollingDown) {
            for (let index = 0; index < totalChars; index++) {
              if (index <= currentCharIndex) {
                if (charStates[index] === 0) {
                  charStates[index] = 1;
                  gsap.set(allChars[index], { color: accentColor });
                  if (!colorTransitionTimers.has(index)) {
                    scheduleFinalTransition(allChars[index], index);
                  }
                }
              } else {
                if (charStates[index] !== 0) {
                  charStates[index] = 0;
                  const timer = colorTransitionTimers.get(index);
                  if (timer) window.clearTimeout(timer);
                  colorTransitionTimers.delete(index);
                  completedChars.delete(index);
                  gsap.set(allChars[index], { color: initialColor });
                }
              }
            }
          } else {
            for (let index = 0; index < totalChars; index++) {
              if (index >= currentCharIndex) {
                if (charStates[index] !== 0) {
                  charStates[index] = 0;
                  const timer = colorTransitionTimers.get(index);
                  if (timer) window.clearTimeout(timer);
                  colorTransitionTimers.delete(index);
                  completedChars.delete(index);
                  gsap.set(allChars[index], { color: initialColor });
                }
              } else {
                if (charStates[index] === 0) {
                  charStates[index] = 1;
                  gsap.set(allChars[index], { color: accentColor });
                  if (!colorTransitionTimers.has(index)) {
                    scheduleFinalTransition(allChars[index], index);
                  }
                }
              }
            }
          }

          lastScrollProgress = progress;
        },
      });

      return () => {
        trigger.kill();
        colorTransitionTimers.forEach((timer) => window.clearTimeout(timer));
        colorTransitionTimers.clear();
        completedChars.clear();
        charSplit.revert();
        wordSplit.revert();
      };
    },
    {
      scope: rootRef,
      dependencies: [accentColor, finalColor, initialColor, shouldReduceMotion],
    },
  );

  return (
    <p ref={rootRef} className={cn("text-muted-foreground", className)}>
      {text}
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

  useGSAP(
    () => {
      if (shouldReduceMotion || !rootRef.current) return;

      const splitRefs: Array<{ wordSplit: SplitText; charSplit: SplitText }> = [];
      const colorTransitionTimers = new Map<number, number>();
      const completedChars = new Set<number>();
      const elements = Array.from(rootRef.current.children) as HTMLElement[];

      elements.forEach((element) => {
        const wordSplit = SplitText.create(element, {
          type: "words",
          wordsClass: "word",
        });
        const charSplit = SplitText.create(wordSplit.words, {
          type: "chars",
          charsClass: "char",
        });
        splitRefs.push({ wordSplit, charSplit });
      });

      const allChars = splitRefs.flatMap(({ charSplit }) => charSplit.chars as HTMLElement[]);
      let lastScrollProgress = 0;

      // 0 = initial, 1 = accent, 2 = final
      const charStates = new Uint8Array(allChars.length);

      gsap.set(allChars, { color: initialColor });

      const scheduleFinalTransition = (char: HTMLElement, index: number) => {
        const existingTimer = colorTransitionTimers.get(index);
        if (existingTimer) window.clearTimeout(existingTimer);

        const timer = window.setTimeout(() => {
          if (!completedChars.has(index)) {
            gsap.to(char, {
              duration: 0.1,
              ease: "none",
              color: finalColor,
              onComplete: () => {
                completedChars.add(index);
                charStates[index] = 2;
              },
            });
          }
          colorTransitionTimers.delete(index);
        }, 100);

        colorTransitionTimers.set(index, timer);
      };

      const trigger = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top 90%",
        end: "top 10%",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalChars = allChars.length;
          const isScrollingDown = progress >= lastScrollProgress;
          const currentCharIndex = Math.floor(progress * totalChars);

          if (isScrollingDown) {
            for (let index = 0; index < totalChars; index++) {
              if (index <= currentCharIndex) {
                if (charStates[index] === 0) {
                  charStates[index] = 1;
                  gsap.set(allChars[index], { color: accentColor });
                  if (!colorTransitionTimers.has(index)) {
                    scheduleFinalTransition(allChars[index], index);
                  }
                }
              } else {
                if (charStates[index] !== 0) {
                  charStates[index] = 0;
                  const timer = colorTransitionTimers.get(index);
                  if (timer) window.clearTimeout(timer);
                  colorTransitionTimers.delete(index);
                  completedChars.delete(index);
                  gsap.set(allChars[index], { color: initialColor });
                }
              }
            }
          } else {
            for (let index = 0; index < totalChars; index++) {
              if (index >= currentCharIndex) {
                if (charStates[index] !== 0) {
                  charStates[index] = 0;
                  const timer = colorTransitionTimers.get(index);
                  if (timer) window.clearTimeout(timer);
                  colorTransitionTimers.delete(index);
                  completedChars.delete(index);
                  gsap.set(allChars[index], { color: initialColor });
                }
              } else {
                if (charStates[index] === 0) {
                  charStates[index] = 1;
                  gsap.set(allChars[index], { color: accentColor });
                  if (!colorTransitionTimers.has(index)) {
                    scheduleFinalTransition(allChars[index], index);
                  }
                }
              }
            }
          }

          lastScrollProgress = progress;
        },
      });

      return () => {
        trigger.kill();
        colorTransitionTimers.forEach((timer) => window.clearTimeout(timer));
        colorTransitionTimers.clear();
        completedChars.clear();
        splitRefs.forEach(({ wordSplit, charSplit }) => {
          charSplit.revert();
          wordSplit.revert();
        });
      };
    },
    {
      scope: rootRef,
      dependencies: [accentColor, finalColor, initialColor, shouldReduceMotion, sentences],
    },
  );

  return (
    <div ref={rootRef} data-copy-wrapper className={cn("max-w-full space-y-9 overflow-hidden", className)}>
      {sentences.map((sentence) => (
        <p key={sentence} className={cn("max-w-full text-muted-foreground", sentenceClassName)}>
          {sentence}
        </p>
      ))}
    </div>
  );
}

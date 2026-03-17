"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

export function Hero() {
  const [videoEnded, setVideoEnded] = useState(false);

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden flex items-end pb-50 md:pb-24 lg:items-center lg:pb-0">
      {/* Background Image / Video */}
      <div className="absolute inset-0 bg-neutral-950 z-0 select-none">
        {!videoEnded && (
          <video
            src="/landingPage/landingVideo.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-20"
            onEnded={() => setVideoEnded(true)}
          />
        )}
        {/* Fallback/Final Image */}
        <div
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-1000",
            videoEnded ? "opacity-100 z-10" : "opacity-0 z-0",
          )}
          style={{ backgroundImage: "url('/landingPage/landingImage.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 z-30" />
      </div>

      <div className="relative z-40 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="max-w-2xl space-y-8">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="text-red-accent text-[10px] md:text-xs tracking-[0.3em] uppercase font-medium inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm"
          >
            XILAR &mdash; The future wear
          </motion.p>

          {/* Main Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE_OUT_EXPO }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white uppercase leading-[0.88]"
          >
            Built for<br />
            the bold
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT_EXPO }}
            className="text-base md:text-lg text-white/60 max-w-md font-light leading-relaxed"
          >
            Premium streetwear, oversized fits, and urban essentials for the next generation. Designed in Lucknow.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: EASE_OUT_EXPO }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link href="/shop/men">
              <Button
                size="lg"
                className="group h-13 px-8 text-xs tracking-[0.2em] uppercase rounded-none bg-white text-neutral-950 hover:bg-red-accent hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] font-semibold"
              >
                Shop men
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-950/5 group-hover:bg-white/15 transition-all duration-500">
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-0.5" />
                </span>
              </Button>
            </Link>
            <Link href="/shop/women">
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-xs tracking-[0.2em] uppercase rounded-none border-white/20 hover:border-white/60 bg-transparent text-white hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] font-semibold"
              >
                Shop women
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <ChevronDown className="h-6 w-6 text-white/40 animate-bounce" />
      </motion.div>
    </section>
  );
}

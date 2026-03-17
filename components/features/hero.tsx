"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Hero() {
  const [videoEnded, setVideoEnded] = useState(false);

  return (
    <section className="relative h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] w-full overflow-hidden flex items-center justify-center">
      {/* Background Image / Video */}
      <div className="absolute inset-0 bg-neutral-900 z-0 select-none">
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
        <div className="absolute inset-0 bg-black/40 z-30" /> {/* Overlay */}
      </div>

      <div className="relative z-40 text-center space-y-8 max-w-5xl px-6">
        {/* Brand Name */}
        <p className="text-red-accent text-lg md:text-xl tracking-[0.5em] uppercase font-medium">
          XILAR
        </p>

        {/* Main Tagline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white uppercase leading-[0.9]">
          THE FUTURE WEAR
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-light tracking-wide">
          Elevate your everyday with bold streetwear that defines the next
          generation.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/shop/men">
            <Button
              size="lg"
              className="h-14 px-10 text-sm tracking-[0.2em] uppercase rounded-none bg-white text-black hover:bg-red-accent hover:text-white transition-all font-medium"
            >
              Shop Men
            </Button>
          </Link>
          <Link href="/shop/women">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 text-sm tracking-[0.2em] uppercase rounded-none border-white/40 hover:border-red-accent bg-transparent text-white hover:text-red-accent transition-all font-medium"
            >
              Shop Women
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white/60" />
      </div>
    </section>
  );
}

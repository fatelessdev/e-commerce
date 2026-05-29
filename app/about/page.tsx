import type { Metadata } from "next"
import Image from "next/image"
import { ScrollTextRevealStack } from "@/components/effects/scroll-text-reveal"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants"

export const metadata: Metadata = {
    title: "About XILAR — Our Story",
    description:
        "Learn about XILAR — Gen-Z streetwear built on streetwise minimalism, bold design, and affordable luxury. Founded in Lucknow by Aman Singh.",
    alternates: {
        canonical: "/about",
    },
    openGraph: {
        title: "About XILAR — Our Story",
        description:
            "Gen-Z streetwear built on streetwise minimalism, bold design, and affordable luxury. Founded in Lucknow.",
        url: "/about",
    },
}

export default function AboutPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const storySentences = [
        "XILAR is a Gen-Z focused streetwear brand built on the philosophy of Streetwise Minimalism.",
        "We believe in bold design without the noise, making luxury feel sharp, wearable, and actually reachable.",
        "Founded by Aman Singh in Lucknow, XILAR delivers versatile, unisex pieces focused on comfort and movement.",
        "From oversized cargos to essential tees, every piece is designed to be stacked, styled, and worn your way.",
        "Our Premium collection carries selected joggers, cargo pants, denim, trousers, shorts, shirts, and premium T-shirts for the streets and the culture.",
    ]

    return (
        <div className="flex flex-col min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "About", url: "/about" },
                ])}
            />
            <div className="px-6 md:px-12 lg:px-16 py-14 md:py-24">
                <div className="relative mb-14 h-[52svh] min-h-[24rem] overflow-hidden bg-muted md:mb-20 md:h-[68svh]">
                    <Image
                        src="/hero/image(4).webp"
                        alt="XILAR streetwear editorial"
                        fill
                        sizes="100vw"
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/12 to-transparent" />
                    <p className="absolute bottom-6 left-6 max-w-[18rem] text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground md:bottom-10 md:left-10">
                        Lucknow made. Street ready. Built for movement.
                    </p>
                </div>

                <div className="max-w-3xl">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-6">Our story</p>
                <h1 className="font-display mb-12 text-5xl leading-[0.92] md:text-7xl lg:text-8xl">About XILAR</h1>
                </div>

                <div className="min-h-[205vh] max-w-5xl md:min-h-[225vh]">
                    <div className="sticky top-28">
                        <ScrollTextRevealStack
                            sentences={storySentences}
                            className="max-w-[68ch]"
                            sentenceClassName="text-2xl font-light leading-[1.32] md:text-4xl"
                        />
                    </div>
                </div>

                <div className="max-w-3xl">
                    <div className="my-8 border-y border-border/70 py-6 md:my-12">
                        <p className="text-xl md:text-2xl font-semibold text-foreground leading-snug">
                            &quot;Bold. Luxury. Affordable.&quot;
                        </p>
                    </div>

                    <div className="mt-10 pt-8 border-t border-border/60 md:mt-14">
                        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Get in touch</h2>
                        <p className="text-foreground font-medium">{CONTACT_EMAIL}</p>
                        <p className="text-muted-foreground mt-1">{CONTACT_PHONE}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

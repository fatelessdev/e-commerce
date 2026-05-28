import type { Metadata } from "next"
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

    return (
        <div className="flex flex-col min-h-screen">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "About", url: "/about" },
                ])}
            />
            <div className="px-6 md:px-12 lg:px-16 py-20 md:py-32 max-w-3xl">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-6">Our story</p>
                <h1 className="font-display mb-12 text-5xl leading-[0.92] md:text-7xl lg:text-8xl">About XILAR</h1>

                <div className="space-y-8 text-base md:text-lg leading-relaxed text-muted-foreground max-w-[60ch]">
                    <p>
                        <span className="text-foreground font-medium">XILAR</span> is a Gen-Z focused streetwear brand built on the philosophy of <span className="text-foreground">Streetwise Minimalism</span>. We believe in bold design without the noise — luxury you can actually afford.
                    </p>

                    <p>
                        Founded by <span className="text-foreground font-medium">Aman Singh</span> in Lucknow, XILAR delivers versatile, unisex pieces focused on comfort and movement. From oversized cargos to essential tees, every piece is designed to be stacked, styled, and worn your way.
                    </p>

                    <div className="border-l-2 border-red-accent pl-6 py-3 my-16">
                        <p className="text-xl md:text-2xl font-semibold text-foreground leading-snug">
                            &quot;Bold. Luxury. Affordable.&quot;
                        </p>
                    </div>

                    <p>
                        Our Essentials collection features joggers, cargo pants, denim, trousers, shorts, shirts, and premium T-shirts — all designed for the streets but refined for the culture.
                    </p>
                </div>

                <div className="mt-20 pt-8 border-t border-border/60">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Get in touch</h2>
                    <p className="text-foreground font-medium">{CONTACT_EMAIL}</p>
                    <p className="text-muted-foreground mt-1">{CONTACT_PHONE}</p>
                </div>
            </div>
        </div>
    )
}

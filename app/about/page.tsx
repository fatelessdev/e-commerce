import type { Metadata } from "next"
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data"

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
            <div className="px-6 py-16 md:py-24 max-w-4xl">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-8">About XILAR</h1>

                <div className="space-y-8 text-lg leading-relaxed text-muted-foreground">
                    <p>
                        <span className="text-foreground font-medium">XILAR</span> is a Gen-Z focused streetwear brand built on the philosophy of <span className="text-foreground">Streetwise Minimalism</span>. We believe in bold design without the noise — luxury you can actually afford.
                    </p>

                    <p>
                        Founded by <span className="text-foreground font-medium">Aman Singh</span> in Lucknow, XILAR delivers versatile, unisex pieces focused on comfort and movement. From oversized cargos to essential tees, every piece is designed to be stacked, styled, and worn your way.
                    </p>

                    <div className="border-l-2 border-foreground pl-6 py-2 my-12">
                        <p className="text-2xl font-medium text-foreground italic">
                            &quot;Bold. Luxury. Affordable.&quot;
                        </p>
                    </div>

                    <p>
                        Our Essentials collection features joggers, cargo pants, denim, trousers, shorts, shirts, and premium T-shirts — all designed for the streets but refined for the culture.
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t border-border">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Get in touch</h2>
                    <p className="text-foreground">amansomvanshi29112003@gmail.com</p>
                    <p className="text-muted-foreground">+91 8090644991</p>
                </div>
            </div>
        </div>
    )
}

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollTextRevealStack } from "@/components/effects/scroll-text-reveal"
import { Button } from "@/components/ui/button"
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

const teamMembers = [
    {
        index: "01",
        role: "Lead Developer",
        name: "Alex Johnson",
        shortName: (
            <>
                Alex <br />
                Johnson
            </>
        ),
        image: "/team/team-1.jpg",
        description:
            "Alex is a skilled developer with expertise in modern web technologies and a passion for creating seamless user experiences.",
    },
    {
        index: "02",
        role: "UI/UX Designer",
        name: "Sophia Martinez",
        shortName: (
            <>
                Sophia <br />
                Martinez
            </>
        ),
        image: "/team/team-2.jpg",
        description:
            "Sophia specializes in crafting intuitive and visually appealing designs that bring digital products to life.",
    },
    {
        index: "03",
        role: "Project Manager",
        name: "Michael Brown",
        shortName: (
            <>
                Michael <br />
                Brown
            </>
        ),
        image: "/team/team-3.jpg",
        description:
            "Michael ensures projects are delivered on time and within scope, maintaining excellent communication with clients and the team.",
    },
]

export default function AboutPage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const storySentences = [
        "XILAR is a Gen-Z focused streetwear label built on streetwise minimalism: sharp silhouettes, calm surfaces, and pieces that do not need noise to feel premium.",
        "We make clothing for people who browse visually, decide quickly, and still care about fit, fabric, and the confidence of a clean rotation.",
        "Founded in Lucknow, the brand turns everyday movement into a uniform: tees, shirts, cargos, denim, attars, and accessories that can be stacked without feeling overdone.",
        "The product language is simple on purpose. Strong images, honest prices, durable details, and a little AI-native bargaining energy where it helps the purchase feel personal.",
    ]

    return (
        <div className="flex min-h-screen flex-col">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl, [
                    { name: "Home", url: "/" },
                    { name: "About", url: "/about" },
                ])}
            />

            <section className="px-6 pb-16 pt-24 md:px-12 md:pb-24 md:pt-[22svh] lg:px-16">
                <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-14">
                    <div className="flex flex-col justify-between gap-8">
                        <p className="max-w-[24rem] text-[10px] font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                            Lucknow made. Street ready. Built for movement.
                        </p>
                        <p className="max-w-[22rem] text-sm leading-7 text-muted-foreground">
                            We are building an Indian streetwear house for visual shoppers who want premium confidence without luxury-store distance.
                        </p>
                    </div>

                    <div className="grid gap-8">
                        <h1 className="font-display max-w-5xl text-6xl leading-[0.88] md:text-8xl lg:text-9xl">
                            About XILAR
                        </h1>
                        <div className="relative h-[48svh] min-h-[24rem] overflow-hidden bg-muted md:h-[56svh]">
                            <Image
                                src="/hero/image(4).webp"
                                alt="XILAR streetwear editorial"
                                fill
                                sizes="(max-width: 768px) 100vw, 68vw"
                                priority
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-t border-border/60 px-6 py-16 md:px-12 md:py-24 lg:px-16">
                <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[0.78fr_1.22fr]">
                    <div>
                        <p className="sticky top-28 text-[10px] font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                            Our story
                        </p>
                    </div>
                    <div className="min-h-[70svh] md:min-h-[85svh]">
                        <div className="sticky top-24 md:top-28">
                            <ScrollTextRevealStack
                                sentences={storySentences}
                                className="max-w-[72ch]"
                                sentenceClassName="text-2xl font-light leading-[1.32] md:text-4xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-t border-border/60 px-6 py-16 md:px-12 md:py-24 lg:px-16">
                <div className="mx-auto max-w-7xl">
                    <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                        The studio line
                    </p>
                    <h2 className="font-display max-w-6xl text-5xl leading-[0.96] md:text-7xl lg:text-8xl">
                        <span>From corners of globe,</span>
                        <span className="block md:pl-[18vw]">we are united by</span>
                        <span className="block md:pl-[38vw]">creativity</span>
                    </h2>
                    <div className="mt-16 space-y-16 md:mt-20 md:space-y-24">
                        {teamMembers.map((member, index) => (
                            <article
                                key={member.name}
                                className={`relative flex flex-col ${
                                    index === 1 ? "md:left-[40%]" : index === 2 ? "md:left-[15%]" : ""
                                }`}
                            >
                                <div className="mb-3 md:mb-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                        {member.role}
                                    </p>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <div className="relative w-full aspect-[7/10] md:w-[350px] md:h-[500px] md:aspect-auto overflow-hidden bg-muted flex-shrink-0">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 350px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="hidden md:flex relative flex-col gap-16 -left-8 w-[calc(100%-500px)]">
                                        <div className="text-[3rem] font-light leading-none">
                                            <p>{member.shortName}</p>
                                        </div>
                                        <div className="flex gap-8">
                                            <div className="w-20 h-20 aspect-square flex items-center justify-center border border-foreground/35 rounded-full flex-shrink-0">
                                                <ArrowRight className="h-6 w-6" />
                                            </div>
                                            <div className="w-[35%]">
                                                <p className="text-sm leading-6 text-muted-foreground">
                                                    {member.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 md:mt-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground md:block hidden">
                                        ({member.index})
                                    </p>
                                    <h3 className="text-3xl font-light mt-2 md:hidden block">
                                        {member.name}
                                    </h3>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-6 py-16 md:px-12 md:py-24 lg:px-16">
                <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-end">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                            Get in touch
                        </p>
                        <h2 className="font-display mt-6 text-5xl leading-none md:text-7xl">
                            Bold. Luxury. Affordable.
                        </h2>
                    </div>
                    <div className="grid gap-5 md:justify-end">
                        <div className="text-sm leading-7 text-muted-foreground md:text-right">
                            <p className="font-medium text-foreground">{CONTACT_EMAIL}</p>
                            <p>{CONTACT_PHONE}</p>
                        </div>
                        <Button asChild variant="outline" className="h-13 rounded-full px-7 text-xs font-semibold uppercase tracking-[0.2em]">
                            <Link href="/shop">
                                Shop the edit
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

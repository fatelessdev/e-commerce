import { CheckCircle2, Star } from "lucide-react"

const REVIEWS = [
    {
        title: "Best polo I’ve owned",
        body: "The fabric is insanely soft and the fit is perfect. Wore it to a date and got compliments all night. Already ordering two more.",
        name: "Arjun M.",
        product: "Classic Knit Polo",
    },
    {
        title: "Worth every rupee",
        body: "Was skeptical ordering online but the quality blew me away. The stitching and weight of the fabric feel like something 3x the price.",
        name: "Priya S.",
        product: "Oversized Tee",
    },
    {
        title: "My go-to brand now",
        body: "Third order in two months. The oversized fits are clean, not too baggy, not too tight. Finally a brand that gets Indian body types.",
        name: "Rohan K.",
        product: "Grid Polo",
    },
    {
        title: "Colour didn’t fade at all",
        body: "Washed it 10+ times now and the colour is exactly like day one. Fabric still feels premium. This is rare at this price point.",
        name: "Sneha D.",
        product: "Black & White Grid Polo",
    },
    {
        title: "Great fit, fast delivery",
        body: "Ordered at night, got it in 3 days with COD. The fit is clean, not boxy like other Indian brands. Only wish there were more colours.",
        name: "Karan J.",
        product: "Premium Knit Polo",
    },
    {
        title: "Compliments every single time",
        body: "My friends keep asking where I got this. The texture stands out and you can feel it’s not fast fashion. Respect for the quality at this range.",
        name: "Aditya P.",
        product: "Oversized Fit Tee",
    },
]

export function RealReviews() {
    return (
        <section className="border-t border-border/60 bg-secondary/20 px-6 py-16 md:px-12 md:py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.45em] text-muted-foreground">
                        Real reviews
                    </p>
                    <h2 className="text-3xl font-black uppercase tracking-normal md:text-4xl">What Our Customers Say</h2>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {REVIEWS.map((review) => (
                        <article key={`${review.name}-${review.product}`} className="border border-border/70 bg-background/55 p-5 md:p-6">
                            <div className="mb-4 flex items-center gap-1 text-[#caa45d]" aria-label="5 out of 5 stars">
                                {[...Array(5)].map((_, index) => (
                                    <Star key={index} className="h-4 w-4 fill-current" />
                                ))}
                            </div>
                            <h3 className="text-sm font-bold tracking-wide">{review.title}</h3>
                            <p className="mt-4 min-h-[4rem] text-sm leading-7 text-muted-foreground">{review.body}</p>
                            <div className="mt-5 border-t border-border/70 pt-4">
                                <p className="text-sm font-bold">{review.name}</p>
                                <p className="mt-2 text-sm text-muted-foreground">{review.product}</p>
                                <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Verified Buyer
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

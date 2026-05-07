import Link from "next/link"
import Image from "next/image"
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants"

export function Footer() {
    return (
        <footer className="border-t border-border/60 bg-background">
            <div className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
                <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-16 max-w-7xl mx-auto">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/logo.png"
                                alt="XILAR"
                                width={120}
                                height={32}
                                className="h-7 w-auto object-contain dark:invert"
                            />
                        </Link>
                        <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                            Gen-Z streetwear built on bold design and affordable luxury. Based in Lucknow, India.
                        </p>
                        <div className="mt-5 space-y-1 text-sm text-muted-foreground">
                            <p>{CONTACT_EMAIL}</p>
                            <p>{CONTACT_PHONE}</p>
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground mb-5">Shop</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/shop/men" className="hover:text-foreground transition-colors duration-300">
                                    Men
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop/women" className="hover:text-foreground transition-colors duration-300">
                                    Women
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop/accessories" className="hover:text-foreground transition-colors duration-300">
                                    Accessories
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop/men" className="hover:text-foreground transition-colors duration-300">
                                    Combos
                                </Link>
                            </li>
                            <li>
                                <Link href="/new" className="hover:text-foreground transition-colors duration-300">
                                    New Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link href="/collections/essentials" className="hover:text-foreground transition-colors duration-300">
                                    Essentials
                                </Link>
                            </li>
                            <li>
                                <Link href="/collections/summer-26" className="hover:text-foreground transition-colors duration-300">
                                    Summer &apos;26
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground mb-5">Company</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/about" className="hover:text-foreground transition-colors duration-300">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/account" className="hover:text-foreground transition-colors duration-300">
                                    Account
                                </Link>
                            </li>
                            <li>
                                <Link href="/orders" className="hover:text-foreground transition-colors duration-300">
                                    Orders
                                </Link>
                            </li>
                            <li>
                                <Link href="/wishlist" className="hover:text-foreground transition-colors duration-300">
                                    Wishlist
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div>
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground mb-5">Policies</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/policies/shipping" className="hover:text-foreground transition-colors duration-300">
                                    Shipping
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/exchange" className="hover:text-foreground transition-colors duration-300">
                                    Exchange
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/returns" className="hover:text-foreground transition-colors duration-300">
                                    Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/refunds" className="hover:text-foreground transition-colors duration-300">
                                    Refunds
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border/60 px-6 md:px-12 lg:px-16 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] tracking-[0.1em] uppercase text-muted-foreground max-w-7xl mx-auto">
                    <p>&copy; {new Date().getFullYear()} XILAR. All rights reserved.</p>
                    <Link href="/policies" className="hover:text-foreground transition-colors duration-300">
                        Store Policies
                    </Link>
                </div>
            </div>
        </footer>
    )
}

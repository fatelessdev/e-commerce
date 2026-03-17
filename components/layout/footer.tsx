import Link from "next/link"
import Image from "next/image"

export function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="px-6 md:px-12 py-12 md:py-16">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/logo.png"
                                alt="XILAR"
                                width={120}
                                height={32}
                                className="h-8 w-auto object-contain dark:invert"
                            />
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Gen-Z streetwear built on bold design and affordable luxury. Based in Lucknow, India.
                        </p>
                        <div className="mt-4 text-sm text-muted-foreground">
                            <p>amansomvanshi29112003@gmail.com</p>
                            <p>+91 8090644991</p>
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">Shop</h3>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li>
                                <Link href="/shop/men" className="hover:text-foreground transition-colors">
                                    Men
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop/women" className="hover:text-foreground transition-colors">
                                    Women
                                </Link>
                            </li>
                            <li>
                                <Link href="/new" className="hover:text-foreground transition-colors">
                                    New Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link href="/collections/essentials" className="hover:text-foreground transition-colors">
                                    Essentials
                                </Link>
                            </li>
                            <li>
                                <Link href="/collections/summer-26" className="hover:text-foreground transition-colors">
                                    Summer &apos;26
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">Company</h3>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li>
                                <Link href="/about" className="hover:text-foreground transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/account" className="hover:text-foreground transition-colors">
                                    Account
                                </Link>
                            </li>
                            <li>
                                <Link href="/orders" className="hover:text-foreground transition-colors">
                                    Orders
                                </Link>
                            </li>
                            <li>
                                <Link href="/wishlist" className="hover:text-foreground transition-colors">
                                    Wishlist
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">Policies</h3>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li>
                                <Link href="/policies/shipping" className="hover:text-foreground transition-colors">
                                    Shipping
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/exchange" className="hover:text-foreground transition-colors">
                                    Exchange
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/returns" className="hover:text-foreground transition-colors">
                                    Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/refunds" className="hover:text-foreground transition-colors">
                                    Refunds
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border px-6 md:px-12 py-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} XILAR. All rights reserved.</p>
                    <Link href="/policies" className="hover:text-foreground transition-colors">
                        Store Policies
                    </Link>
                </div>
            </div>
        </footer>
    )
}

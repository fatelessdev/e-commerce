import Link from "next/link"
import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    return (
        <aside className={cn("pb-12 w-60 border-r border-border/40 hidden lg:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto", className)}>
            <div className="space-y-6 py-6">
                <div className="px-4">
                    <h2 className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                        Discover
                    </h2>
                    <div className="space-y-0.5">
                        <Link href="/shop/men" className="block px-3 py-2.5 text-sm font-medium hover:bg-accent/60 hover:text-accent-foreground transition-colors duration-300">
                            Men
                        </Link>
                        <Link href="/shop/women" className="block px-3 py-2.5 text-sm font-medium hover:bg-accent/60 hover:text-accent-foreground transition-colors duration-300">
                            Women
                        </Link>
                        <Link href="/shop/accessories" className="block px-3 py-2.5 text-sm font-medium hover:bg-accent/60 hover:text-accent-foreground transition-colors duration-300">
                            Accessories
                        </Link>
                    </div>
                </div>
                <div className="px-4">
                    <h2 className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                        Collections
                    </h2>
                    <div className="space-y-0.5">
                        <Link href="/collections/premium" className="block px-3 py-2.5 text-sm font-medium hover:bg-accent/60 hover:text-accent-foreground transition-colors duration-300">
                            Premium
                        </Link>
                        <Link href="/collections/summer-26" className="block px-3 py-2.5 text-sm font-medium hover:bg-accent/60 hover:text-accent-foreground transition-colors duration-300">
                            Summer &apos;26
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    )
}

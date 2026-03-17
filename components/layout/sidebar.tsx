import Link from "next/link"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // May use later for bottom actions

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12 w-64 border-r border-border hidden lg:block h-[calc(100vh-4rem)] sticky top-16 scroll-py-6 overflow-y-auto", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight uppercase text-muted-foreground">
                        Discover
                    </h2>
                    <div className="space-y-1">
                        <Link href="/shop/men" className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-none transition-colors">
                            Men
                        </Link>
                        <Link href="/shop/women" className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-none transition-colors">
                            Women
                        </Link>
                        <Link href="/shop/accessories" className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-none transition-colors">
                            Accessories
                        </Link>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight uppercase text-muted-foreground">
                        Collections
                    </h2>
                    <div className="space-y-1">
                        <Link href="/collections/essentials" className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-none transition-colors">
                            Essentials
                        </Link>
                        <Link href="/collections/summer-26" className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-none transition-colors">
                            Summer &apos;26
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

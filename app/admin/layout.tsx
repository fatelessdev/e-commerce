import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Ticket,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/account?redirect=/admin");
  }

  const admin = await isAdmin();
  if (!admin) {
    redirect("/?error=unauthorized");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center px-4 gap-4">
          <Link href="/admin" className="font-bold text-xl tracking-tighter">
            XILAR <span className="text-primary text-sm font-normal">Admin</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 ml-8">
            <Link 
              href="/admin" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link 
              href="/admin/products" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Products
            </Link>
            <Link
              href="/admin/combos"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Combos
            </Link>
            <Link 
              href="/admin/orders" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Orders
            </Link>
            <Link 
              href="/admin/coupons" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Ticket className="h-4 w-4" />
              Coupons
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session.user.email}
            </span>
            <Link 
              href="/" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View Store →
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile navigation subheader */}
      <div className="flex md:hidden border-b bg-background overflow-x-auto scrollbar-hide py-3 px-4 gap-5 sticky top-16 z-40">
        <Link href="/admin" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Dashboard</Link>
        <Link href="/admin/products" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Products</Link>
        <Link href="/admin/combos" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Combos</Link>
        <Link href="/admin/orders" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Orders</Link>
        <Link href="/admin/coupons" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Coupons</Link>
      </div>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin",
  },
};

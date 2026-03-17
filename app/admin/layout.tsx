import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Settings,
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
            <Link 
              href="/admin/settings" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
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

      {/* Main Content */}
      <main className="p-6">
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

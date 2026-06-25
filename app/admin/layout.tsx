import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center px-4 md:px-8 gap-4">
          <Link href="/admin" className="text-2xl font-display tracking-tight flex items-baseline gap-1 select-none">
            XILAR <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground font-semibold">ADMIN</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 ml-10">
            <Link 
              href="/admin" 
              className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/products" 
              className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Products
            </Link>
            <Link
              href="/admin/combos"
              className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Combos
            </Link>
            <Link 
              href="/admin/orders" 
              className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Orders
            </Link>
            <Link 
              href="/admin/coupons" 
              className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Coupons
            </Link>
            <Link
              href="/admin/campaigns"
              className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Campaigns
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-6">
            <span className="text-[9px] uppercase font-mono tracking-[0.15em] text-muted-foreground hidden sm:inline select-none">
              {session.user.email}
            </span>
            <Link 
              href="/" 
              className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              View Store →
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile navigation subheader */}
      <div className="flex md:hidden border-b border-border/40 bg-background overflow-x-auto scrollbar-hide py-3 px-4 gap-5 sticky top-16 z-40">
        <Link href="/admin" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Dashboard</Link>
        <Link href="/admin/products" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Products</Link>
        <Link href="/admin/combos" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Combos</Link>
        <Link href="/admin/orders" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Orders</Link>
        <Link href="/admin/coupons" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Coupons</Link>
        <Link href="/admin/campaigns" className="text-[10px] uppercase font-semibold tracking-[0.2em] text-muted-foreground hover:text-foreground shrink-0 transition-colors">Campaigns</Link>
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

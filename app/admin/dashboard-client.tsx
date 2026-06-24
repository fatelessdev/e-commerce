"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  Ticket, 
  Plus, 
  ArrowRight,
  FileText
} from "lucide-react";
import { getDashboardStats } from "@/lib/actions/admin";
import { ADMIN_QUERY_OPTIONS } from "@/lib/admin-query-options";
import { cn } from "@/lib/utils";

type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export function AdminDashboardClient({ initialStats }: { initialStats: DashboardStats }) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("30d");
  const shouldReduceMotion = useReducedMotion();

  const { data: stats = initialStats, isFetching } = useQuery({
    queryKey: ["admin-dashboard", timeframe],
    queryFn: () => getDashboardStats(timeframe),
    initialData: timeframe === "30d" ? initialStats : undefined,
    ...ADMIN_QUERY_OPTIONS,
  });

  const statsItems = [
    {
      label: "Revenue Delivered",
      value: `₹${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: timeframe === "all" ? "Delivered orders all-time" : `Delivered in last ${timeframe === "7d" ? "7" : "30"} days`,
      icon: IndianRupee,
      code: "REV_DELIV"
    },
    {
      label: "Volume Shipped",
      value: stats.totalOrders.toLocaleString(),
      description: timeframe === "all" ? "Total volume all-time" : `Orders in last ${timeframe === "7d" ? "7" : "30"} days`,
      icon: ShoppingCart,
      code: "ORD_VOL"
    },
    {
      label: "Active Catalog",
      value: stats.totalProducts.toLocaleString(),
      description: "Published products in store",
      icon: Package,
      code: "CAT_ACT"
    },
    {
      label: "Active Coupons",
      value: stats.activeCoupons.toLocaleString(),
      description: "Available discount programs",
      icon: Ticket,
      code: "CPN_ACT"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as const
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 md:py-16 space-y-16 px-2 sm:px-4">
      {/* Editorial Header */}
      <div className="border-b border-border/40 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="mb-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-muted-foreground">
                XILAR LEDGER // CORE ADMIN DESK
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none font-sans md:text-6xl">
              OVERVIEW
            </h1>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 border border-border/40 rounded-full p-1 bg-secondary/15 backdrop-blur-sm self-start md:self-auto">
            {(["7d", "30d", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  "text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full transition-all duration-300 font-bold cursor-pointer select-none",
                  timeframe === t
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-border/30 divide-y sm:divide-y-0 sm:divide-x divide-border/30 bg-card/10"
      >
        {statsItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div 
              key={item.label}
              variants={itemVariants}
              className={cn(
                "p-8 flex flex-col justify-between min-h-[180px] transition-colors duration-300 hover:bg-secondary/5",
                index === 0 && "sm:pl-4 lg:pl-6",
                index === 3 && "lg:pr-6"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-muted-foreground">
                  {item.code} {"//"} {item.label}
                </span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
              </div>
              
              <div className="mt-6 space-y-1">
                <div 
                  className={cn(
                    "text-4xl md:text-5xl font-light font-serif tracking-tight tabular-nums transition-opacity duration-300",
                    isFetching ? "opacity-40" : "opacity-100"
                  )}
                >
                  {item.value}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.05em] leading-normal pt-1">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Grid: Actions & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Directives // Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h2 className="text-[10px] uppercase font-mono tracking-[0.3em] text-muted-foreground">
              ADMIN DIRECTIVES
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Quick pathways to catalog and settings actions.</p>
          </div>

          <div className="flex flex-col gap-4">
            <Link 
              href="/admin/products/new" 
              className="group flex flex-col justify-between p-6 border border-border/40 hover:border-foreground/50 transition-all duration-300 min-h-[140px] bg-secondary/5 rounded-lg hover-lift"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono tracking-widest text-muted-foreground">DIR_01 // CATALOG</span>
                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-red-accent transition-colors">
                  Add New Product
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  Create a new product listing with sizes, colors, and Cloudinary media assets.
                </p>
              </div>
            </Link>

            <Link 
              href="/admin/coupons/new" 
              className="group flex flex-col justify-between p-6 border border-border/40 hover:border-foreground/50 transition-all duration-300 min-h-[140px] bg-secondary/5 rounded-lg hover-lift"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono tracking-widest text-muted-foreground">DIR_02 // DEALS</span>
                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-red-accent transition-colors">
                  Create Coupon
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  Issue discount campaigns, fixed credits, or restricted coupons.
                </p>
              </div>
            </Link>

            <Link 
              href="/admin/orders" 
              className="group flex flex-col justify-between p-6 border border-border/40 hover:border-foreground/50 transition-all duration-300 min-h-[140px] bg-secondary/5 rounded-lg hover-lift"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono tracking-widest text-muted-foreground">DIR_03 // ORDERS</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-red-accent transition-colors">
                  Manage Orders
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  Inspect shipment status, execute cancellations, or review order metrics.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Transactions Ledger */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-[10px] uppercase font-mono tracking-[0.3em] text-muted-foreground">
                RECENT TRANSACTIONS
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Audit log of customer intake and checkout events.</p>
            </div>
            <Link 
              href="/admin/orders" 
              className="text-[9px] uppercase font-mono tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              View Full Ledger <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground pb-4 font-bold">Order ID</th>
                    <th className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground pb-4 font-bold">Customer</th>
                    <th className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground pb-4 font-bold">Date</th>
                    <th className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground pb-4 font-bold">Status</th>
                    <th className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground pb-4 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-secondary/5 transition-colors">
                      <td className="py-4 font-mono text-xs text-muted-foreground">
                        <Link href={`/admin/orders/${order.id}`} className="hover:text-foreground hover:underline transition-colors">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-4 text-sm font-medium text-foreground">
                        {order.customerName}
                      </td>
                      <td className="py-4 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded font-bold inline-block border",
                          order.status === "delivered" && "bg-green-500/10 text-green-500 border-green-500/25",
                          order.status === "pending" && "bg-yellow-500/10 text-yellow-500 border-yellow-500/25",
                          order.status === "cancelled" && "bg-destructive/10 text-destructive border-destructive/25",
                          !["delivered", "pending", "cancelled"].includes(order.status) && "bg-blue-500/10 text-blue-500 border-blue-500/25"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-right font-serif text-sm tabular-nums text-foreground">
                        ₹{order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center border border-dashed border-border/40 rounded-lg text-sm text-muted-foreground bg-secondary/5">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                No transactions recorded in database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

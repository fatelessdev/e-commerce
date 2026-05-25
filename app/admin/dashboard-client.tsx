"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package, ShoppingCart, IndianRupee, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/actions/admin";

type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export function AdminDashboardClient({ initialStats }: { initialStats: DashboardStats }) {
  const { data: stats = initialStats } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getDashboardStats,
    initialData: initialStats,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to XILAR Admin. Manage your store from here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products in store</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders (30d)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Orders in last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (30d)</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From delivered orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCoupons}</div>
            <p className="text-xs text-muted-foreground">Available discount codes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/products/new">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader><CardTitle className="text-lg">Add New Product</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Add a new product to your store with images, sizes, and colors.</p></CardContent>
          </Card>
        </Link>
        <Link href="/admin/coupons/new">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader><CardTitle className="text-lg">Create Coupon</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Create discount codes for promotions and marketing.</p></CardContent>
          </Card>
        </Link>
        <Link href="/admin/orders">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader><CardTitle className="text-lg">View Orders</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Manage and track customer orders and shipments.</p></CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/actions/admin";
import { OrderStatusSelect } from "./status-select";

type AdminOrder = Awaited<ReturnType<typeof getOrders>>[number];

export function AdminOrdersClient({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const { data: orders = initialOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => getOrders(),
    initialData: initialOrders,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">Order ID</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Date</th>
              <th className="text-left p-4 font-medium hidden md:table-cell">Customer</th>
              <th className="text-left p-4 font-medium">Total</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Payment</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No orders yet. Orders will appear here when customers make purchases.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="p-4"><span className="font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}...</span></td>
                  <td className="p-4 hidden sm:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 hidden md:table-cell">
                    {order.shippingAddress?.name || "Guest"}
                    {order.shippingAddress?.phone && (
                      <div className="text-sm text-muted-foreground">{order.shippingAddress.phone}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-medium">₹{order.total}</div>
                    {order.couponCode && <div className="text-[10px] text-muted-foreground">Coupon: {order.couponCode}</div>}
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <div className="text-sm"><span className="uppercase">{order.paymentMethod || "—"}</span></div>
                    <div className={`text-xs ${order.paymentStatus === "paid" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                      {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </div>
                  </td>
                  <td className="p-4">
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

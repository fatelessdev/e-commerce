import { getOrderById } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { OrderStatusSelect } from "../status-select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const address = order.shippingAddress as {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state?: string;
    pincode: string;
  } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon" aria-label="Back to orders" className="rounded-none">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center sm:ml-auto">
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 border rounded-lg">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="font-semibold">Order Items</h2>
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex gap-4">
                {item.productImage && (
                  <div
                    className="w-16 h-20 bg-cover bg-center bg-neutral-900 rounded flex-shrink-0"
                    style={{ backgroundImage: `url(${item.productImage})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.productName}</p>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>Size: {item.size}{item.color ? ` · Color: ${item.color}` : ""}</p>
                    <p>Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium">₹{parseFloat(item.totalPrice).toLocaleString("en-IN")}</p>
                  <p className="text-sm text-muted-foreground">₹{parseFloat(item.unitPrice).toLocaleString("en-IN")} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="p-4 border-t bg-muted/20 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{parseFloat(order.subtotal).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{parseFloat(order.shipping) === 0 ? "FREE" : `₹${parseFloat(order.shipping).toLocaleString("en-IN")}`}</span>
            </div>
            {order.couponCode && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Discount ({order.couponCode})</span>
                <span>-₹{parseFloat(order.discount).toLocaleString("en-IN")}</span>
              </div>
            )}
            {order.codFee && parseFloat(order.codFee) > 0 && (
              <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
                <span>COD Fee</span>
                <span>+₹{parseFloat(order.codFee).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{parseFloat(order.total).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="border rounded-lg">
            <div className="p-4 border-b bg-muted/50">
              <h2 className="font-semibold">Customer</h2>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <p className="font-medium">{address?.name || "Guest"}</p>
              {address?.phone && <p className="text-muted-foreground">{address.phone}</p>}
              {address?.email && <p className="text-muted-foreground">{address.email}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border rounded-lg">
            <div className="p-4 border-b bg-muted/50">
              <h2 className="font-semibold">Shipping Address</h2>
            </div>
            <div className="p-4 text-sm space-y-1">
              {address ? (
                <>
                  <p>{address.name}</p>
                  <p className="text-muted-foreground">{address.address}</p>
                  <p className="text-muted-foreground">
                    {address.city}{address.state ? `, ${address.state}` : ""} - {address.pincode}
                  </p>
                  <p className="text-muted-foreground">{address.phone}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No address provided</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="border rounded-lg">
            <div className="p-4 border-b bg-muted/50">
              <h2 className="font-semibold">Payment</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium uppercase">{order.paymentMethod || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${
                  order.paymentStatus === "paid" 
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}>
                  {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-xs">{order.razorpayPaymentId}</span>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Razorpay Order</span>
                  <span className="font-mono text-xs">{order.razorpayOrderId}</span>
                </div>
              )}
              {order.paymentMethod === "cod" && (
                <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded">
                  <p className="font-medium text-orange-600 dark:text-orange-400">Cash on Delivery</p>
                  {order.codFee && parseFloat(order.codFee) > 0 && (
                    <p className="text-muted-foreground mt-1">COD Fee: ₹{parseFloat(order.codFee)}</p>
                  )}
                  {order.codRemainingAmount && (
                    <p className="text-muted-foreground">Amount to collect: ₹{parseFloat(order.codRemainingAmount).toLocaleString("en-IN")}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bargain Info (if applicable) */}
          {(order.bargainDiscount || order.bargainScore) && (
            <div className="border rounded-lg">
              <div className="p-4 border-b bg-muted/50">
                <h2 className="font-semibold">Bargain AI</h2>
              </div>
              <div className="p-4 space-y-2 text-sm">
                {order.bargainDiscount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600 dark:text-green-400">₹{parseFloat(order.bargainDiscount)}</span>
                  </div>
                )}
                {order.bargainScore !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span>{order.bargainScore}/10</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

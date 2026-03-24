import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getUserOrders } from "@/lib/actions/orders"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { CancelOrderButton } from "./cancel-button"

export const metadata: Metadata = {
    title: "My Orders",
    description: "View and track your XILAR orders.",
    robots: {
        index: false,
        follow: false,
    },
    alternates: {
        canonical: "/orders",
    },
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-500",
    confirmed: "bg-blue-500/20 text-blue-500",
    processing: "bg-purple-500/20 text-purple-500",
    shipped: "bg-orange-500/20 text-orange-500",
    delivered: "bg-green-500/20 text-green-500",
    cancelled: "bg-red-500/20 text-red-500",
}

export default async function OrdersPage() {
    const session = await getServerSession()
    
    if (!session) {
        redirect("/account")
    }

    const orders = await getUserOrders()

    return (
        <div className="min-h-screen">
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">History</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
                    My orders
                </h1>
            </div>

            <div className="p-6 md:px-12 max-w-4xl space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-24 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium">No orders placed yet</p>
                            <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
                                Your order history will appear here once you complete your first purchase.
                            </p>
                        </div>
                        <Link href="/shop">
                            <Button className="rounded-none uppercase tracking-[0.1em] text-xs mt-4">
                                Shop now
                            </Button>
                        </Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="border border-border/60 p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        Order #{order.id.slice(0, 8).toUpperCase()}
                                    </p>
                                    <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] uppercase tracking-[0.1em] font-medium px-2.5 py-1 ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                                        {order.status}
                                    </span>
                                    <p className="font-semibold text-sm mt-1.5 tabular-nums">₹{parseFloat(order.total).toLocaleString("en-IN")}</p>
                                </div>
                            </div>

                            {/* Order Items Preview */}
                            <div className="flex gap-2.5 overflow-x-auto pb-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex-shrink-0">
                                        {item.productImage ? (
                                            <Image
                                                src={item.productImage}
                                                alt={item.productName}
                                                width={56}
                                                height={72}
                                                className="w-14 h-18 object-cover bg-muted/30"
                                            />
                                        ) : (
                                            <div className="w-14 h-18 bg-muted/30" aria-label={item.productName} />
                                        )}
                                        <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-14">
                                            {item.productName}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Order Details */}
                            <div className="text-xs text-muted-foreground space-y-1.5 border-t border-border/40 pt-4">
                                <div className="flex justify-between">
                                    <span>Items</span>
                                    <span className="tabular-nums">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                </div>
                                {order.couponCode && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                        <span>Discount ({order.couponCode})</span>
                                        <span className="tabular-nums">-₹{parseFloat(order.couponDiscount || "0").toLocaleString("en-IN")}</span>
                                    </div>
                                )}
                                {order.codFee && parseFloat(order.codFee) > 0 && (
                                    <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                        <span>COD Fee</span>
                                        <span className="tabular-nums">+₹{parseFloat(order.codFee).toLocaleString("en-IN")}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Payment</span>
                                    <span className="capitalize">{order.paymentMethod || "N/A"}</span>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shippingAddress && (
                                <div className="text-xs text-muted-foreground border-t border-border/40 pt-4">
                                    <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
                                    <p>{order.shippingAddress.address}</p>
                                    <p>
                                        {order.shippingAddress.city}
                                        {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} - {order.shippingAddress.pincode}
                                    </p>
                                    <p>{order.shippingAddress.phone}</p>
                                </div>
                            )}

                            {/* Cancel button for eligible COD orders */}
                            {order.paymentMethod === "cod" && ["pending", "confirmed"].includes(order.status) && (
                                <CancelOrderButton orderId={order.id} />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

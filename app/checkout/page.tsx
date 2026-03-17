"use client"

import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, CreditCard, Truck, MapPin, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { CheckoutBargain } from "@/components/features/checkout-bargain"
import { useSession } from "@/lib/auth-client"
import { getSavedShippingAddress } from "@/lib/actions/orders"
import { FREE_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD_DISPLAY, SHIPPING_FEE /*, COD_FEE */ } from "@/lib/constants"
import Script from "next/script"

const CHECKOUT_STORAGE_KEY = "xilar-checkout"

interface ShippingAddress {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
}

// COD temporarily disabled — re-add `| "cod"` to re-enable
type PaymentMethod = "upi" | "card" | "netbanking" /* | "cod" */

interface CheckoutState {
    step: number
    shippingAddress: ShippingAddress
    paymentMethod: PaymentMethod
    appliedCoupon: { code: string; discount: number } | null
}

function loadCheckoutState(): Partial<CheckoutState> | null {
    if (typeof window === "undefined") return null
    try {
        const saved = sessionStorage.getItem(CHECKOUT_STORAGE_KEY)
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart()
    const { data: session, isPending: isAuthPending } = useSession()
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi")
    const [isPlacingOrder, setIsPlacingOrder] = useState(false)
    const [couponInput, setCouponInput] = useState("")
    const [couponError, setCouponError] = useState<string | null>(null)
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [showBargainNudge, setShowBargainNudge] = useState(false)
    const [triggerBargainOpen, setTriggerBargainOpen] = useState(false)
    const [bargainNudgeDismissed, setBargainNudgeDismissed] = useState(false)
    
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: ""
    })

    // Restore checkout state from sessionStorage on mount, then fill gaps from DB
    useEffect(() => {
        const saved = loadCheckoutState()
        if (saved) {
            if (saved.step) setStep(saved.step)
            if (saved.shippingAddress) setShippingAddress(saved.shippingAddress)
            if (saved.paymentMethod) setPaymentMethod(saved.paymentMethod)
            if (saved.appliedCoupon) setAppliedCoupon(saved.appliedCoupon)
        }

        // Fetch saved address from DB and fill any empty fields
        getSavedShippingAddress()
            .then((dbAddr) => {
                if (!dbAddr) return
                setShippingAddress((prev) => ({
                    name: prev.name || dbAddr.name || "",
                    email: prev.email || dbAddr.email || "",
                    phone: prev.phone || dbAddr.phone || "",
                    address: prev.address || dbAddr.address || "",
                    city: prev.city || dbAddr.city || "",
                    state: prev.state || dbAddr.state || "",
                    pincode: prev.pincode || dbAddr.pincode || "",
                }))
            })
            .catch(() => {
                // Ignore prefill failures; user can still fill manually
            })

        setHydrated(true)
    }, [])

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (!isAuthPending && !session) {
            router.replace("/account?redirect=/checkout")
        }
    }, [isAuthPending, session, router])

    // Persist checkout state to sessionStorage on changes
    const persistCheckout = useCallback(() => {
        if (!hydrated) return
        try {
            const state: CheckoutState = { step, shippingAddress, paymentMethod, appliedCoupon }
            sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(state))
        } catch { /* ignore quota errors */ }
    }, [step, shippingAddress, paymentMethod, appliedCoupon, hydrated])

    useEffect(() => {
        persistCheckout()
    }, [persistCheckout])

    useEffect(() => {
        const validateRestoredCoupon = async () => {
            if (!hydrated || !appliedCoupon?.code) return

            try {
                const response = await fetch("/api/coupons/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: appliedCoupon.code, orderTotal: totalPrice })
                })
                const result = await response.json()

                if (!result.valid) {
                    setAppliedCoupon(null)
                    setCouponError(result.error || "Saved coupon is no longer valid")
                } else if (typeof result.discount === "number" && result.discount !== appliedCoupon.discount) {
                    setAppliedCoupon({ code: appliedCoupon.code, discount: result.discount })
                }
            } catch {
                setAppliedCoupon(null)
                setCouponError("Saved coupon could not be verified")
            }
        }

        validateRestoredCoupon()
    }, [appliedCoupon?.code, appliedCoupon?.discount, hydrated, totalPrice])

    const handleApplyCoupon = (discount: number, code: string) => {
        setAppliedCoupon({ code, discount })
        setCouponError(null)
        setCouponInput("")
    }

    const handleValidateCoupon = async () => {
        const code = couponInput.trim().toUpperCase()
        if (!code) return

        setIsValidatingCoupon(true)
        setCouponError(null)

        try {
            const response = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, orderTotal: totalPrice })
            })

            const result = await response.json()

            if (result.valid) {
                handleApplyCoupon(result.discount, code)
            } else {
                setCouponError(result.error || "Invalid coupon code")
            }
        } catch {
            setCouponError("Failed to validate coupon. Please try again.")
        } finally {
            setIsValidatingCoupon(false)
        }
    }

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true)

        const orderData = {
            items: items.map(item => ({
                productId: item.id,
                productName: item.name,
                productImage: item.image,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity
            })),
            subtotal: totalPrice,
            shippingCost,
            discount: appliedCoupon?.discount || 0,
            couponCode: appliedCoupon?.code,
            codFee,
            total: finalTotal,
            shippingAddress,
            paymentMethod
        }

        try {
            // COD temporarily disabled — restore this block to re-enable COD payments:
        // if (paymentMethod === "cod") {
        //     const res = await fetch("/api/orders", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(orderData)
        //     })
        //     const result = await res.json()
        //     if (result.success) {
        //         setOrderId(result.orderId)
        //         setOrderPlaced(true)
        //         clearCart()
        //         sessionStorage.removeItem(CHECKOUT_STORAGE_KEY)
        //     } else {
        //         alert(result.error || "Failed to place order.")
        //     }
        //     setIsPlacingOrder(false)
        //     return
        // }

        // Online payment flow — Razorpay Checkout
            // Step 1: Create Razorpay order on server (amount computed server-side)
                const rzpOrderRes = await fetch("/api/razorpay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: items.map(item => ({ productId: item.id, quantity: item.quantity })),
                        couponCode: appliedCoupon?.code,
                        receipt: `order_${Date.now()}`,
                    })
                })
                const rzpOrderData = await rzpOrderRes.json()

                if (!rzpOrderData.success) {
                    alert("Failed to initiate payment. Please try again.")
                    setIsPlacingOrder(false)
                    return
                }

                // Step 2: Open Razorpay Checkout modal
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: rzpOrderData.order.amount,
                    currency: rzpOrderData.order.currency,
                    name: "XILAR",
                    description: "Order Payment",
                    order_id: rzpOrderData.order.id,
                    handler: async (response: {
                        razorpay_order_id: string
                        razorpay_payment_id: string
                        razorpay_signature: string
                    }) => {
                        // Step 3: Verify payment + create order
                        try {
                            const verifyRes = await fetch("/api/razorpay/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderData,
                                })
                            })
                            const verifyResult = await verifyRes.json()
                            if (verifyResult.success) {
                                setOrderId(verifyResult.orderId)
                                setOrderPlaced(true)
                                clearCart()
                                sessionStorage.removeItem(CHECKOUT_STORAGE_KEY)
                            } else {
                                alert(verifyResult.error || "Payment verification failed.")
                            }
                        } catch {
                            alert("Payment verification failed. Please contact support.")
                        }
                        setIsPlacingOrder(false)
                    },
                    prefill: {
                        name: shippingAddress.name,
                        email: shippingAddress.email,
                        contact: shippingAddress.phone,
                    },
                    theme: {
                        color: "#C62828",
                    },
                    modal: {
                        ondismiss: () => {
                            setIsPlacingOrder(false)
                        },
                    },
                }

                const RazorpayClass = (window as unknown as { Razorpay?: new (opts: typeof options) => { open: () => void } }).Razorpay
                if (!RazorpayClass) {
                    alert("Payment gateway is loading. Please try again in a moment.")
                    setIsPlacingOrder(false)
                    return
                }
                const rzp = new RazorpayClass(options)
                rzp.open()
                return // Don't set isPlacingOrder to false — handler/ondismiss will do it
        } catch {
            alert("Failed to place order. Please try again.")
            setIsPlacingOrder(false)
        }
    }

    const isAddressValid = () => {
        return (
            shippingAddress.name.trim() &&
            shippingAddress.email.trim() &&
            shippingAddress.phone.trim() &&
            shippingAddress.address.trim() &&
            shippingAddress.city.trim() &&
            shippingAddress.pincode.trim()
        )
    }

    // Calculate pricing: free shipping above threshold, otherwise standard fee
    const shippingCost = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const discount = appliedCoupon?.discount || 0
    // COD temporarily disabled — swap the two lines below to re-enable
    // const codFee = paymentMethod === "cod" ? COD_FEE : 0
    const codFee = 0
    const finalTotal = totalPrice + shippingCost - discount + codFee

    // Show loading while checking auth
    if (isAuthPending || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (items.length === 0 && !orderPlaced) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-5">
                    <p className="text-sm text-muted-foreground">Your cart is empty</p>
                    <Link href="/shop">
                        <Button variant="outline" className="rounded-none h-11 text-[10px] uppercase tracking-[0.2em]">
                            Continue shopping
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    if (orderPlaced) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md px-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                        <Check className="h-7 w-7 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Confirmation</p>
                        <h1 className="text-3xl font-black tracking-tighter uppercase">Order confirmed</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Thank you for shopping with XILAR. Your order has been placed and will be delivered soon.
                    </p>
                    {appliedCoupon && (
                        <p className="text-xs text-red-accent tabular-nums">You saved ₹{appliedCoupon.discount} with coupon {appliedCoupon.code}</p>
                    )}
                    {orderId && (
                        <p className="text-xs text-muted-foreground tabular-nums">Order ID: #{orderId.slice(0, 8).toUpperCase()}</p>
                    )}
                    {/* COD temporarily disabled — restore when re-enabling:
                        {paymentMethod === "cod" && (
                            <p className="text-sm text-muted-foreground">
                                Please keep ₹{finalTotal.toLocaleString("en-IN")} ready at the time of delivery.
                            </p>
                        )}
                    */}
                    <Link href="/orders">
                        <Button className="rounded-none h-11 px-8 text-[10px] uppercase tracking-[0.2em]">
                            View orders
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <div className="min-h-screen">
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Secure checkout</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Form Section */}
                <div className="p-6 lg:p-12 space-y-8 lg:border-r border-border/60">
                    {/* Progress */}
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em]">
                        <span className={`transition-colors duration-300 ${step >= 1 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>1. Shipping</span>
                        <span className="text-border">—</span>
                        <span className={`transition-colors duration-300 ${step >= 2 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>2. Payment</span>
                        <span className="text-border">—</span>
                        <span className={`transition-colors duration-300 ${step >= 3 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>3. Review</span>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Shipping address</h2>
                            </div>
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Full name *</label>
                                    <input
                                        type="text"
                                        value={shippingAddress.name}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full h-11 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Email *</label>
                                    <input
                                        type="email"
                                        value={shippingAddress.email}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full h-11 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Phone number *</label>
                                    <input
                                        type="tel"
                                        value={shippingAddress.phone}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full h-11 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Address *</label>
                                    <textarea
                                        rows={3}
                                        value={shippingAddress.address}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-4 py-3 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none transition-all duration-300"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">City *</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.city}
                                            onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full h-11 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">State</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.state}
                                            onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                                            className="w-full h-11 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">PIN code *</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.pincode}
                                            onChange={(e) => setShippingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                                            className="w-full h-11 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                className="w-full h-13 rounded-none text-[10px] uppercase tracking-[0.2em] font-semibold"
                                onClick={() => {
                                    if (!appliedCoupon && !bargainNudgeDismissed && window.innerWidth < 1024) {
                                        setShowBargainNudge(true)
                                    } else {
                                        setStep(2)
                                    }
                                }}
                                disabled={!isAddressValid()}
                            >
                                Continue to Payment
                            </Button>

                            {/* Mobile Bargain Nudge */}
                            {showBargainNudge && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-4 bg-red-accent/10 border border-red-accent/30 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-accent/20 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="h-4 w-4 text-red-accent" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">You haven&apos;t bargained yet!</p>
                                            <p className="text-xs text-muted-foreground">Negotiate with our AI and get an exclusive discount on your order.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-10 rounded-none text-xs uppercase tracking-wide"
                                            onClick={() => {
                                                setShowBargainNudge(false)
                                                setBargainNudgeDismissed(true)
                                                setStep(2)
                                            }}
                                        >
                                            Skip
                                        </Button>
                                        <Button
                                            className="flex-1 h-10 rounded-none text-xs uppercase tracking-wide bg-red-accent text-white hover:bg-[#8E0000]"
                                            onClick={() => {
                                                setShowBargainNudge(false)
                                                setBargainNudgeDismissed(true)
                                                setTriggerBargainOpen(true)
                                            }}
                                        >
                                            Bargain Now
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Payment method</h2>
                            </div>
                            <div className="space-y-2">
                                {/* COD temporarily disabled — re-add to the array below to re-enable:
                                    { value: "cod", label: "Cash on Delivery (+₹50 fee)" },
                                */}
                                {[
                                    { value: "upi", label: "UPI" },
                                    { value: "card", label: "Credit/Debit Card" },
                                    { value: "netbanking", label: "Net Banking" }
                                ].map((method) => (
                                    <label
                                        key={method.value}
                                        className={`flex items-center gap-3 p-4 border cursor-pointer transition-all duration-300 ${
                                            paymentMethod === method.value
                                                ? "border-foreground bg-secondary/20"
                                                : "border-input hover:border-foreground/50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={method.value}
                                            checked={paymentMethod === method.value}
                                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                            className="accent-foreground"
                                        />
                                        <span className="text-sm">{method.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* COD temporarily disabled — restore when re-enabling:
                                {paymentMethod === "cod" && (
                                    <p className="text-sm text-muted-foreground p-3 bg-secondary/30 border border-border">
                                        A convenience fee of ₹{COD_FEE} will be added for Cash on Delivery orders.
                                    </p>
                                )}
                            */}

                            {/* Coupon Code Input */}
                            <div className="space-y-3 pt-5 border-t border-border/60">
                                <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em]">Have a coupon code?</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        placeholder="Enter coupon code"
                                        className="flex-1 h-11 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring uppercase transition-all duration-300"
                                        disabled={!!appliedCoupon || isValidatingCoupon}
                                    />
                                    <Button
                                        variant="outline"
                                        className="h-11 px-6 rounded-none text-[10px] uppercase tracking-[0.15em]"
                                        onClick={handleValidateCoupon}
                                        disabled={!!appliedCoupon || isValidatingCoupon || !couponInput.trim()}
                                    >
                                        {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                    </Button>
                                </div>
                                {couponError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                        {couponError}
                                    </div>
                                )}
                                {appliedCoupon && (
                                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20">
                                        <span className="text-xs text-green-600 dark:text-green-400 tabular-nums">
                                            ✓ Coupon {appliedCoupon.code} applied — you save ₹{appliedCoupon.discount}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[10px] text-muted-foreground hover:text-foreground"
                                            onClick={() => setAppliedCoupon(null)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-13 rounded-none text-[10px] uppercase tracking-[0.15em]" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button className="flex-1 h-13 rounded-none text-[10px] uppercase tracking-[0.2em] font-semibold" onClick={() => setStep(3)}>
                                    Review order
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Review order</h2>
                            </div>
                            
                            {/* Shipping Address Summary */}
                            <div className="p-4 bg-secondary/10 border border-border/60 space-y-1">
                                <p className="font-medium text-sm">{shippingAddress.name}</p>
                                <p className="text-xs text-muted-foreground">{shippingAddress.address}</p>
                                <p className="text-xs text-muted-foreground">
                                    {shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ""} - {shippingAddress.pincode}
                                </p>
                                <p className="text-xs text-muted-foreground tabular-nums">{shippingAddress.phone}</p>
                            </div>

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={`${item.id}-${item.size}`} className="flex gap-4 border-b border-border/60 pb-4">
                                        <div
                                            className="w-14 h-18 bg-cover bg-center bg-muted/30 flex-shrink-0"
                                            style={{ backgroundImage: `url(${item.image})` }}
                                        />
                                        <div className="flex-1 space-y-0.5">
                                            <h3 className="font-medium text-sm">{item.name}</h3>
                                            <p className="text-xs text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                                            <p className="font-semibold text-sm tabular-nums">{item.displayPrice}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-13 rounded-none text-[10px] uppercase tracking-[0.15em]" onClick={() => setStep(2)}>
                                    Back
                                </Button>
                                <Button 
                                    className="flex-1 h-13 rounded-none text-[10px] uppercase tracking-[0.2em] font-semibold" 
                                    onClick={handlePlaceOrder}
                                    disabled={isPlacingOrder}
                                >
                                    {isPlacingOrder ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Place order"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="p-6 lg:p-12 bg-secondary/10">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">Order summary</h2>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={`${item.id}-${item.size}`} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{item.name} ({item.size}) × {item.quantity}</span>
                                <span className="tabular-nums">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                            </div>
                        ))}
                        <hr className="border-border/60" />
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="tabular-nums">₹{totalPrice.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Shipping {totalPrice >= FREE_SHIPPING_THRESHOLD && <span className="text-green-600 dark:text-green-400">(Free above {FREE_SHIPPING_THRESHOLD_DISPLAY})</span>}</span>
                            <span className="tabular-nums">{shippingCost === 0 ? "FREE" : `₹${shippingCost}`}</span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                                <span>Discount ({appliedCoupon.code})</span>
                                <span className="tabular-nums">-₹{appliedCoupon.discount}</span>
                            </div>
                        )}
                        {/* COD temporarily disabled — restore when re-enabling:
                            {paymentMethod === "cod" && (
                                <div className="flex justify-between text-xs">
                                    <span>COD Fee</span>
                                    <span className="tabular-nums">₹{COD_FEE}</span>
                                </div>
                            )}
                        */}
                        <hr className="border-border/60" />
                        <div className="flex justify-between text-sm font-semibold pt-1">
                            <span>Total</span>
                            <span className="tabular-nums">₹{Math.max(0, finalTotal).toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    {/* Bargain Chatbot */}
                    <CheckoutBargain
                        cartItems={items}
                        totalPrice={totalPrice}
                        onApplyCoupon={handleApplyCoupon}
                        appliedCoupon={appliedCoupon}
                        triggerOpen={triggerBargainOpen}
                        onTriggered={() => setTriggerBargainOpen(false)}
                    />
                </div>
            </div>
        </div>
        </>
    )
}

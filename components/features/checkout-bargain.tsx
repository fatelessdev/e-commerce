"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Send, Copy, Check, Sparkles, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface BargainMessage {
    id: string
    role: "user" | "assistant"
    content: string
}

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
}

interface CheckoutBargainProps {
    cartItems: CartItem[]
    totalPrice: number
    onApplyCoupon: (discount: number, code: string) => void
    appliedCoupon: { code: string; discount: number } | null
    triggerOpen?: boolean
    onTriggered?: () => void
}

export function CheckoutBargain({ cartItems, totalPrice, onApplyCoupon, appliedCoupon, triggerOpen, onTriggered }: CheckoutBargainProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showPrompt, setShowPrompt] = useState(true)
    const [couponGenerated, setCouponGenerated] = useState<{ code: string; discount: number; expiresAt: number } | null>(null)
    const [copied, setCopied] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
    const [couponExpired, setCouponExpired] = useState(false)
    const [messages, setMessages] = useState<BargainMessage[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [negotiationRound, setNegotiationRound] = useState(0)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Allow parent to programmatically open the bargain chat
    useEffect(() => {
        if (triggerOpen && !isOpen && !appliedCoupon) {
            handleOpenBargain()
            onTriggered?.()
        }
    }, [triggerOpen]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
    }

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: BargainMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: input.trim()
        }

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        // Increment round for each user message
        const currentRound = negotiationRound + 1
        setNegotiationRound(currentRound)

        try {
            const response = await fetch("/api/bargain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    cartItems: cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    cartTotal: totalPrice,
                    negotiationRound: currentRound
                })
            })

            if (!response.ok) throw new Error("Failed to get response")

            // Check headers for coupon info
            const couponCode = response.headers.get("X-Coupon-Code")
            const couponDiscount = response.headers.get("X-Coupon-Discount")
            const couponExpires = response.headers.get("X-Coupon-Expires")

            if (couponCode && couponDiscount && couponExpires) {
                const expiresAt = parseInt(couponExpires)
                setCouponGenerated({
                    code: couponCode,
                    discount: parseInt(couponDiscount),
                    expiresAt
                })
                setCouponExpired(false)
                setTimeRemaining(Math.floor((expiresAt - Date.now()) / 1000))
            }

            // Stream the response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            const assistantMessage: BargainMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: ""
            }

            setMessages(prev => [...prev, assistantMessage])

            if (reader) {
                let done = false
                while (!done) {
                    const { value, done: readerDone } = await reader.read()
                    done = readerDone
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true })
                        assistantMessage.content += chunk
                        setMessages(prev => 
                            prev.map(m => m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m)
                        )
                    }
                }
            }
        } catch (error) {
            console.error("Bargain error:", error)
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Oops, something went wrong! Let's try again 😅"
            }])
        } finally {
            setIsLoading(false)
        }
    }, [input, isLoading, messages, cartItems, totalPrice, negotiationRound])

    // Countdown timer effect
    useEffect(() => {
        if (!couponGenerated || couponExpired) return

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((couponGenerated.expiresAt - Date.now()) / 1000))
            setTimeRemaining(remaining)

            if (remaining === 0) {
                setCouponExpired(true)
                clearInterval(interval)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [couponGenerated, couponExpired])

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])

    const handleOpenBargain = () => {
        setShowPrompt(false)
        setIsOpen(true)

        // Send initial greeting message
        if (messages.length === 0) {
            setMessages([{
                id: "system-greeting",
                role: "assistant",
                content: "Hey there! 👋 Looking for a deal on your cart? Tell me - kitna discount chahiye?"
            }])
        }
    }

    const handleCopyCode = async () => {
        if (couponGenerated && !couponExpired) {
            await navigator.clipboard.writeText(couponGenerated.code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleApplyCoupon = () => {
        if (couponGenerated && !appliedCoupon && !couponExpired) {
            onApplyCoupon(couponGenerated.discount, couponGenerated.code)
        }
    }

    const handleSkip = () => {
        setShowPrompt(false)
    }

    const handleReNegotiate = () => {
        setCouponGenerated(null)
        setCouponExpired(false)
        setTimeRemaining(null)
        setNegotiationRound(0)
        setMessages([{
            id: "re-negotiate",
            role: "assistant",
            content: "Okay let's try again! 🔄 What discount are you looking for this time?"
        }])
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // If coupon already applied, don't show bargain option
    if (appliedCoupon && !isOpen) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/30 mt-4">
                <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-600 dark:text-green-400">
                        Coupon {appliedCoupon.code} applied! Saving ₹{appliedCoupon.discount}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Bargain Prompt */}
            {showPrompt && !appliedCoupon && (
                <div className="mt-6 p-4 bg-gold/10 border border-gold/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Want a bargain? 💰</p>
                                <p className="text-xs text-muted-foreground">Negotiate with our AI for an exclusive discount!</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs rounded-none"
                                onClick={handleSkip}
                            >
                                Skip
                            </Button>
                            <Button
                                size="sm"
                                className="text-xs rounded-none bg-gold text-black hover:bg-gold-dark"
                                onClick={handleOpenBargain}
                            >
                                Yes! 🎉
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bargain Chatbot Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-background border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="p-4 bg-gold text-black flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                                <span className="font-bold tracking-tight uppercase text-sm">Bargain AI</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-black hover:bg-black/10"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div ref={chatContainerRef} className="h-72 p-4 overflow-y-auto space-y-4 bg-secondary/20">
                            {messages.map((msg) => (
                                <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[85%] p-3 text-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card border border-border"
                                    )}>
                                        <div className="whitespace-pre-wrap">
                                            {msg.content.split('**').map((part, i) =>
                                                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-card border border-border p-3 text-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Coupon Display & Timer */}
                        {couponGenerated && (
                            <div className="p-4 border-t bg-background space-y-3">
                                {/* Timer */}
                                {timeRemaining !== null && (
                                    <div className={cn(
                                        "flex items-center justify-center gap-2 text-sm font-medium",
                                        couponExpired ? "text-red-500" : timeRemaining <= 60 ? "text-orange-500" : "text-green-600"
                                    )}>
                                        <Clock className="h-4 w-4" />
                                        {couponExpired ? (
                                            <span>Code expired!</span>
                                        ) : (
                                            <span>Expires in {formatTime(timeRemaining)}</span>
                                        )}
                                    </div>
                                )}

                                {/* Coupon Display */}
                                <div className={cn(
                                    "flex items-center gap-2 p-3 border",
                                    couponExpired 
                                        ? "bg-red-500/10 border-red-500/30 opacity-60" 
                                        : "bg-gold/10 border-gold/30"
                                )}>
                                    <code className={cn(
                                        "flex-1 font-mono font-bold text-lg text-center",
                                        couponExpired && "line-through"
                                    )}>
                                        {couponGenerated.code}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-none"
                                        onClick={handleCopyCode}
                                        disabled={couponExpired}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {/* Apply Button or Re-negotiate */}
                                {couponExpired ? (
                                    <Button
                                        className="w-full h-12 rounded-none uppercase tracking-widest"
                                        onClick={handleReNegotiate}
                                    >
                                        Try Again 🔄
                                    </Button>
                                ) : !appliedCoupon ? (
                                    <Button
                                        className="w-full h-12 rounded-none uppercase tracking-widest bg-gold text-black hover:bg-gold-dark"
                                        onClick={handleApplyCoupon}
                                    >
                                        Apply ₹{couponGenerated.discount} Discount
                                    </Button>
                                ) : (
                                    <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium py-2">
                                        ✅ Coupon Applied Successfully!
                                    </div>
                                )}

                                <Button
                                    variant="ghost"
                                    className="w-full text-xs text-muted-foreground"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Continue to Checkout
                                </Button>
                            </div>
                        )}

                        {/* Chat Input (only if no coupon generated yet) */}
                        {!couponGenerated && (
                            <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Ask for a discount..."
                                        className="flex-1 px-3 py-2 border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="rounded-none bg-gold text-black hover:bg-gold-dark"
                                        disabled={isLoading || !input.trim()}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

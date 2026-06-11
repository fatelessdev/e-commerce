"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
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
    comboId?: string
    comboGroupId?: string
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
    const triggerOpenRef = useRef(triggerOpen)
    triggerOpenRef.current = triggerOpen
    const isOpenRef = useRef(isOpen)
    isOpenRef.current = isOpen
    const appliedCouponRef = useRef(appliedCoupon)
    appliedCouponRef.current = appliedCoupon
    const onTriggeredRef = useRef(onTriggered)
    onTriggeredRef.current = onTriggered

    const handleOpenBargain = useCallback(() => {
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
    }, [messages.length])

    useEffect(() => {
        if (triggerOpenRef.current && !isOpenRef.current && !appliedCouponRef.current) {
            handleOpenBargain()
            onTriggeredRef.current?.()
        }
    }, [triggerOpen, handleOpenBargain])

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
                        price: item.price,
                        comboId: item.comboId,
                        comboGroupId: item.comboGroupId,
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
                content: "Something went wrong on our end. Let's try that again 😅"
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

    const bargainModal = isOpen && typeof document !== "undefined" ? createPortal(
        <div
            style={{ willChange: "opacity" }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
            <div
                style={{ willChange: "transform, opacity" }}
                className="w-full max-w-md bg-background border border-foreground/20 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.08)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border-t-2 border-t-red-accent rounded-none"
            >
                {/* Header */}
                <div className="p-4 bg-background border-b border-foreground/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-accent"></span>
                        </span>
                        <span className="font-bold tracking-[0.25em] uppercase text-[10px] text-foreground">Bargain Terminal</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-foreground hover:bg-foreground/10 hover:text-foreground rounded-none"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close bargain terminal"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Chat Area */}
                <div 
                    ref={chatContainerRef} 
                    className="h-80 p-4 overflow-y-auto space-y-4 bg-secondary/5 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent"
                >
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[85%] p-3.5 text-[11px] leading-relaxed tracking-wide rounded-none font-medium",
                                msg.role === 'user'
                                    ? "bg-foreground text-background"
                                    : "bg-card border border-foreground/10 text-foreground"
                            )}>
                                <div className="whitespace-pre-wrap">
                                    {msg.content.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-card border border-foreground/10 rounded-none p-3.5 text-xs">
                                <div className="flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-red-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-red-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-red-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Coupon Display & Timer */}
                {couponGenerated && (
                    <div className="p-4 border-t border-foreground/10 bg-background space-y-4">
                        {/* Timer */}
                        {timeRemaining !== null && (
                            <div className={cn(
                                "flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold",
                                couponExpired ? "text-red-500" : timeRemaining <= 60 ? "text-orange-500 animate-pulse" : "text-green-600 dark:text-green-400"
                            )}>
                                <Clock className="h-3.5 w-3.5" />
                                {couponExpired ? (
                                    <span>Offer Expired</span>
                                ) : (
                                    <span>Accept within {formatTime(timeRemaining)}</span>
                                )}
                            </div>
                        )}

                        {/* Coupon Display */}
                        <div className={cn(
                            "flex items-center gap-3 p-4 border rounded-none",
                            couponExpired
                                ? "bg-red-500/5 border-red-500/20 opacity-50"
                                : "bg-red-accent/5 border-red-accent/20"
                        )}>
                            <code className={cn(
                                "flex-1 font-mono font-black text-xl text-center tracking-widest text-foreground",
                                couponExpired && "line-through"
                            )}>
                                {couponGenerated.code}
                            </code>
                            <Button
                                size="icon"
                                variant="outline"
                                className="rounded-none h-10 w-10 border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
                                onClick={handleCopyCode}
                                disabled={couponExpired}
                                aria-label="Copy coupon code"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>

                        {/* Apply Button or Re-negotiate */}
                        {couponExpired ? (
                            <Button
                                className="w-full h-11 rounded-none text-[10px] uppercase tracking-[0.2em] font-bold bg-foreground text-background hover:bg-foreground/95"
                                onClick={handleReNegotiate}
                            >
                                Try again 🔄
                            </Button>
                        ) : !appliedCoupon ? (
                            <Button
                                className="w-full h-11 rounded-none text-[10px] uppercase tracking-[0.2em] font-bold bg-red-accent text-white hover:bg-red-accent/90"
                                onClick={handleApplyCoupon}
                            >
                                Apply ₹{couponGenerated.discount} discount
                            </Button>
                        ) : (
                            <div className="text-center text-[10px] uppercase tracking-[0.2em] text-green-600 dark:text-green-400 font-bold py-2">
                                ✓ Coupon Applied Successfully
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            className="w-full text-[9px] text-muted-foreground uppercase tracking-[0.2em] rounded-none hover:bg-foreground/5 font-semibold"
                            onClick={() => setIsOpen(false)}
                        >
                            Continue to checkout
                        </Button>
                    </div>
                )}

                {/* Chat Input (only if no coupon generated yet) */}
                {!couponGenerated && (
                    <form onSubmit={handleSubmit} className="p-4 border-t border-foreground/10 bg-background">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="NEGOTIATE YOUR PRICE..."
                                aria-label="Bargain message input"
                                className="flex-1 px-3 py-2.5 border bg-background text-[11px] tracking-wider focus:outline-none focus:border-foreground border-foreground/15 rounded-none uppercase"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-none h-10 w-10 bg-foreground text-background hover:bg-red-accent hover:text-white transition-colors border-0"
                                disabled={isLoading || !input.trim()}
                                aria-label="Send message"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    ) : null

    // If coupon already applied, don't show bargain option
    if (appliedCoupon && !isOpen) {
        return (
            <div className="p-4 bg-green-500/5 border border-green-500/20 mt-4 rounded-none">
                <div className="flex items-center gap-2.5 text-xs uppercase tracking-[0.15em] font-bold">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
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
                <div className="mt-6 p-4 bg-red-accent/5 border border-red-accent/15 animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-none shadow-[4px_4px_0px_0px_rgba(219,39,119,0.05)]">
                    <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-none bg-red-accent/10 flex items-center justify-center border border-red-accent/20">
                                <Sparkles className="h-4 w-4 text-red-accent" />
                            </div>
                            <div>
                                <p className="font-bold text-xs uppercase tracking-wider text-foreground">Want a bargain? 💰</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide uppercase">Negotiate with our AI for an exclusive discount</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-[9px] rounded-none uppercase tracking-[0.2em] font-bold border-foreground/20 hover:bg-foreground/5"
                                onClick={handleSkip}
                            >
                                Skip
                            </Button>
                            <Button
                                size="sm"
                                className="text-[9px] rounded-none bg-red-accent text-white hover:bg-red-accent/90 uppercase tracking-[0.2em] font-bold border-0 shadow-sm"
                                onClick={handleOpenBargain}
                            >
                                Bargain
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {bargainModal}
        </>
    )
}

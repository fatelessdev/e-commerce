"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductContext {
    id?: string
    name: string
    mrp: number
    sellingPrice: number
    category?: string
    fabric?: string
    features?: string[]
    sizes?: string[]
    description?: string
}

interface ProductAssistantProps {
    productContext?: ProductContext
}

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
}

function getWelcomeMessage(ctx?: ProductContext): Message {
    return {
        id: "welcome",
        role: "assistant",
        content: ctx
            ? `Hey! 👋 Checking out the ${ctx.name}? Great choice! Ask me anything - sizing, fabric, styling tips, or care instructions!`
            : "Hey! 👋 Got questions about this product? I'm here to help! Ask me about sizing, fabric, care, or anything else.",
    }
}

/**
 * ProductAssistant - A Q&A chatbot for product inquiries
 * Note: For discount negotiation, use CheckoutBargain component at checkout instead.
 */
export function ProductAssistant({ productContext }: ProductAssistantProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([getWelcomeMessage(productContext)])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        // Simple local response for common questions (no AI call for product Q&A)
        // This keeps the component self-contained without needing API changes
        setTimeout(() => {
            let response = ""
            const question = userMessage.content.toLowerCase()

            if (question.includes("size") || question.includes("fit")) {
                response = productContext?.sizes 
                    ? `This comes in sizes: ${productContext.sizes.join(", ")}. For the best fit, we recommend going true to size. If you prefer a more relaxed fit, size up!`
                    : "This fits true to size. Check the size chart for exact measurements!"
            } else if (question.includes("fabric") || question.includes("material")) {
                response = productContext?.fabric 
                    ? `This is made from ${productContext.fabric}. Premium quality, feels great on skin! 👌`
                    : "Made from premium quality fabric for lasting comfort and style."
            } else if (question.includes("wash") || question.includes("care")) {
                response = "Machine wash cold with similar colors. Tumble dry low. Easy care! 🧺"
            } else if (question.includes("return") || question.includes("exchange")) {
                response = "Exchanges are allowed within 48 hours for size/color issues. Returns only for defects (unboxing video required). Check our policies page for details!"
            } else if (question.includes("shipping") || question.includes("delivery")) {
                response = "Free shipping on orders above ₹999! Standard delivery takes 5-7 business days. 🚚"
            } else if (question.includes("discount") || question.includes("bargain") || question.includes("offer")) {
                response = "Want a discount? Add items to your cart and check out - you can negotiate with our Bargain AI at checkout! 💰"
            } else if (question.includes("price")) {
                response = productContext 
                    ? `This is priced at ₹${productContext.sellingPrice}. Great value for premium streetwear! Pro tip: negotiate at checkout 😉`
                    : "Check out the price on the product page!"
            } else {
                response = "Great question! For specific details, check the product description or reach out to our support. Anything else I can help with?"
            }

            setMessages((prev) => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: "assistant", content: response },
            ])
            setIsLoading(false)
        }, 500)
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Open Product Assistant"
                    className="h-11 px-5 bg-background text-foreground border border-foreground hover:bg-foreground hover:text-background tracking-[0.25em] uppercase text-[9px] font-bold transition-all duration-200 rounded-none flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)]"
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Ask Xilar Bot</span>
                </button>
            )}

            {isOpen && (
                <div className="w-80 sm:w-96 bg-background border border-foreground/20 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.08)] rounded-none overflow-hidden flex flex-col h-[31.25rem] animate-in slide-in-from-bottom-5 fade-in duration-300 border-t-2 border-t-red-accent">
                    {/* Header */}
                    <div className="p-4 bg-background border-b border-foreground/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-accent"></span>
                            </span>
                            <span className="font-bold tracking-[0.25em] uppercase text-[10px] text-foreground">Xilar Bot</span>
                            {productContext && (
                                <span className="text-[9px] opacity-60 uppercase tracking-[0.15em] text-muted-foreground truncate max-w-[120px]">• {productContext.name}</span>
                            )}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            aria-label="Close Product Assistant"
                            className="h-6 w-6 text-foreground hover:bg-foreground/10 hover:text-foreground rounded-none" 
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-secondary/5 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={cn(
                                    "flex w-full", 
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[85%] p-3.5 text-[11px] leading-relaxed tracking-wide rounded-none font-medium",
                                    msg.role === "user"
                                        ? "bg-foreground text-background"
                                        : "bg-card border border-foreground/10 text-foreground"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
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
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-3 py-2.5 border-t border-foreground/10 bg-background flex gap-2 overflow-x-auto scrollbar-hide">
                        {["Size guide", "Fabric?", "Shipping", "Returns"].map((q) => (
                            <button
                                key={q}
                                onClick={() => setInput(q)}
                                className="text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-2 bg-background border border-foreground/10 hover:border-foreground transition-colors rounded-none whitespace-nowrap"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 border-t border-foreground/10 bg-background flex gap-2">
                        <input
                            className="flex-1 bg-background border border-foreground/10 focus:border-foreground focus:outline-none text-[11px] px-3 py-2 tracking-wide placeholder:text-muted-foreground/30 uppercase rounded-none"
                            placeholder="TYPE YOUR MESSAGE..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            aria-label="Send message"
                            className="h-9 w-9 rounded-none bg-foreground text-background hover:bg-red-accent hover:text-white border-0 transition-colors"
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    )
}

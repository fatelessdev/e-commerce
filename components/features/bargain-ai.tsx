"use client"

import { useState, useEffect, useRef } from "react"
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

/**
 * ProductAssistant - A Q&A chatbot for product inquiries
 * Note: For discount negotiation, use CheckoutBargain component at checkout instead.
 */
export function ProductAssistant({ productContext }: ProductAssistantProps) {
    const [isOpen, setIsOpen] = useState(false)
    const getWelcomeMessage = (ctx?: ProductContext): Message => ({
        id: "welcome",
        role: "assistant",
        content: ctx
            ? `Hey! 👋 Checking out the ${ctx.name}? Great choice! Ask me anything - sizing, fabric, styling tips, or care instructions!`
            : "Hey! 👋 Got questions about this product? I'm here to help! Ask me about sizing, fabric, care, or anything else.",
    })

    const [messages, setMessages] = useState<Message[]>([getWelcomeMessage(productContext)])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const prevProductIdRef = useRef(productContext?.id)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Reset chat when product changes
    if (productContext?.id !== prevProductIdRef.current) {
        prevProductIdRef.current = productContext?.id
        if (productContext) {
            setMessages([getWelcomeMessage(productContext)])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
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
                <Button
                    onClick={() => setIsOpen(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-2xl bg-foreground text-background hover:scale-110 transition-transform duration-300"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            )}

            {isOpen && (
                <div className="w-80 sm:w-96 bg-background border border-border shadow-2xl rounded-lg overflow-hidden flex flex-col h-125 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="p-4 bg-foreground text-background flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="font-bold tracking-tight">Product Assistant</span>
                            {productContext && (
                                <span className="text-xs opacity-70">• {productContext.name}</span>
                            )}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-background hover:text-background/80" 
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-secondary/30">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={cn(
                                    "flex w-full", 
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[80%] p-3 text-sm rounded-lg",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-card border border-border rounded-bl-none"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
                            <div className="flex justify-start">
                                <div className="bg-card border border-border rounded-lg rounded-bl-none p-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-3 py-2 border-t bg-secondary/20 flex gap-2 overflow-x-auto">
                        {["Size guide", "Fabric?", "Shipping", "Returns"].map((q) => (
                            <button
                                key={q}
                                onClick={() => setInput(q)}
                                className="text-xs px-3 py-1 bg-secondary/50 hover:bg-secondary border border-border rounded-full whitespace-nowrap transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 border-t bg-background flex gap-2">
                        <input
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
                            placeholder="Ask about this product..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            className="rounded-full h-8 w-8"
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    )
}

// Keep old export for backwards compatibility (deprecated - use ProductAssistant instead)
export const BargainAI = ProductAssistant

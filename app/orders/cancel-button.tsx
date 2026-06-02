"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, XCircle } from "lucide-react"
import { cancelOrder } from "@/lib/actions/orders"

export function CancelOrderButton({ orderId }: { orderId: string }) {
    const router = useRouter()
    const [confirming, setConfirming] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    const handleCancel = async () => {
        setCancelling(true)
        const result = await cancelOrder(orderId)
        if (!result.success) {
            alert(result.error || "Failed to cancel order")
        } else {
            router.refresh()
        }
        setCancelling(false)
        setConfirming(false)
    }

    if (confirming) {
        return (
            <div className="flex items-center gap-2 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground mr-auto">Cancel this order?</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none text-xs uppercase"
                    onClick={() => setConfirming(false)}
                    disabled={cancelling}
                >
                    No, Keep
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-none text-xs uppercase"
                    onClick={handleCancel}
                    disabled={cancelling}
                >
                    {cancelling ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Cancelling...</>
                    ) : (
                        "Yes, Cancel"
                    )}
                </Button>
            </div>
        )
    }

    return (
        <div className="pt-4 border-t border-border">
            <Button
                variant="outline"
                size="sm"
                className="rounded-none text-xs uppercase tracking-wide text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
                onClick={() => setConfirming(true)}
            >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancel Order
            </Button>
        </div>
    )
}

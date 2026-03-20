"use client"

import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            await authClient.requestPasswordReset({
                email,
                redirectTo: "/reset-password",
            }, {
                onResponse: () => setIsLoading(false),
                onSuccess: () => setSuccess(true),
                onError: (ctx: { error: { message: string } }) => setError(ctx.error.message),
            })
        } catch {
            setError("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase">
                        {success ? "Check your email" : "Forgot password"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {success
                            ? `We sent a reset link to ${email}. It expires in 1 hour.`
                            : "Enter your email and we'll send you a link to reset your password."
                        }
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-13 rounded-none uppercase tracking-[0.2em] text-xs font-semibold mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Send reset link"
                            )}
                        </Button>
                    </form>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full h-13 rounded-none uppercase tracking-[0.15em] text-xs"
                        onClick={() => setSuccess(false)}
                    >
                        Didn&apos;t receive it? Try again
                    </Button>
                )}

                <div className="text-center">
                    <Link
                        href="/account"
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-300 inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}

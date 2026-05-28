"use client"

import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-6 text-center">
                    <h1 className="font-display text-3xl md:text-4xl">
                        Invalid link
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        This reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link href="/forgot-password">
                        <Button variant="outline" className="rounded-none h-11 text-[10px] uppercase tracking-[0.2em]">
                            Request new link
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            await authClient.resetPassword({
                newPassword: password,
                token,
            }, {
                onResponse: () => setIsLoading(false),
                onSuccess: () => {
                    setSuccess(true)
                    setTimeout(() => router.replace("/account"), 2000)
                },
                onError: (ctx: { error: { message: string } }) => setError(ctx.error.message),
            })
        } catch {
            setError("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                        <Check className="h-7 w-7 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl md:text-4xl">
                            Password updated
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Your password has been reset. Redirecting to sign in...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="font-display text-3xl md:text-4xl">
                        Set new password
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter a new password for your account.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">New password</label>
                        <input
                            type="password"
                            placeholder="Min. 8 characters"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Confirm password</label>
                        <input
                            type="password"
                            placeholder="Re-enter password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            "Reset password"
                        )}
                    </Button>
                </form>

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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import { Package, Heart, LogOut, Shield, Loader2, Wallet } from "lucide-react"
import Link from "next/link"
import { useState, Suspense } from "react"
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client"
import { useSearchParams, useRouter } from "next/navigation"

function AccountContent() {
    const { data: session, isPending } = useSession()
    const searchParams = useSearchParams()
    const router = useRouter()
    const redirect = searchParams.get("redirect") || "/"
    
    const [showLogin, setShowLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState("")
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            if (showLogin) {
                const result = await signIn.email({
                    email: formData.email,
                    password: formData.password,
                })
                if (result.error) {
                    setError(result.error.message || "Failed to sign in")
                } else {
                    router.push(redirect)
                }
            } else {
                const result = await signUp.email({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                })
                if (result.error) {
                    setError(result.error.message || "Failed to create account")
                } else {
                    router.push(redirect)
                }
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        router.refresh()
    }

    const handleGoogleSignIn = async () => {
        setError("")
        setIsGoogleLoading(true)

        try {
            const result = await signIn.social({
                provider: "google",
                callbackURL: redirect,
            })

            if (result?.error) {
                setError(result.error.message || "Failed to continue with Google")
            }
        } catch {
            setError("Failed to continue with Google")
        } finally {
            setIsGoogleLoading(false)
        }
    }

    if (isPending) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-red-accent" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Loading account</p>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="font-display text-3xl md:text-4xl">
                            {showLogin ? "Welcome back" : "Join XILAR"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {showLogin ? "Sign in to your account" : "Create an account to get started"}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-none text-xs uppercase tracking-[0.15em] font-medium"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Continue with Google"
                            )}
                        </Button>

                        <div className="relative py-1 text-center">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/60" />
                            </div>
                            <span className="relative bg-background px-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>

                        {!showLogin && (
                            <div className="space-y-1.5">
                                <label htmlFor="signup-name" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Full name</label>
                                <input
                                    id="signup-name"
                                    type="text"
                                    placeholder="Your name"
                                    required={!showLogin}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-12 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label htmlFor="auth-email" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Email</label>
                            <input
                                id="auth-email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-12 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="auth-password" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Password</label>
                            <input
                                id="auth-password"
                                type="password"
                                placeholder="Min. 8 characters"
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full h-12 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                            />
                            {showLogin && (
                                <Link
                                    href="/forgot-password"
                                    className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-300 block pt-1"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>
                        {!showLogin && (
                            <div className="space-y-1.5">
                                <label htmlFor="signup-phone" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Phone (optional)</label>
                                <input
                                    id="signup-phone"
                                    type="tel"
                                    placeholder="+91 XXXXXXXXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-12 px-4 bg-secondary/30 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
                                />
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full h-13 rounded-none uppercase tracking-[0.2em] text-xs font-semibold mt-2"
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                showLogin ? "Sign in" : "Create account"
                            )}
                        </Button>
                    </form>

                    <div className="text-center">
                        <button
                            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-300"
                            onClick={() => {
                                setShowLogin(!showLogin)
                                setError("")
                            }}
                        >
                            {showLogin ? "No account yet? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const isAdmin = (session.user as { role?: string }).role === "admin"

    return (
        <div className="min-h-screen">
            <div className="px-6 md:px-12 py-14 md:py-20 border-b border-border/60">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Account</p>
                <h1 className="font-display text-4xl md:text-6xl">
                    My account
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Welcome back, {session.user.name}
                </p>
            </div>

            <div className="p-6 md:px-12 max-w-2xl">
                <div className="space-y-3">
                    {isAdmin && (
                        <Link href="/admin" className="flex items-center gap-4 p-5 border border-red-accent/20 bg-red-accent/5 hover:border-red-accent/40 transition-all duration-300">
                            <Shield className="h-5 w-5 text-red-accent" />
                            <div>
                                <h3 className="font-medium text-sm">Admin dashboard</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage products, orders, and coupons</p>
                            </div>
                        </Link>
                    )}

                    <Link href="/orders" className="flex items-center gap-4 p-5 border border-border/60 hover:border-foreground/20 transition-all duration-300">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h3 className="font-medium text-sm">My orders</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Track, return, or buy things again</p>
                        </div>
                    </Link>

                    <Link href="/wishlist" className="flex items-center gap-4 p-5 border border-border/60 hover:border-foreground/20 transition-all duration-300">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h3 className="font-medium text-sm">Wishlist</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Your saved items</p>
                        </div>
                    </Link>

                    <Link href="/account/wallet" className="flex items-center gap-4 p-5 border border-border/60 hover:border-foreground/20 transition-all duration-300">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <div><h3 className="font-medium text-sm">Wallet</h3><p className="text-xs text-muted-foreground mt-0.5">Add funds, refunds, and XILAR-only spending</p></div>
                    </Link>

                    <button
                        className="flex items-center gap-4 p-5 border border-border/60 hover:border-destructive/30 transition-all duration-300 w-full text-left"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h3 className="font-medium text-sm">Sign out</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Sign out of your account</p>
                        </div>
                    </button>
                </div>

                {/* Account Info */}
                <div className="mt-10 p-5 border border-border/60">
                    <h3 className="font-medium text-sm mb-4">Account information</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <span>{session.user.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <span>{session.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Member since</span>
                            <span className="tabular-nums">{new Date(session.user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AccountPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-red-accent" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Loading</p>
            </div>
        }>
            <AccountContent />
        </Suspense>
    )
}

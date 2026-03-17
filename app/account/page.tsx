"use client"

import { Button } from "@/components/ui/button"
import { User, Package, Heart, LogOut, Shield, Loader2 } from "lucide-react"
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

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tighter uppercase">
                            {showLogin ? "Welcome Back" : "Join XILAR"}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {showLogin ? "Sign in to your account" : "Create an account to get started"}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!showLogin && (
                            <input
                                type="text"
                                placeholder="Full Name"
                                required={!showLogin}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-12 px-4 bg-secondary/50 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-12 px-4 bg-secondary/50 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full h-12 px-4 bg-secondary/50 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        {!showLogin && (
                            <input
                                type="tel"
                                placeholder="Phone Number (optional)"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full h-12 px-4 bg-secondary/50 border border-input rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        )}
                        <Button
                            type="submit"
                            className="w-full h-14 rounded-none uppercase tracking-widest"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                showLogin ? "Sign In" : "Create Account"
                            )}
                        </Button>
                    </form>

                    <div className="text-center">
                        <button
                            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                            onClick={() => {
                                setShowLogin(!showLogin)
                                setError("")
                            }}
                        >
                            {showLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const isAdmin = (session.user as { role?: string }).role === "admin"

    return (
        <div className="min-h-screen">
            <div className="px-6 py-12 border-b border-border">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase flex items-center gap-4">
                    <User className="h-10 w-10" /> My Account
                </h1>
                <p className="text-muted-foreground mt-2">
                    Welcome back, {session.user.name}!
                </p>
            </div>

            <div className="p-6 max-w-2xl">
                <div className="space-y-4">
                    {isAdmin && (
                        <Link href="/admin" className="flex items-center gap-4 p-4 border border-primary/50 bg-primary/5 hover:border-primary transition-colors">
                            <Shield className="h-6 w-6 text-primary" />
                            <div>
                                <h3 className="font-medium">Admin Dashboard</h3>
                                <p className="text-sm text-muted-foreground">Manage products, orders, and coupons</p>
                            </div>
                        </Link>
                    )}

                    <Link href="/orders" className="flex items-center gap-4 p-4 border border-border hover:border-foreground transition-colors">
                        <Package className="h-6 w-6" />
                        <div>
                            <h3 className="font-medium">My Orders</h3>
                            <p className="text-sm text-muted-foreground">Track, return, or buy things again</p>
                        </div>
                    </Link>

                    <Link href="/wishlist" className="flex items-center gap-4 p-4 border border-border hover:border-foreground transition-colors">
                        <Heart className="h-6 w-6" />
                        <div>
                            <h3 className="font-medium">Wishlist</h3>
                            <p className="text-sm text-muted-foreground">Your saved items</p>
                        </div>
                    </Link>

                    <button
                        className="flex items-center gap-4 p-4 border border-border hover:border-destructive transition-colors w-full text-left"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-6 w-6" />
                        <div>
                            <h3 className="font-medium">Sign Out</h3>
                            <p className="text-sm text-muted-foreground">Sign out of your account</p>
                        </div>
                    </button>
                </div>

                {/* Account Info */}
                <div className="mt-8 p-4 border border-border">
                    <h3 className="font-medium mb-4">Account Information</h3>
                    <div className="space-y-2 text-sm">
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
                            <span>{new Date(session.user.createdAt).toLocaleDateString()}</span>
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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <AccountContent />
        </Suspense>
    )
}

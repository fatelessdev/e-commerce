"use client"

import { createContext, useContext, useState, useEffect } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
    mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        queueMicrotask(() => {
            const stored = localStorage.getItem("xilar-theme") as Theme | null
            const preferredTheme = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
            setThemeState(preferredTheme)
            setMounted(true)
        })
    }, [])

    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement
        if (theme === "dark") {
            root.classList.add("dark")
            root.classList.remove("light")
        } else {
            root.classList.add("light")
            root.classList.remove("dark")
        }
        localStorage.setItem("xilar-theme", theme)
    }, [theme, mounted])

    const toggleTheme = () => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
    }

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}

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
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === "undefined") return "dark"
        const stored = localStorage.getItem("xilar-theme") as Theme | null
        if (stored) return stored
        if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light"
        return "dark"
    })
    const [mounted] = useState(() => typeof window !== "undefined")

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

    // Always wrap children in provider - just use default theme before mount
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

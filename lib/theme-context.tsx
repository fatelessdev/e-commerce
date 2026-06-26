"use client"

import { createContext, useContext, useState, useEffect } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function resolveInitialTheme(): Theme {
    if (typeof document === "undefined") {
        return "dark"
    }

    return document.documentElement.classList.contains("light") ? "light" : "dark"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(resolveInitialTheme)

    useEffect(() => {
        const root = document.documentElement
        if (theme === "dark") {
            root.classList.add("dark")
            root.classList.remove("light")
        } else {
            root.classList.add("light")
            root.classList.remove("dark")
        }
        root.style.colorScheme = theme
        localStorage.setItem("xilar-theme", theme)
        document.cookie = `xilar-theme=${theme}; path=/; max-age=31536000; samesite=lax`
    }, [theme])

    const toggleTheme = () => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
    }

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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

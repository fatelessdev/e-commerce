"use client"

import React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

interface ThemeToggleAnimationProps {
  variant?: string
  start?: string
  showLabel?: boolean
}

export default function ThemeToggleButton({
  variant = "circle-blur",
  start = "top-left",
  showLabel = false,
}: ThemeToggleAnimationProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light")
  }, [theme, setTheme])

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="w-9 p-0 h-9 relative group"
      name="Theme Toggle Button"
    >
      <SunIcon className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Theme Toggle</span>
      {showLabel && (
        <>
          <span className="hidden group-hover:block border rounded-full px-2 absolute -top-10">
            {" "}
            variant = {variant}
          </span>
          <span className="hidden group-hover:block border rounded-full px-2 absolute -bottom-10">
            {" "}
            start = {start}
          </span>
        </>
      )}
    </Button>
  )
}

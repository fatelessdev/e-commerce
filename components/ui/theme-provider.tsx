"use client";

import type React from "react";
import { ThemeProvider as XilarThemeProvider } from "@/lib/theme-context";

type ThemeProviderProps = {
  children: React.ReactNode;
} & Record<string, unknown>;

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <XilarThemeProvider>{children}</XilarThemeProvider>;
}

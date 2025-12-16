"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { ThemeToggle } from "./ThemeToggle";
import { ToastContainer } from "./Toast";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ToastContainer />
      {children}
    </NextThemesProvider>
  );
}

// Re-export useTheme from next-themes for compatibility
export { useTheme } from "next-themes";

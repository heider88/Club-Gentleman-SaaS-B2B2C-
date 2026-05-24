"use client"

import { ThemeProvider } from "next-themes"

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} disableTransitionOnChange>
            {children}
        </ThemeProvider>
    )
}

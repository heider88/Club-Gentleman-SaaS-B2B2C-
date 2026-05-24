"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-full md:w-auto flex-1 h-10 bg-dash-panel-alt border border-dash-border-alt opacity-50" />
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 w-full md:w-auto h-10 flex items-center justify-center gap-3 bg-dash-panel-alt border border-dash-border-alt text-dash-text-soft hover:text-dash-text hover:border-dash-text transition-all active:scale-95"
            aria-label="Toggle Theme"
        >
            {theme === "dark" ? (
                <>
                    <Sun className="w-4 h-4" />
                    <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest">Modo Claro</span>
                </>
            ) : (
                <>
                    <Moon className="w-4 h-4" />
                    <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest">Modo Oscuro</span>
                </>
            )}
        </button>
    )
}

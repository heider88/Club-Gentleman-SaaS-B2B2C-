"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()

    // Mobile menu state could go here

    const NAV_ITEMS = [
        { label: "Agenda", href: "/dashboard", icon: "Calendar" },
        { label: "Servicios", href: "/dashboard/services", icon: "Scissors" },
        // La sección de Horarios ahora se gestiona directamente dentro de "Perfil" (schedule_settings JSONB)
        { label: "Perfil / Horarios", href: "/dashboard/profile", icon: "User" },
    ]

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar (Desktop) / Bottom Bar (Mobile) */}
            <aside className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 md:sticky md:top-0 md:h-screen md:w-64 md:border-t-0 md:border-r flex md:flex-col justify-around md:justify-start md:p-6 md:space-y-8">
                <div className="hidden md:block">
                    <h2 className="text-xl font-bold text-primary tracking-tighter leading-none">
                        CLUB GENTLEMAN<br />
                        <span className="text-foreground text-[10px] tracking-[0.3em]">FOR MEN</span>
                    </h2>
                </div>

                <nav className="flex md:flex-col w-full justify-around md:justify-start md:space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col md:flex-row items-center justify-center md:justify-start md:px-4 md:py-3 rounded-xl transition-all gap-1 md:gap-3",
                                    isActive
                                        ? "text-primary md:bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                {/* Simple Icon Placeholder since Lucide is separate import */}
                                <span className="text-xl">
                                    {item.icon === "Calendar" && "📅"}
                                    {item.icon === "Scissors" && "✂️"}
                                    {item.icon === "Lock" && "🔒"}
                                    {item.icon === "Clock" && "🕒"}
                                    {item.icon === "User" && "👤"}
                                </span>
                                <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="hidden md:block mt-auto">
                    <button
                        onClick={() => router.push("/login")}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl w-full"
                    >
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 pb-20 md:pb-0 p-4 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { CalendarDays, Scissors, User, Lock, LogOut, FileText, ImageIcon, Users, XCircle, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "./ThemeToggle"
import { useState } from "react"

export function DashboardSidebar({ role }: { role: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Control de UI Condicional basado en el Rol
    const NAV_ITEMS = [
        { label: "Agenda", href: "/dashboard", icon: CalendarDays, showTo: ['admin', 'barber'] },
        { label: "Mis Clientes", href: "/dashboard/customers", icon: Users, showTo: ['barber'] },
        { label: "Directorio Clientes", href: "/dashboard/admin/customers", icon: Users, showTo: ['admin'] },
        { label: "Canceladas", href: "/dashboard/admin/cancelled", icon: XCircle, showTo: ['admin'] },
        { label: "Mi Historial", href: "/dashboard/history", icon: FileText, showTo: ['barber'] },
        { label: "Reportes", href: "/dashboard/reports", icon: FileText, showTo: ['admin'] },
        { label: "Servicios", href: "/dashboard/services", icon: Scissors, showTo: ['admin'] },
        { label: "Perfil / Horarios", href: "/dashboard/profile", icon: User, showTo: ['admin', 'barber'] },
        { label: "Config Web", href: "/dashboard/admin/gallery", icon: ImageIcon, showTo: ['admin'] }, 
        { label: "Administración", href: "/dashboard/admin", icon: Lock, showTo: ['admin'] }, 
    ].filter(item => item.showTo.includes(role))

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    return (
        <>
            {/* Botón flotante para reabrir el sidebar (solo Desktop) */}
            {isCollapsed && (
                <button 
                    onClick={() => setIsCollapsed(false)}
                    className="hidden md:flex fixed top-4 left-4 z-50 p-2 bg-dash-panel border border-dash-border hover:border-dash-text text-dash-text-soft hover:text-dash-text rounded-lg shadow-xl transition-all"
                    title="Abrir menú"
                >
                    <PanelLeftOpen className="w-5 h-5" />
                </button>
            )}

            <aside className={cn(
                "fixed bottom-0 left-0 right-0 h-16 bg-dash-panel border-t border-dash-border z-50 md:sticky md:top-0 md:h-screen md:border-t-0 md:border-r flex md:flex-col justify-between md:justify-start md:p-6 transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "md:w-0 md:p-0 md:opacity-0 md:border-r-0" : "md:w-64"
            )}>
                <div className="hidden md:flex justify-between items-start mb-12">
                    <div className={cn("transition-opacity duration-200", isCollapsed ? "opacity-0" : "opacity-100")}>
                        <h2 className="font-oswald text-2xl font-medium tracking-tight leading-none text-dash-text uppercase whitespace-nowrap">
                            GENTLEMAN
                        </h2>
                        <div className="mt-4 inline-block px-3 py-1 border border-dash-border-alt bg-dash-panel-alt text-[9px] uppercase font-bold text-dash-text-soft tracking-[0.2em] whitespace-nowrap">
                            {role === 'admin' ? 'Admin' : 'Barbero'}
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCollapsed(true)}
                        className="text-dash-text-muted hover:text-dash-text transition-colors p-1"
                        title="Ocultar menú"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex overflow-x-auto scrollbar-hide flex-nowrap md:flex-col w-full md:justify-start md:space-y-1 md:mb-auto relative items-center md:items-stretch px-2 md:px-0">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className={cn(
                                    "flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-4 py-3 md:py-3.5 transition-all gap-1 md:gap-4 relative group min-w-[64px] shrink-0",
                                    isActive
                                        ? "text-dash-text"
                                        : "text-dash-text-muted hover:text-dash-text-soft"
                                )}
                            >
                                {isActive && <span className="hidden md:block absolute left-0 w-1 h-full bg-dash-text"></span>}
                                <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                                <span className={cn(
                                    "text-[8px] md:text-[9px] lg:text-xs font-bold uppercase tracking-widest hidden md:block whitespace-nowrap transition-opacity duration-200",
                                    isCollapsed ? "opacity-0" : "opacity-100"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                    
                    {/* Controles: Theme y Logout */}
                    <div className="flex flex-row md:flex-col items-center gap-2 mt-0 md:mt-8 ml-auto md:ml-0 w-auto md:w-full shrink-0 pr-2 md:pr-0 border-l md:border-l-0 border-dash-border pl-2 md:pl-0">
                        <div className="hidden md:flex w-full px-4 py-2">
                            <ThemeToggle />
                        </div>
                        {/* Botón de Cerrar Sesión */}
                        <button
                            onClick={handleSignOut}
                            className="flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-4 py-3 md:py-3.5 transition-all gap-1 md:gap-4 text-red-500/70 hover:text-red-500 group relative w-full"
                        >
                            <span className="hidden md:block absolute left-0 w-0 h-full bg-red-500 transition-all group-hover:w-1"></span>
                            <LogOut className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                            <span className={cn(
                                "text-[8px] md:text-[9px] lg:text-xs font-bold uppercase tracking-widest hidden md:block whitespace-nowrap transition-opacity duration-200",
                                isCollapsed ? "opacity-0" : "opacity-100"
                            )}>
                                Salir
                            </span>
                        </button>
                    </div>
                </nav>
            </aside>
        </>
    )
}
"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { CalendarDays, Scissors, User, Lock, LogOut, FileText, ImageIcon, Users, XCircle, PanelLeftClose, PanelLeftOpen, BarChart3, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "./ThemeToggle"
import { useState } from "react"

export function DashboardSidebar({ role }: { role: string }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [finanzasOpen, setFinanzasOpen] = useState(false)

    // Rutas de uso diario para todos
    const CORE_ITEMS = [
        { label: "Agenda", href: "/dashboard", icon: CalendarDays, showTo: ['admin', 'barber'] },
        { label: "Mis Clientes", href: "/dashboard/customers", icon: Users, showTo: ['barber'] },
        { label: "Mi Historial", href: "/dashboard/history", icon: FileText, showTo: ['barber'] },
        { label: "Perfil / Horarios", href: "/dashboard/profile", icon: User, showTo: ['admin', 'barber'] },
    ].filter(item => item.showTo.includes(role))

    // Rutas exclusivas del administrador
    const ADMIN_ITEMS = [
        { label: "Directorio Clientes", href: "/dashboard/admin/customers", icon: Users, showTo: ['admin'] },
        { label: "Canceladas", href: "/dashboard/admin/cancelled", icon: XCircle, showTo: ['admin'] },
        { label: "Servicios", href: "/dashboard/services", icon: Scissors, showTo: ['admin'] },
        { label: "Config Web", href: "/dashboard/admin/gallery", icon: ImageIcon, showTo: ['admin'] }, 
        { label: "Administración", href: "/dashboard/admin", icon: Lock, showTo: ['admin'] }, 
    ].filter(item => item.showTo.includes(role))

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    const isFinanzasActive = pathname === "/dashboard/admin/finanzas";
    const currentTab = searchParams.get('tab') || 'ventas-resumen';

    return (
        <>
            {/* Botón flotante para reabrir el sidebar (solo Desktop) */}
            <div className={cn(
                "hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isCollapsed ? "left-0" : "-left-16"
            )}>
                <button 
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center justify-center w-8 h-24 bg-dash-text hover:bg-primary text-dash-bg rounded-r-2xl shadow-[5px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 group"
                    title="Abrir menú"
                >
                    <div className="flex flex-col gap-1.5 items-center group-hover:scale-110 transition-transform">
                        <div className="w-1 h-1 rounded-full bg-current"></div>
                        <div className="w-1 h-1 rounded-full bg-current"></div>
                        <div className="w-1 h-1 rounded-full bg-current"></div>
                    </div>
                </button>
            </div>

            <aside className={cn(
                "fixed bottom-0 left-0 right-0 h-16 bg-dash-panel border-t border-dash-border z-50 md:sticky md:top-0 md:h-screen md:border-t-0 md:border-r flex md:flex-col justify-between md:justify-start transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
                isCollapsed ? "md:w-0 md:opacity-0 md:border-r-0 md:translate-x-[-100%]" : "md:w-72 md:translate-x-0"
            )}>
                {/* Header Lateral */}
                <div className="hidden md:flex justify-between items-start mb-8 p-6 pb-0 relative group/header shrink-0">
                    <div className={cn("transition-opacity duration-300", isCollapsed ? "opacity-0" : "opacity-100")}>
                        <h2 className="font-oswald text-2xl font-medium tracking-tight leading-none text-dash-text uppercase whitespace-nowrap">
                            GENTLEMAN
                        </h2>
                        <div className="mt-4 inline-block px-3 py-1 border border-dash-border-alt bg-dash-panel-alt text-[9px] uppercase font-bold text-dash-text-soft tracking-[0.2em] whitespace-nowrap">
                            {role === 'admin' ? 'Admin' : 'Barbero'}
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCollapsed(true)}
                        className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-transparent border border-dash-border hover:bg-dash-text hover:border-dash-text text-dash-text-muted hover:text-dash-bg rounded-full transition-all duration-300 opacity-0 group-hover/header:opacity-100 -translate-x-4 group-hover/header:translate-x-0"
                        title="Ocultar menú"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex overflow-x-auto scrollbar-hide flex-nowrap md:flex-col w-full md:justify-start md:space-y-0.5 md:mb-auto relative items-center md:items-stretch px-2 md:px-4 pb-0 md:pb-6 md:overflow-y-auto">
                    
                    {/* CORE LINKS */}
                    <div className="flex md:flex-col md:mb-6 shrink-0 md:shrink">
                        <span className="hidden md:block text-[9px] font-bold uppercase tracking-[0.2em] text-dash-text-muted px-4 py-2 mt-2">Principal</span>
                        {CORE_ITEMS.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={true}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-4 py-3 md:py-2.5 transition-all gap-1 md:gap-3 relative group min-w-[64px] shrink-0 rounded-lg",
                                        isActive
                                            ? "text-dash-text bg-dash-panel-alt/50"
                                            : "text-dash-text-muted hover:text-dash-text hover:bg-white/[0.02]"
                                    )}
                                >
                                    {isActive && <span className="hidden md:block absolute left-0 w-1 h-1/2 bg-dash-text rounded-r-full"></span>}
                                    <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                                    <span className={cn(
                                        "text-[8px] md:text-[10px] font-bold uppercase tracking-widest hidden md:block whitespace-nowrap transition-opacity duration-200",
                                        isCollapsed ? "opacity-0" : "opacity-100"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* FINANZAS & ANALISIS (Solo Admin, Nested Accordion) */}
                    {role === 'admin' && (
                        <div className="flex md:flex-col md:mb-6 shrink-0 md:shrink">
                            <span className="hidden md:block text-[9px] font-bold uppercase tracking-[0.2em] text-dash-text-muted px-4 py-2 mt-2">Business</span>
                            
                            {/* Menú Padre Finanzas */}
                            <button
                                onClick={() => setFinanzasOpen(!finanzasOpen)}
                                className={cn(
                                    "hidden md:flex flex-row items-center justify-between px-4 py-2.5 transition-all gap-3 relative group rounded-lg w-full",
                                    isFinanzasActive || finanzasOpen
                                        ? "text-dash-text bg-dash-panel-alt/30"
                                        : "text-dash-text-muted hover:text-dash-text hover:bg-white/[0.02]"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="w-4 h-4 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                        Finanzas & Análisis
                                    </span>
                                </div>
                                <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", finanzasOpen ? "rotate-180" : "rotate-0")} />
                            </button>

                            {/* Versión Móvil del Botón Padre */}
                            <Link
                                href="/dashboard/admin/finanzas"
                                className={cn(
                                    "flex md:hidden flex-col items-center justify-center px-4 py-3 transition-all gap-1 relative group min-w-[64px] shrink-0",
                                    isFinanzasActive ? "text-dash-text" : "text-dash-text-muted"
                                )}
                            >
                                <BarChart3 className="w-5 h-5 shrink-0" />
                                <span className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">Analíticas</span>
                            </Link>

                            {/* Sub-Items Acordeón (Solo visible en Desktop al desplegar) */}
                            <div className={cn(
                                "hidden md:flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top",
                                finanzasOpen ? "max-h-[500px] opacity-100 mt-2 mb-2" : "max-h-0 opacity-0"
                            )}>
                                {/* Ventas */}
                                <div className="pl-6 border-l border-dash-border ml-6 flex flex-col gap-1 mb-4">
                                    <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-dash-text-soft mb-1">Análisis de Ventas</span>
                                    {[
                                        { label: "Resumen General", tab: "ventas-resumen" },
                                        { label: "Por Servicios", tab: "ventas-servicios" },
                                        { label: "Por Productos", tab: "ventas-productos" },
                                        { label: "Comisiones", tab: "ventas-comisiones" },
                                        { label: "Resumen de Efectivo", tab: "ventas-efectivo" }
                                    ].map(sub => (
                                        <Link 
                                            key={sub.tab} 
                                            href={`/dashboard/admin/finanzas?tab=${sub.tab}`}
                                            className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md transition-all relative flex items-center group",
                                                isFinanzasActive && currentTab === sub.tab 
                                                    ? "text-primary bg-primary/10" 
                                                    : "text-dash-text-muted hover:text-dash-text hover:bg-white/[0.02]"
                                            )}
                                        >
                                            {isFinanzasActive && currentTab === sub.tab && <span className="absolute left-[-13px] w-[5px] h-[1px] bg-primary rounded-full"></span>}
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>

                                {/* Reservas */}
                                <div className="pl-6 border-l border-dash-border ml-6 flex flex-col gap-1 mb-4">
                                    <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-dash-text-soft mb-1">Análisis de Reservas</span>
                                    {[
                                        { label: "Por Días", tab: "reservas-dias" },
                                        { label: "Por Estado", tab: "reservas-estado" },
                                        { label: "Por Fuente", tab: "reservas-fuente" },
                                        { label: "Por Colaborador", tab: "reservas-colaborador" }
                                    ].map(sub => (
                                        <Link 
                                            key={sub.tab} 
                                            href={`/dashboard/admin/finanzas?tab=${sub.tab}`}
                                            className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md transition-all relative flex items-center group",
                                                isFinanzasActive && currentTab === sub.tab 
                                                    ? "text-primary bg-primary/10" 
                                                    : "text-dash-text-muted hover:text-dash-text hover:bg-white/[0.02]"
                                            )}
                                        >
                                            {isFinanzasActive && currentTab === sub.tab && <span className="absolute left-[-13px] w-[5px] h-[1px] bg-primary rounded-full"></span>}
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>

                                {/* Clientes */}
                                <div className="pl-6 border-l border-dash-border ml-6 flex flex-col gap-1">
                                    <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-dash-text-soft mb-1">Análisis del Cliente</span>
                                    {[
                                        { label: "Retención y Frecuencia", tab: "clientes-retencion" },
                                        { label: "Top Clientes", tab: "clientes-top" }
                                    ].map(sub => (
                                        <Link 
                                            key={sub.tab} 
                                            href={`/dashboard/admin/finanzas?tab=${sub.tab}`}
                                            className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md transition-all relative flex items-center group",
                                                isFinanzasActive && currentTab === sub.tab 
                                                    ? "text-primary bg-primary/10" 
                                                    : "text-dash-text-muted hover:text-dash-text hover:bg-white/[0.02]"
                                            )}
                                        >
                                            {isFinanzasActive && currentTab === sub.tab && <span className="absolute left-[-13px] w-[5px] h-[1px] bg-primary rounded-full"></span>}
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADMIN SETTINGS */}
                    {role === 'admin' && (
                        <div className="flex md:flex-col shrink-0 md:shrink">
                            <span className="hidden md:block text-[9px] font-bold uppercase tracking-[0.2em] text-dash-text-muted px-4 py-2 mt-2">Ajustes & Sistema</span>
                            {ADMIN_ITEMS.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch={true}
                                        className={cn(
                                            "flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-4 py-3 md:py-2.5 transition-all gap-1 md:gap-3 relative group min-w-[64px] shrink-0 rounded-lg",
                                            isActive
                                                ? "text-dash-text bg-dash-panel-alt/50"
                                                : "text-dash-text-muted hover:text-dash-text hover:bg-white/[0.02]"
                                        )}
                                    >
                                        {isActive && <span className="hidden md:block absolute left-0 w-1 h-1/2 bg-dash-text rounded-r-full"></span>}
                                        <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                                        <span className={cn(
                                            "text-[8px] md:text-[10px] font-bold uppercase tracking-widest hidden md:block whitespace-nowrap transition-opacity duration-200",
                                            isCollapsed ? "opacity-0" : "opacity-100"
                                        )}>
                                            {item.label}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </nav>

                {/* Footer del Sidebar: Theme y Logout */}
                <div className="flex flex-row md:flex-col items-center gap-2 mt-0 md:mt-auto ml-auto md:ml-0 w-auto md:w-full shrink-0 pr-2 md:px-4 md:pb-6 border-l md:border-l-0 border-dash-border pl-2 md:pl-0">
                    <div className="hidden md:flex w-full px-2 py-2">
                        <ThemeToggle />
                    </div>
                    {/* Botón de Cerrar Sesión */}
                    <button
                        onClick={handleSignOut}
                        className="flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-2 py-3 md:py-2.5 transition-all gap-1 md:gap-3 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 group relative w-full rounded-lg"
                    >
                        <LogOut className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                        <span className={cn(
                            "text-[8px] md:text-[10px] font-bold uppercase tracking-widest hidden md:block whitespace-nowrap transition-opacity duration-200",
                            isCollapsed ? "opacity-0" : "opacity-100"
                        )}>
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>
        </>
    )
}
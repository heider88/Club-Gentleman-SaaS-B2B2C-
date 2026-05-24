"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { CalendarDays, Scissors, User, Lock, LogOut, FileText, ImageIcon, Users, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "./ThemeToggle"

export function DashboardSidebar({ role }: { role: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

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
        <aside className="fixed bottom-0 left-0 right-0 h-16 bg-dash-panel border-t border-dash-border z-50 md:sticky md:top-0 md:h-screen md:w-64 md:border-t-0 md:border-r flex md:flex-col justify-between md:justify-start md:p-8 md:space-y-12">
            <div className="hidden md:block">
                <h2 className="font-oswald text-2xl font-medium tracking-tight leading-none text-dash-text uppercase">
                    CLUB GENTLEMAN
                </h2>
                <div className="mt-4 inline-block px-3 py-1 border border-dash-border-alt bg-dash-panel-alt text-[9px] uppercase font-bold text-dash-text-soft tracking-[0.2em]">
                    {role === 'admin' ? 'Administrador' : 'Barbero'}
                </div>
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
                            <Icon className="w-5 h-5 md:w-4 md:h-4" />
                            <span className="text-[8px] md:text-[9px] lg:text-xs font-bold uppercase tracking-widest hidden md:block whitespace-nowrap">{item.label}</span>
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
                        <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="text-[8px] md:text-[9px] lg:text-xs font-bold uppercase tracking-widest hidden md:block">Salir</span>
                    </button>
                </div>
            </nav>
        </aside>
    )
}
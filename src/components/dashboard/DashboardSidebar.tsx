"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { CalendarDays, Scissors, User, Lock, LogOut, FileText, ImageIcon, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function DashboardSidebar({ role }: { role: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // Control de UI Condicional basado en el Rol
    const NAV_ITEMS = [
        { label: "Agenda", href: "/dashboard", icon: CalendarDays, showTo: ['admin', 'barber'] },
        { label: "Mis Clientes", href: "/dashboard/customers", icon: Users, showTo: ['barber'] },
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
        <aside className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-zinc-800 z-50 md:sticky md:top-0 md:h-screen md:w-64 md:border-t-0 md:border-r flex md:flex-col justify-around md:justify-start md:p-8 md:space-y-12">
            <div className="hidden md:block">
                <h2 className="font-oswald text-2xl font-medium tracking-tight leading-none text-white uppercase">
                    CLUB GENTLEMAN
                </h2>
                <div className="mt-4 inline-block px-3 py-1 border border-zinc-700 bg-zinc-900 text-[9px] uppercase font-bold text-zinc-400 tracking-[0.2em]">
                    {role === 'admin' ? 'Administrador' : 'Barbero'}
                </div>
            </div>

            <nav className="flex md:flex-col w-full justify-around md:justify-start md:space-y-1 md:mb-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={cn(
                                "flex flex-col md:flex-row items-center justify-center md:justify-start md:px-4 md:py-3.5 transition-all gap-1 md:gap-4 relative group",
                                isActive
                                    ? "text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {isActive && <span className="hidden md:block absolute left-0 w-1 h-full bg-white"></span>}
                            <Icon className="w-5 h-5 md:w-4 md:h-4" />
                            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">{item.label}</span>
                        </Link>
                    )
                })}
                
                {/* Botón de Cerrar Sesión (Móvil y Desktop) */}
                <button
                    onClick={handleSignOut}
                    className="flex flex-col md:flex-row items-center justify-center md:justify-start md:px-4 md:py-3.5 transition-all gap-1 md:gap-4 text-red-500/70 hover:text-red-500 mt-auto md:mt-8 group relative"
                >
                    <span className="hidden md:block absolute left-0 w-0 h-full bg-red-500 transition-all group-hover:w-1"></span>
                    <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                    <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Salir</span>
                </button>
            </nav>
        </aside>
    )
}
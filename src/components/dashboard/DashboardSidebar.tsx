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
        <aside className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 md:sticky md:top-0 md:h-screen md:w-64 md:border-t-0 md:border-r flex md:flex-col justify-around md:justify-start md:p-6 md:space-y-8">
            <div className="hidden md:block">
                <h2 className="text-xl font-bold text-primary tracking-tighter leading-none flex items-center gap-2">
                    CLUB GENTLEMAN<br />
                    <span className="text-foreground text-[10px] tracking-[0.3em]">FOR MEN</span>
                </h2>
                <div className="mt-2 inline-block px-2 py-0.5 rounded-full border border-white/10 bg-black/40 text-[10px] uppercase font-bold text-white/50 tracking-widest">
                    {role === 'admin' ? 'Administrador' : 'Barbero'}
                </div>
            </div>

            <nav className="flex md:flex-col w-full justify-around md:justify-start md:space-y-2 md:mb-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={cn(
                                "flex flex-col md:flex-row items-center justify-center md:justify-start md:px-4 md:py-3 rounded-xl transition-all gap-1 md:gap-3",
                                isActive
                                    ? "text-primary md:bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            <Icon className="w-5 h-5 md:w-5 md:h-5" />
                            <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
                        </Link>
                    )
                })}
                
                {/* Botón de Cerrar Sesión (Móvil y Desktop) */}
                <button
                    onClick={handleSignOut}
                    className="flex flex-col md:flex-row items-center justify-center md:justify-start md:px-4 md:py-3 rounded-xl transition-all gap-1 md:gap-3 text-red-400 hover:text-red-300 md:text-destructive md:hover:bg-destructive/10"
                >
                    <LogOut className="w-5 h-5 md:w-5 md:h-5" />
                    <span className="text-[10px] md:text-sm font-medium">Salir</span>
                </button>
            </nav>
        </aside>
    )
}
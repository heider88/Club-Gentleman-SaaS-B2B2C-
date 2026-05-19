import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"

// Desactiva la revalidación dinámica forzada en el layout
// Permite que Next.js mantenga la cáscara (el Sidebar) en caché en el cliente
export const revalidate = 0;

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Obtener sesión desde el servidor (esto se cachea automáticamente por segmento en Next 14+)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Fallback rápido sin esperar más a la base de datos si ya sabemos que no hay sesión
    if (authError || !user) {
        redirect("/login")
    }

    // 2. Obtener el rol del usuario de forma segura
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'barber'

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Pasamos el rol evaluado en el servidor hacia nuestro componente cliente */}
            <DashboardSidebar role={role} />

            {/* Main Content */}
            <main className="flex-1 pb-20 md:pb-0 p-4 md:p-8 overflow-y-auto w-full max-w-full">
                {children}
            </main>
        </div>
    )
}

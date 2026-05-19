import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SalesReports } from "@/components/dashboard/admin/SalesReports"

export default async function ReportsPage() {
    const supabase = await createClient()

    // Verificación de seguridad
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect("/dashboard")
    }

    // Obtener la lista de barberos para el filtro
    const { data: barbers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'barber')
        .order('full_name', { ascending: true })

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
            <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Reportes Financieros
                </h1>
                <p className="text-muted-foreground font-medium">
                    Analiza los ingresos generados por los servicios completados en tu barbería.
                </p>
            </header>

            <SalesReports barbers={barbers || []} />
        </div>
    )
}

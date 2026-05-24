import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BusinessDashboard } from "@/components/dashboard/admin/business/BusinessDashboard"

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

    // Obtener la lista de barberos
    const { data: barbers } = await supabase
        .from('profiles')
        .select('id, full_name, commission_percentage')
        .eq('role', 'barber')
        .order('full_name', { ascending: true })

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-2 border-dash-text pb-6">
                <div className="flex-1">
                    <h1 className="font-oswald text-6xl md:text-7xl font-black text-dash-text uppercase tracking-tighter leading-none">
                        Business<br/><span className="text-dash-text-muted">Analytics</span>
                    </h1>
                </div>
            </header>

            <BusinessDashboard barbers={barbers || []} defaultTab="ventas-resumen" />
        </div>
    )
}

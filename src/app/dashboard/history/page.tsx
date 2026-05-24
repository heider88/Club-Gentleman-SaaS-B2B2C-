import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BarberHistory } from "@/components/dashboard/barber/BarberHistory"

export default async function HistoryPage() {
    const supabase = await createClient()

    // 1. Verificación de seguridad
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, commission_percentage')
        .eq('id', user.id)
        .single()

    // Solo los barberos pueden ver esta pantalla. Si es admin, lo mandamos a sus reportes globales.
    if (!profile || profile.role !== 'barber') {
        redirect("/dashboard/reports")
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
            <header className="flex flex-col gap-2 border-b border-dash-border pb-8">
                <h1 className="font-oswald text-4xl md:text-5xl font-medium tracking-tight text-dash-text uppercase">
                    Mi Historial
                </h1>
                <p className="text-dash-text-muted font-jakarta text-sm uppercase tracking-widest font-bold">
                    Revisa los cortes que has completado y descarga tus comprobantes.
                </p>
            </header>

            <BarberHistory 
                barberId={user.id} 
                barberName={profile.full_name || 'Barbero'} 
                commissionPercentage={profile.commission_percentage || 50} 
            />
        </div>
    )
}

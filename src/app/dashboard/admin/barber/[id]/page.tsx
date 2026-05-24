import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { User, Scissors, CalendarDays, ArrowLeft, Clock, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { BarberBasicInfoForm } from "@/components/dashboard/admin/BarberBasicInfoForm"
import { BarberServicesManager } from "@/components/dashboard/admin/BarberServicesManager"
import { BarberScheduleManager } from "@/components/dashboard/admin/BarberScheduleManager"

import { AdminSecurityManager } from "@/components/dashboard/admin/AdminSecurityManager"

export default async function BarberManagerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Verificar Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') redirect("/dashboard")

    // 2. Fetch de datos del Barbero
    const { data: barber, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !barber) {
        return (
            <div className="p-8 text-center text-dash-text">
                <p>Barbero no encontrado.</p>
                <Link href="/dashboard/admin" className="text-primary mt-4 inline-block">Volver atrás</Link>
            </div>
        )
    }

    // 3. Obtener sus citas (solo un resumen de próximas citas)
    const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status, start_time, customer_name, services(name)')
        .eq('barber_id', id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10)

    // 4. Obtener Catálogo Global (Los servicios que le pertenecen al ADMIN)
    const { data: globalServices } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', user.id) // El catálogo global son los servicios del admin
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <header className="flex flex-col gap-4 border-b border-white/5 pb-6">
                <Link href="/dashboard/admin" className="text-dash-text/50 hover:text-dash-text flex items-center gap-2 text-sm w-fit transition-colors bg-dash-text/5 px-4 py-2 rounded-xl">
                    <ArrowLeft className="w-4 h-4" /> Volver a Lista de Empleados
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-dash-text flex items-center gap-3">
                            {barber.full_name || 'Sin nombre'}
                        </h1>
                        <p className="text-primary mt-1 font-medium bg-primary/10 px-2 py-0.5 rounded text-sm w-fit">{barber.email}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Columna Izquierda: Tabs de Info y Servicios */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Información Básica */}
                    <section className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                        <h2 className="text-xl font-bold text-dash-text mb-6 flex items-center gap-2 relative z-10">
                            <User className="w-5 h-5 text-primary" /> Información de Perfil
                        </h2>
                        <div className="relative z-10">
                            <BarberBasicInfoForm 
                                barberId={barber.id} 
                                initialName={barber.full_name} 
                                initialBio={barber.bio} 
                                initialPhone={barber.phone} 
                                initialSpecialty={barber.specialty}
                                initialCommission={barber.commission_percentage}
                            />
                        </div>
                    </section>

                    {/* Seguridad / Accesos (SOLO ADMIN) */}
                    <section className="bg-card/90 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <h2 className="text-xl font-bold text-dash-text mb-6 flex items-center gap-2 relative z-10">
                            <ShieldCheck className="w-5 h-5 text-red-400" /> Credenciales de Acceso
                        </h2>
                        <div className="relative z-10">
                            <AdminSecurityManager 
                                barberId={barber.id} 
                                currentEmail={barber.email || ""} 
                            />
                        </div>
                    </section>

                    {/* Gestión de Servicios */}
                    <section className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-dash-text mb-6 flex items-center gap-2">
                            <Scissors className="w-5 h-5 text-primary" /> Catálogo de Servicios
                        </h2>
                        <p className="text-dash-text/50 text-sm mb-6">Administra los cortes y precios específicos que ofrece este barbero o impórtalos del catálogo global.</p>
                        <BarberServicesManager barberId={barber.id} globalServices={globalServices || []} />
                    </section>
                </div>

                {/* Columna Derecha: Configuración de Agenda y Resumen */}
                <div className="space-y-8">
                    {/* Horarios */}
                    <section className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-dash-text mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" /> Días y Horarios
                        </h2>
                        <BarberScheduleManager barberId={barber.id} initialSettings={barber.schedule_settings} />
                    </section>

                    {/* Resumen Citas */}
                    <section className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-dash-text mb-6 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" /> Próximas Citas
                        </h2>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                            {appointments && appointments.length > 0 ? appointments.map((appt: any) => (
                                <div key={appt.id} className="p-4 bg-dash-panel/40 border border-white/10 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-dash-text font-bold text-sm">{new Date(appt.start_time).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${appt.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    <p className="text-dash-text/70 text-sm">{appt.customer_name}</p>
                                    <p className="text-dash-text/40 text-xs mt-1">{appt.services?.name || 'Servicio Externo'}</p>
                                </div>
                            )) : <p className="text-dash-text/40 text-sm text-center py-4 bg-dash-text/5 rounded-xl border border-dashed border-white/10">El barbero no tiene citas futuras.</p>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

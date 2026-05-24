import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { startOfDay, endOfDay, format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarX2, CalendarDays } from "lucide-react"
import { AppointmentCard } from "@/components/dashboard/AppointmentCard"
import { InternalBookingModal } from "@/components/dashboard/InternalBookingModal"
import { TeamRadar } from "@/components/dashboard/TeamRadar"

import { DashboardTimeline } from "@/components/dashboard/DashboardTimeline"

// Types helpers for nested query
type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    services: {
        name: string;
        duration_minutes: number;
        price: number;
    } | null;
}

export default async function DashboardPage() {
    // 1. Iniciar cliente seguro del Server
    const supabase = await createClient()

    // 2. Fetch de usuario o Redirección estricta
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // 3. Obtener el perfil para personalizar bienvenida y evaluar el ROL
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    const barberName = profile?.full_name?.split(' ')[0] || 'Barbero'
    const userRole = profile?.role || 'barber'

    // 4. Fechas exactas del "Día de Hoy"
    const now = new Date()
    const startStr = startOfDay(now).toISOString()
    const endStr = endOfDay(now).toISOString()

    // 5. Consulta Supabase con Joins y Ordenamiento vía RLS Segura
    // OJO: Si eres 'admin', esta RLS en BD ahora te permitirá ver TODAS las citas si lo configuras así,
    // pero por ahora filtramos por el barber_id para ver la agenda propia o la general si removemos el eq()
    let query = supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            end_time,
            customer_name,
            customer_phone,
            status,
            barber_id,
            profiles (
                full_name
            ),
            services (
                name,
                duration_minutes,
                price
            )
        `)
        .gte('start_time', startStr)
        .lte('start_time', endStr)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })
        
    // Si NO es admin, forzamos a que solo vea sus propias citas
    // (Aun si el admin quiere ver solo las suyas, lo dejamos así por default, o removemos el eq() si el admin debe ver TODAS)
    if (userRole !== 'admin') {
        query = query.eq('barber_id', user.id)
    } else {
        // En un futuro, el admin podría querer filtrar por barbero, aquí mostramos TODAS para el admin en el día de hoy
        // query = query.eq('barber_id', user.id) 
    }

    const { data: appointmentsRes } = await query

    const appointments = (appointmentsRes as any as AppointmentWithService[]) || []

    // Contadores para resumen rápido
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            {/* Header / Greetings */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dash-border pb-8">
                <div>
                    <h1 className="font-oswald text-4xl md:text-5xl font-medium tracking-tight text-dash-text uppercase">
                        ¡Hola, <span className="text-dash-text-muted">{barberName}</span>!
                    </h1>
                    <p className="text-dash-text-soft font-jakarta flex items-center gap-2 text-sm mt-3 uppercase tracking-widest font-bold">
                        <CalendarDays className="w-4 h-4 text-dash-text-muted" />
                        {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </p>
                </div>
                {/* Botón de Agendar Manual (Inyectando el Barber ID) */}
                {userRole === 'barber' && (
                    <InternalBookingModal barberId={user.id} />
                )}
            </header>

            {/* Radar del Equipo (Solo visible para barberos que quieren ver a sus compañeros o admin) */}
            <TeamRadar currentUserId={user.id} />

            {/* Citas del Día */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-oswald text-2xl font-medium text-dash-text tracking-wide uppercase">
                        {userRole === 'admin' ? "Agenda General" : "Línea de Tiempo"}
                    </h2>
                    <div className="flex gap-2">
                        <span className="bg-dash-panel-alt border border-dash-border text-dash-text-soft px-3 py-1 text-xs font-bold uppercase tracking-widest">
                            {appointments.length} Total
                        </span>
                        {pendingCount > 0 && (
                            <span className="bg-dash-text text-dash-bg px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                {pendingCount} Pendientes
                            </span>
                        )}
                    </div>
                </div>

                {appointments.length === 0 ? (
                    /* EMPTY STATE (Luxury Industrial) */
                    <div className="relative overflow-hidden w-full h-[300px] flex flex-col items-center justify-center p-8 border border-dash-border bg-dash-panel group">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-dash-panel-alt rounded-full blur-[80px] pointer-events-none transition-all duration-700" />
                        <CalendarX2 className="w-12 h-12 text-zinc-700 mb-4 transition-transform group-hover:scale-110 duration-500 relative z-10" />
                        <h3 className="font-oswald text-2xl font-medium text-dash-text-soft tracking-wide uppercase relative z-10">Sin Citas Hoy</h3>
                        <p className="text-dash-text-muted text-sm mt-2 text-center max-w-xs relative z-10 font-jakarta">
                            Aún no hay clientes agendados. ¡Aprovecha el tiempo para optimizar tus herramientas!
                        </p>
                    </div>
                ) : (
                    /* TIMELINE VIEW */
                    <DashboardTimeline appointments={appointments} userRole={userRole} />
                )}
            </section>
        </div>
    )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { startOfDay, endOfDay, format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarX2, CalendarDays } from "lucide-react"
import { AppointmentCard } from "@/components/dashboard/AppointmentCard"
import { InternalBookingModal } from "@/components/dashboard/InternalBookingModal"

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
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        ¡Buenos días, <span className="text-primary">{barberName}</span>!
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 font-medium mt-2">
                        <CalendarDays className="w-5 h-5 text-white/50" />
                        Hoy es {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </p>
                </div>
                {/* Botón de Agendar Manual (Inyectando el Barber ID) */}
                {userRole === 'barber' && (
                    <InternalBookingModal barberId={user.id} />
                )}
            </header>

            {/* Citas del Día */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white/90">
                        {userRole === 'admin' ? "Agenda General (Todas las citas)" : "Tu Agenda del Día"}
                    </h2>
                    <div className="flex gap-3 text-sm">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(var(--color-primary),0.2)]">
                            {appointments.length} Total
                        </span>
                        {pendingCount > 0 && (
                            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(251,146,60,0.2)]">
                                {pendingCount} Pendientes
                            </span>
                        )}
                    </div>
                </div>

                {appointments.length === 0 ? (
                    /* EMPTY STATE (Glassmorphism & Urban Dark UI) */
                    <div className="relative overflow-hidden w-full h-[400px] flex flex-col items-center justify-center p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.1)] group">
                        {/* Glow effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />

                        <CalendarX2 className="w-16 h-16 text-white/20 mb-4 transition-transform group-hover:scale-110 duration-500" />
                        <h3 className="text-2xl font-bold text-white/90 mb-2 tracking-tight">Sin citas hoy</h3>
                        <p className="text-white/50 text-center max-w-sm mb-6 leading-relaxed">
                            Aún no hay clientes agendados para lo que queda de jornada. ¡Aprovecha para descansar o mejorar tu catálogo!
                        </p>
                    </div>
                ) : (
                    /* LISTADO DE CITAS */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {appointments.map((appt) => (
                            <AppointmentCard key={appt.id} appt={appt} userRole={userRole} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

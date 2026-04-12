import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { startOfDay, endOfDay, format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, CalendarX2, CalendarDays, Contact, Banknote } from "lucide-react"

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

    // 2. Fetch de usuario o Redirección estricta (Server Action / Redirect FOUC safe)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // 3. Obtener el perfil para personalizar bienvenida
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const barberName = profile?.full_name?.split(' ')[0] || 'Barbero'

    // 4. Fechas exactas del "Día de Hoy"
    const now = new Date()
    const startStr = startOfDay(now).toISOString()
    const endStr = endOfDay(now).toISOString()

    // 5. Consulta Supabase con Joins y Ordenamiento vía RLS Segura
    const { data: appointmentsRes } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            end_time,
            customer_name,
            customer_phone,
            status,
            services (
                name,
                duration_minutes,
                price
            )
        `)
        .eq('barber_id', user.id)
        .gte('start_time', startStr)
        .lte('start_time', endStr)
        .order('start_time', { ascending: true })

    const appointments = (appointmentsRes as any as AppointmentWithService[]) || []

    // Contadores para resumen rápido
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;

    // Función formateadora segura 
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            {/* Header / Greetings */}
            <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    ¡Buenos días, <span className="text-primary">{barberName}</span>!
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 font-medium">
                    <CalendarDays className="w-5 h-5 text-white/50" />
                    Hoy es {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </p>
            </header>

            {/* Citas del Día */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white/90">Agenda del Día</h2>
                    <div className="flex gap-3 text-sm">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">
                            {appointments.length} Total
                        </span>
                        {pendingCount > 0 && (
                            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {appointments.map((appt) => {
                            const isCompleted = appt.status === 'completed';
                            const isPending = appt.status === 'pending';

                            return (
                                <div
                                    key={appt.id}
                                    className={`relative rounded-2xl p-6 bg-card border hover:border-primary/40 backdrop-blur-sm transition-all duration-300 shadow-[0_2px_15px_rgba(0,0,0,0.4)] ${isCompleted ? 'border-primary/10 opacity-70' : 'border-white/10'}`}
                                >
                                    {/* Indicadores de status */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <span className="font-bold text-[15px]">{format(new Date(appt.start_time), 'HH:mm')}</span>
                                            <span className="text-white/30 px-1">-</span>
                                            <span className="text-white/50 text-[15px]">{format(new Date(appt.end_time), 'HH:mm')}</span>
                                        </div>
                                        {isPending && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] animate-pulse" title="Pendiente" />
                                        )}
                                    </div>

                                    {/* Info Cliente */}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
                                            <Contact className="w-5 h-5 text-white/40" />
                                            {appt.customer_name}
                                        </h3>
                                        <p className="text-xs font-medium text-white/40 ml-7 tracking-wide">{appt.customer_phone}</p>
                                    </div>

                                    {/* Info Servicio */}
                                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-0.5">Servicio</span>
                                            <span className="text-sm font-semibold text-white/80">{appt.services?.name || 'Servicio Externo'}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-0.5">Monto</span>
                                            <span className="text-sm font-bold text-primary flex items-center gap-1">
                                                <Banknote className="w-3.5 h-3.5" />
                                                {formatCurrency(appt.services?.price || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

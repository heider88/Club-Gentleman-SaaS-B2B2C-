import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { startOfDay, endOfDay, format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarX2, CalendarDays } from "lucide-react"
import { AppointmentCard } from "@/components/dashboard/AppointmentCard"
import { InternalBookingModal } from "@/components/dashboard/InternalBookingModal"
import { TeamRadar } from "@/components/dashboard/TeamRadar"

import { DashboardTimeline } from "@/components/dashboard/DashboardTimeline"

import { AdminCalendarView } from "@/components/dashboard/admin/AdminCalendarView"
import { AdminBookingModal } from "@/components/dashboard/admin/AdminBookingModal"
import { DateNavigator } from "@/components/dashboard/DateNavigator"

// Types helpers for nested query
type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    barber_id: string;
    profiles?: {
        full_name: string;
        avatar_url: string | null;
    } | null;
    services: {
        name: string;
        duration_minutes: number;
        price: number;
    } | null;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ date?: string, view?: string }> }) {
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

    // 4. Fechas exactas del "Día Seleccionado"
    const params = await searchParams;
    let selectedDate = new Date();
    
    // Convert to timezone-independent local string YYYY-MM-DD
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    let dateStr = `${yyyy}-${mm}-${dd}`;

    if (params.date) {
        dateStr = params.date;
        const [year, month, day] = dateStr.split('-').map(Number);
        selectedDate = new Date(year, month - 1, day);
    }
    
    const startStr = startOfDay(selectedDate).toISOString()
    const endStr = endOfDay(selectedDate).toISOString()

    // 5. Consulta Supabase
    // OJO: Si eres 'admin', mostramos las citas de TODOS los barberos.
    // Además, el admin puede tener un filtro extra `view` para día/semana/mes.
    const view = params.view || 'daily';
    let queryStart = startStr;
    let queryEnd = endStr;

    if (userRole === 'admin') {
        if (view === 'weekly') {
            // Asume que la semana empieza el lunes (1)
            const d = new Date(selectedDate);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(d.setDate(diff));
            monday.setHours(0,0,0,0);
            
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23,59,59,999);
            
            queryStart = monday.toISOString();
            queryEnd = sunday.toISOString();
        } else if (view === 'monthly') {
            const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            lastDay.setHours(23,59,59,999);
            
            queryStart = firstDay.toISOString();
            queryEnd = lastDay.toISOString();
        }
    }

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
                full_name,
                avatar_url
            ),
            services (
                name,
                duration_minutes,
                price
            )
        `)
        .gte('start_time', queryStart)
        .lte('start_time', queryEnd)
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

    // Fetch all active barbers if user is admin to pass to AdminCalendarView
    let allBarbersList: any[] = []
    if (userRole === 'admin') {
        const { data: barbersRes } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('role', 'barber')
        allBarbersList = barbersRes || []
    }

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
                    <div className="mt-4">
                        <DateNavigator currentDateStr={dateStr} />
                    </div>
                </div>
                {/* Botón de Agendar Manual */}
                {userRole === 'barber' && (
                    <InternalBookingModal barberId={user.id} />
                )}
                {userRole === 'admin' && (
                    <AdminBookingModal />
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

                {userRole === 'admin' ? (
                    <AdminCalendarView appointments={appointments} userRole={userRole} selectedDate={selectedDate} barbersList={allBarbersList} />
                ) : appointments.length === 0 ? (
                    /* EMPTY STATE (Luxury Industrial) */
                    <div className="relative overflow-hidden w-full h-[300px] flex flex-col items-center justify-center p-8 border border-dash-border bg-dash-panel group">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-dash-panel-alt rounded-full blur-[80px] pointer-events-none transition-all duration-700" />
                        <CalendarX2 className="w-12 h-12 text-zinc-700 mb-4 transition-transform group-hover:scale-110 duration-500 relative z-10" />
                        <h3 className="font-oswald text-2xl font-medium text-dash-text-soft tracking-wide uppercase relative z-10">Sin Citas {params.date ? 'Este Día' : 'Hoy'}</h3>
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

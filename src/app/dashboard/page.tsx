import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { startOfDay, endOfDay } from "date-fns"
import { CalendarX2 } from "lucide-react"
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

    // 4. Fechas exactas del "Día Seleccionado" ajustadas a la Zona Horaria de Bogotá (UTC-5)
    const params = await searchParams;
    let dateStr = "";

    if (params.date) {
        dateStr = params.date;
    } else {
        const bogotaFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: 'numeric', day: 'numeric',
        });
        const parts = bogotaFormatter.formatToParts(new Date());
        const b: any = {};
        parts.forEach(p => b[p.type] = p.value);
        dateStr = `${b.year}-${b.month.padStart(2, '0')}-${b.day.padStart(2, '0')}`;
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    // En Bogotá (UTC-5), el día comienza a las 05:00:00 UTC y termina a las 04:59:59 del día siguiente
    let queryStart = `${dateStr}T05:00:00.000Z`;
    const endMs = new Date(queryStart).getTime() + (24 * 60 * 60 * 1000) - 1;
    let queryEnd = new Date(endMs).toISOString();

    const view = params.view || 'daily';

    if (userRole === 'admin') {
        if (view === 'weekly') {
            const d = new Date(year, month - 1, day);
            const dow = d.getDay();
            const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
            
            const monday = new Date(d.setDate(diff));
            const yyyyM = monday.getFullYear();
            const mmM = String(monday.getMonth() + 1).padStart(2, '0');
            const ddM = String(monday.getDate()).padStart(2, '0');
            
            queryStart = `${yyyyM}-${mmM}-${ddM}T05:00:00.000Z`;
            
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const yyyyS = sunday.getFullYear();
            const mmS = String(sunday.getMonth() + 1).padStart(2, '0');
            const ddS = String(sunday.getDate()).padStart(2, '0');
            
            const sundayStart = `${yyyyS}-${mmS}-${ddS}T05:00:00.000Z`;
            queryEnd = new Date(new Date(sundayStart).getTime() + (24 * 60 * 60 * 1000) - 1).toISOString();
            
        } else if (view === 'monthly') {
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0); 
            
            const yyyyF = firstDay.getFullYear();
            const mmF = String(firstDay.getMonth() + 1).padStart(2, '0');
            const ddF = String(firstDay.getDate()).padStart(2, '0');
            
            queryStart = `${yyyyF}-${mmF}-${ddF}T05:00:00.000Z`;
            
            const yyyyL = lastDay.getFullYear();
            const mmL = String(lastDay.getMonth() + 1).padStart(2, '0');
            const ddL = String(lastDay.getDate()).padStart(2, '0');
            
            const lastDayStart = `${yyyyL}-${mmL}-${ddL}T05:00:00.000Z`;
            queryEnd = new Date(new Date(lastDayStart).getTime() + (24 * 60 * 60 * 1000) - 1).toISOString();
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
                            <span className="bg-dash-text text-black px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.1)]">
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

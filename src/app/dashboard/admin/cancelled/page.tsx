import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldAlert, XCircle, CalendarX2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function CancelledAppointmentsPage() {
    const supabase = await createClient()

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

    const { data: cancelledData } = await supabase
        .from('appointments')
        .select(`
            id,
            customer_name,
            customer_phone,
            start_time,
            created_at,
            services(name, price),
            profiles(full_name)
        `)
        .eq('status', 'cancelled')
        .order('start_time', { ascending: false })

    const appointments = cancelledData || [];

    return (
        <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
            {/* Header Auditoría */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-2 border-red-500/20 pb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3" /> Log de Auditoría
                        </span>
                    </div>
                    <h1 className="font-oswald text-5xl md:text-6xl font-black text-dash-text uppercase tracking-tighter leading-none">
                        Registro de<br/><span className="text-red-500/70">Cancelaciones</span>
                    </h1>
                </div>
                
                <div className="text-right">
                    <span className="font-oswald text-4xl font-black text-red-500">{appointments.length}</span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-dash-text-muted">Total Histórico</p>
                </div>
            </header>

            {appointments.length === 0 ? (
                <div className="relative overflow-hidden flex flex-col items-center justify-center py-32 bg-dash-panel border border-dash-border group">
                    <CalendarX2 className="w-16 h-16 text-dash-border mb-6 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="font-oswald text-3xl text-dash-text uppercase tracking-widest relative z-10">Historial Limpio</h3>
                    <p className="text-dash-text-soft font-jakarta mt-2 relative z-10 text-center max-w-sm">No existen registros de citas canceladas en la plataforma.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-1">
                    {appointments.map((appt: any, i: number) => (
                        <div 
                            key={appt.id} 
                            className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-transparent border-b border-dash-border hover:bg-red-500/[0.02] transition-colors relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                        >
                            {/* Hover accent line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Fecha */}
                            <div className="md:w-1/5 mb-4 md:mb-0">
                                <span className="font-mono text-[10px] text-dash-text-soft uppercase tracking-[0.2em] block mb-1">Schedule</span>
                                <div className="font-oswald text-xl text-dash-text tracking-wide uppercase group-hover:text-red-500 transition-colors">
                                    {format(new Date(appt.start_time), "dd MMM yyyy", { locale: es })}
                                </div>
                                <div className="text-dash-text-muted text-xs font-mono mt-1">
                                    {format(new Date(appt.start_time), "HH:mm")}
                                </div>
                            </div>

                            {/* Cliente */}
                            <div className="md:w-1/4 mb-4 md:mb-0">
                                <span className="font-mono text-[10px] text-dash-text-soft uppercase tracking-[0.2em] block mb-1">Target</span>
                                <div className="font-bold text-dash-text text-base">{appt.customer_name}</div>
                                <div className="text-dash-text-muted text-xs font-mono mt-1">{appt.customer_phone || "N/A"}</div>
                            </div>

                            {/* Servicio y Barbero */}
                            <div className="md:w-1/3 mb-4 md:mb-0 border-l border-dash-border/50 pl-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-[10px] text-dash-text-soft uppercase tracking-[0.2em]">Service / Operative</span>
                                    <span className="text-dash-text-soft font-mono text-xs">${appt.services?.price || "0"}</span>
                                </div>
                                <div className="text-dash-text font-medium text-sm truncate">{appt.services?.name || "Eliminado"}</div>
                                <div className="mt-2 inline-block border border-dash-border bg-dash-bg px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-dash-text-muted">
                                    {appt.profiles?.full_name || "N/A"}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="md:w-auto md:text-right mt-4 md:mt-0">
                                <div className="flex items-center gap-2 md:justify-end">
                                    <XCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                    <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-[10px]">Voided</span>
                                </div>
                                <div className="text-dash-text-soft text-[9px] font-mono mt-2 opacity-50 uppercase">
                                    ID: {appt.id.split('-')[0]}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

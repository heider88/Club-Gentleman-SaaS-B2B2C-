import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldAlert, XCircle, Trash2, CalendarX2 } from "lucide-react"
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
                <div className="overflow-x-auto border border-dash-border bg-dash-panel/30">
                    <table className="w-full text-left font-jakarta text-sm">
                        <thead>
                            <tr className="border-b border-dash-border bg-dash-panel-alt/50">
                                <th className="p-4 font-bold uppercase tracking-widest text-[10px] text-dash-text-muted">Fecha Cita</th>
                                <th className="p-4 font-bold uppercase tracking-widest text-[10px] text-dash-text-muted">Cliente</th>
                                <th className="p-4 font-bold uppercase tracking-widest text-[10px] text-dash-text-muted">Servicio & Valor</th>
                                <th className="p-4 font-bold uppercase tracking-widest text-[10px] text-dash-text-muted">Profesional Asignado</th>
                                <th className="p-4 font-bold uppercase tracking-widest text-[10px] text-dash-text-muted">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((appt: any) => (
                                <tr key={appt.id} className="border-b border-dash-border/50 hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-oswald text-lg text-dash-text tracking-wide uppercase">
                                            {format(new Date(appt.start_time), "dd MMM yyyy", { locale: es })}
                                        </div>
                                        <div className="text-dash-text-soft text-xs mt-1">
                                            {format(new Date(appt.start_time), "HH:mm")}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-dash-text">{appt.customer_name}</div>
                                        <div className="text-dash-text-muted text-xs font-mono mt-1">{appt.customer_phone || "N/A"}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-dash-text">{appt.services?.name || "Eliminado"}</div>
                                        <div className="text-dash-text-soft font-mono text-xs mt-1">${appt.services?.price || "0"}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-block border border-dash-border-alt bg-dash-panel-alt px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-dash-text-soft">
                                            {appt.profiles?.full_name || "N/A"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Cancelada</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

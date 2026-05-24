import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CalendarClock } from "lucide-react"

export default async function SchedulesPage() {
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

    // Fetch active barbers
    const { data: barbers } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'barber')
        .order('full_name', { ascending: true })

    return (
        <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-2 border-dash-text pb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-dash-text/10 border border-dash-text/30 text-dash-text text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase flex items-center gap-2">
                            <CalendarClock className="w-3 h-3" /> Master Control
                        </span>
                    </div>
                    <h1 className="font-oswald text-5xl md:text-6xl font-black text-dash-text uppercase tracking-tighter leading-none">
                        Control de<br/><span className="text-dash-text-muted">Horarios</span>
                    </h1>
                </div>
            </header>

            {/* Construcción del módulo */}
            <div className="w-full min-h-[400px] border border-dash-border bg-dash-panel/30 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50"></div>
                <div className="text-center relative z-10 p-8">
                    <span className="text-[100px] md:text-[140px] font-oswald font-black text-dash-text/[0.03] block leading-none pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">SYSTEM</span>
                    <h3 className="font-oswald text-2xl uppercase tracking-widest text-dash-text mt-4 relative z-10">
                        Configuración de Horario de Tienda y Bloqueos
                    </h3>
                    <p className="text-dash-text-soft font-jakarta text-sm mt-2 max-w-lg mx-auto relative z-10">
                        Aquí se implementará el formulario estilo dossier para establecer las horas de apertura de todo el local, cerrar en festivos, y asignar permisos específicos a los barberos bloqueando sus agendas libremente.
                    </p>
                </div>
            </div>
        </div>
    )
}

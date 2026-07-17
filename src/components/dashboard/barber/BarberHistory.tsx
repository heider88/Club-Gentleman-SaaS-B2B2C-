"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
    startOfDay, endOfDay, 
    startOfWeek, endOfWeek, 
    startOfMonth, endOfMonth, 
    format 
} from "date-fns"
import { es } from "date-fns/locale"
import { Banknote, CheckCircle2, Search, ArrowDownToLine } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type FilterType = 'daily' | 'weekly' | 'monthly'

interface AppointmentRecord {
    id: string
    start_time: string
    customer_name: string
    services: { name: string, price: number } | null
}

export function BarberHistory({ barberId, barberName, commissionPercentage }: { barberId: string, barberName: string, commissionPercentage: number }) {
    const supabase = createClient()
    const [filter, setFilter] = useState<FilterType>('daily')
    const [apptStatus, setApptStatus] = useState<'completed' | 'cancelled'>('completed')
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
    const [loading, setLoading] = useState(true)

    // Derived KPIs
    const totalRevenue = appointments.reduce((sum, a) => sum + (a.services?.price || 0), 0)
    const totalAppointments = appointments.length
    // const shopCut = totalRevenue * ((100 - commissionPercentage) / 100)
    const barberCut = totalRevenue * (commissionPercentage / 100)

    useEffect(() => {
        const fetchHistoryData = async () => {
            setLoading(true)
            
            // Obtener fecha actual en Bogotá
            const bogotaTimeString = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' });
            const bogotaDate = new Date(bogotaTimeString);
            
            // Usaremos date-fns nativo que es 100% estable, forzando las horas de inicio/fin manuales para simular UTC-5 en la base de datos
            let start = new Date(bogotaDate);
            let end = new Date(bogotaDate);

            if (filter === 'daily') {
                start = startOfDay(bogotaDate);
                end = endOfDay(bogotaDate);
            } else if (filter === 'weekly') {
                start = startOfWeek(bogotaDate, { weekStartsOn: 1 }); // Semana inicia el lunes
                end = endOfWeek(bogotaDate, { weekStartsOn: 1 });
            } else if (filter === 'monthly') {
                start = startOfMonth(bogotaDate);
                end = endOfMonth(bogotaDate);
            }

            // Convertimos la fecha calculada localmente a un string ISO pero FORZANDO el huso horario de Bogotá (-05:00) para la BD
            // Postgres timestamp with time zone (timestamptz) acepta este formato nativamente: YYYY-MM-DDTHH:mm:ss-05:00
            
            const formatToBogotaISO = (dateToFormat: Date, isEnd: boolean) => {
                const y = dateToFormat.getFullYear();
                const m = String(dateToFormat.getMonth() + 1).padStart(2, '0');
                const d = String(dateToFormat.getDate()).padStart(2, '0');
                
                if (isEnd) {
                    return `${y}-${m}-${d}T23:59:59.999-05:00`;
                }
                return `${y}-${m}-${d}T00:00:00.000-05:00`;
            }

            const queryStart = formatToBogotaISO(start, false);
            const queryEnd = formatToBogotaISO(end, true);

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    start_time, 
                    customer_name, 
                    customer_phone,
                    status,
                    services (name, price)
                `)
                .eq('barber_id', barberId)
                .eq('status', apptStatus)
                .gte('start_time', queryStart)
                .lte('start_time', queryEnd)
                .order('start_time', { ascending: false })

            if (error) {
                toast.error("Error al cargar el historial", { description: error.message })
            } else {
                // Remove zero-peso/no-service appointments from the view completely, treating them as void/cancelled implicitly
                const validAppointments = (data as any || []).filter((a: any) => (a.services?.price || 0) > 0);
                setAppointments(validAppointments)
            }
            setLoading(false)
        }
        
        fetchHistoryData()
    }, [filter, apptStatus, barberId, supabase])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    const handleDownloadPDF = () => {
        if (appointments.length === 0) return toast.warning("No hay cortes completados en este periodo para exportar.")

        toast.info("Generando comprobante de producción...")

        const doc = new jsPDF()
        
        doc.setFontSize(20)
        doc.text("Comprobante de Producción", 14, 20)
        
        doc.setFontSize(12)
        doc.setTextColor(50)
        doc.text(`Barbero: ${barberName}`, 14, 28)
        
        doc.setFontSize(10)
        doc.setTextColor(100)
        const periodLabels = { daily: 'Hoy', weekly: 'Esta Semana', monthly: 'Este Mes' }
        doc.text(`Periodo: ${periodLabels[filter]} - Generado: ${format(new Date(), 'dd/MM/yyyy h:mm a')}`, 14, 34)
        
        doc.setFontSize(12)
        doc.setTextColor(0)
        doc.text(`Producción Total Generada: ${formatCurrency(totalRevenue)}`, 14, 44)
        doc.text(`Pago al Profesional (${commissionPercentage}%): ${formatCurrency(barberCut)}`, 14, 51)
        doc.text(`Servicios Completados: ${totalAppointments}`, 14, 58)

        autoTable(doc, {
            startY: 65,
            head: [['Fecha y Hora', 'Cliente', 'Servicio Realizado', 'Monto ($)']],
            body: appointments.map(a => [
                format(new Date(a.start_time), 'dd/MM/yyyy h:mm a'),
                a.customer_name,
                a.services?.name || 'N/A',
                formatCurrency(a.services?.price || 0)
            ]),
            foot: [['', '', 'TOTAL', formatCurrency(totalRevenue)]],
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] },
            footStyles: { fillColor: [109, 50, 148], textColor: [255, 255, 255], fontStyle: 'bold' }
        })

        const safeFileName = barberName.replace(/\s+/g, '_')
        doc.save(`Produccion_${safeFileName}_${filter}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        toast.success("Comprobante descargado")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-dash-border pb-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="flex bg-transparent border border-dash-border p-1">
                        {['Hoy', 'Semana', 'Mes'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f as typeof filter)}
                                className={`flex-1 sm:px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-dash-text/10 border border-dash-text/20 text-dash-text' : 'text-dash-text-muted hover:text-dash-text'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-dash-panel border border-dash-border p-1">
                        <button onClick={() => setApptStatus('completed')} className={`flex-1 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${apptStatus === 'completed' ? 'bg-dash-panel-alt text-dash-text' : 'text-dash-text-muted hover:text-dash-text'}`}>Completados</button>
                        <button onClick={() => setApptStatus('cancelled')} className={`flex-1 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${apptStatus === 'cancelled' ? 'bg-dash-panel-alt text-dash-text' : 'text-dash-text-muted hover:text-dash-text'}`}>Cancelados</button>
                    </div>
                </div>
                
                <button 
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent hover:bg-dash-panel-alt border border-dash-border-alt px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all text-dash-text"
                >
                    <ArrowDownToLine className="w-4 h-4 text-dash-text-soft" /> Descargar PDF
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-dash-panel border border-dash-border p-6 relative group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-dash-text-muted text-xs font-bold uppercase tracking-widest">Cortes {apptStatus === 'completed' ? 'Completados' : 'Perdidos'}</span>
                        <CheckCircle2 className="w-5 h-5 text-dash-border-alt" />
                    </div>
                    <h3 className="text-4xl font-oswald font-medium text-dash-text">
                        {loading ? '...' : totalAppointments}
                    </h3>
                </div>

                <div className="bg-dash-panel border border-dash-border p-6 relative group sm:col-span-2">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-dash-text-muted text-xs font-bold uppercase tracking-widest">
                            {apptStatus === 'completed' ? `Ganancia Neta (${commissionPercentage}%)` : 'Ingresos Perdidos'}
                        </span>
                        <Banknote className="w-5 h-5 text-dash-border-alt" />
                    </div>
                    <div className="flex items-baseline gap-3">
                        <h3 className={`text-5xl font-oswald font-medium ${apptStatus === 'completed' ? 'text-dash-text' : 'text-dash-text-muted line-through'}`}>
                            {loading ? '...' : formatCurrency(apptStatus === 'completed' ? barberCut : totalRevenue)}
                        </h3>
                        {apptStatus === 'completed' && (
                            <span className="text-xs font-bold uppercase tracking-widest text-dash-text-muted">De {formatCurrency(totalRevenue)} prod. total</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="border border-dash-border bg-dash-panel">
                <div className="p-6 border-b border-dash-border">
                    <h3 className="font-oswald text-xl text-dash-text uppercase tracking-wide">
                        Historial de Trabajo
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dash-panel-alt/50 border-b border-dash-border">
                                <th className="p-4 text-[10px] font-bold text-dash-text-muted uppercase tracking-widest whitespace-nowrap">Fecha y Hora</th>
                                <th className="p-4 text-[10px] font-bold text-dash-text-muted uppercase tracking-widest whitespace-nowrap">Cliente</th>
                                <th className="p-4 text-[10px] font-bold text-dash-text-muted uppercase tracking-widest whitespace-nowrap">Servicio</th>
                                <th className="p-4 text-[10px] font-bold text-dash-text-muted uppercase tracking-widest whitespace-nowrap text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dash-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-dash-text-muted">
                                        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                                            <Search className="w-4 h-4 animate-spin" /> Procesando historial...
                                        </div>
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-dash-text-muted font-jakarta text-sm">
                                        Aún no hay registros en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-dash-panel-alt/30 transition-colors group">
                                        <td className="p-4 text-sm text-dash-text-soft whitespace-nowrap font-oswald tracking-wide">
                                            {format(new Date(appt.start_time), "d MMM yyyy - HH:mm", { locale: es })}
                                        </td>
                                        <td className="p-4 text-sm text-dash-text font-medium whitespace-nowrap">
                                            {appt.customer_name}
                                        </td>
                                        <td className="p-4 text-xs font-bold uppercase tracking-widest text-dash-text-muted whitespace-nowrap">
                                            {appt.services?.name || 'N/A'}
                                        </td>
                                        <td className="p-4 text-sm font-oswald text-dash-text text-right whitespace-nowrap">
                                            {formatCurrency(appt.services?.price || 0)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
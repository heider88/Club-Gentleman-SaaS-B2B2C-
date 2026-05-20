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
import { Banknote, CheckCircle2, Search, ArrowDownToLine, CalendarClock } from "lucide-react"
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

export function BarberHistory({ barberId, barberName }: { barberId: string, barberName: string }) {
    const supabase = createClient()
    const [filter, setFilter] = useState<FilterType>('daily')
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
    const [loading, setLoading] = useState(true)

    // Derived KPIs
    const totalRevenue = appointments.reduce((sum, a) => sum + (a.services?.price || 0), 0)
    const totalAppointments = appointments.length

    useEffect(() => {
        const fetchHistoryData = async () => {
            setLoading(true)
            const now = new Date()
            let startStr = ""
            let endStr = ""

            if (filter === 'daily') {
                startStr = startOfDay(now).toISOString()
                endStr = endOfDay(now).toISOString()
            } else if (filter === 'weekly') {
                startStr = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
                endStr = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
            } else if (filter === 'monthly') {
                startStr = startOfMonth(now).toISOString()
                endStr = endOfMonth(now).toISOString()
            }

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    start_time, 
                    customer_name, 
                    services(name, price)
                `)
                .eq('barber_id', barberId)
                .eq('status', 'completed')
                .gte('start_time', startStr)
                .lte('start_time', endStr)
                .order('start_time', { ascending: false })

            if (error) {
                toast.error("Error al cargar el historial", { description: error.message })
            } else {
                setAppointments((data as any) || [])
            }
            setLoading(false)
        }
        
        fetchHistoryData()
    }, [filter, barberId, supabase])

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
        doc.text(`Periodo: ${periodLabels[filter]} - Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34)
        
        doc.setFontSize(12)
        doc.setTextColor(0)
        doc.text(`Producción Total Generada: ${formatCurrency(totalRevenue)}`, 14, 44)
        doc.text(`Servicios Completados: ${totalAppointments}`, 14, 51)

        autoTable(doc, {
            startY: 58,
            head: [['Fecha y Hora', 'Cliente', 'Servicio Realizado', 'Monto ($)']],
            body: appointments.map(a => [
                format(new Date(a.start_time), 'dd/MM/yyyy HH:mm'),
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/90 backdrop-blur-md border border-border p-2 rounded-2xl">
                <div className="flex w-full sm:w-auto p-1 bg-black/40 rounded-xl">
                    {(['daily', 'weekly', 'monthly'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            {f === 'daily' ? 'Diario' : f === 'weekly' ? 'Semanal' : 'Mensual'}
                        </button>
                    ))}
                </div>
                
                <button 
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                >
                    <ArrowDownToLine className="w-4 h-4 text-primary" /> Descargar Certificado (PDF)
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Cortes Completados</span>
                        <div className="p-2 bg-primary/20 rounded-xl"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white relative z-10">
                        {loading ? '...' : totalAppointments}
                    </h3>
                </div>

                <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Producción Total</span>
                        <div className="p-2 bg-green-500/20 rounded-xl"><Banknote className="w-5 h-5 text-green-400" /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white relative z-10">
                        {loading ? '...' : formatCurrency(totalRevenue)}
                    </h3>
                </div>
            </div>

            <div className="bg-card/40 border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-primary" /> Historial de Trabajo
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/40 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">Fecha y Hora</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">Cliente</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">Servicio</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-white/40">
                                        <div className="flex items-center justify-center gap-2">
                                            <Search className="w-4 h-4 animate-spin" /> Procesando historial...
                                        </div>
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-white/40">
                                        Aún no tienes cortes completados en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-white/80 whitespace-nowrap">
                                            {format(new Date(appt.start_time), "d MMM yyyy - HH:mm", { locale: es })}
                                        </td>
                                        <td className="p-4 text-sm text-white font-medium whitespace-nowrap">
                                            {appt.customer_name}
                                        </td>
                                        <td className="p-4 text-sm text-white/60 whitespace-nowrap">
                                            {appt.services?.name || 'N/A'}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-green-400 text-right whitespace-nowrap">
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
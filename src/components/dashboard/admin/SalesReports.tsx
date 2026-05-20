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
import { Banknote, FileDown, Scissors, CheckCircle2, Search, ArrowDownToLine } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type FilterType = 'daily' | 'weekly' | 'monthly'

interface Barber {
    id: string
    full_name: string | null
}

interface AppointmentRecord {
    id: string
    start_time: string
    customer_name: string
    barber_id: string
    profiles: { full_name: string } | null
    services: { name: string, price: number } | null
}

export function SalesReports({ barbers }: { barbers: Barber[] }) {
    const supabase = createClient()
    const [filter, setFilter] = useState<FilterType>('daily')
    const [selectedBarber, setSelectedBarber] = useState<string>('all')
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
    const [loading, setLoading] = useState(true)

    // Derived KPIs
    const totalRevenue = appointments.reduce((sum, a) => sum + (a.services?.price || 0), 0)
    const totalAppointments = appointments.length
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true)
            const now = new Date()
            let startStr = ""
            let endStr = ""

            if (filter === 'daily') {
                startStr = startOfDay(now).toISOString()
                endStr = endOfDay(now).toISOString()
            } else if (filter === 'weekly') {
                startStr = startOfWeek(now, { weekStartsOn: 1 }).toISOString() // Lunes
                endStr = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
            } else if (filter === 'monthly') {
                startStr = startOfMonth(now).toISOString()
                endStr = endOfMonth(now).toISOString()
            }

            let query = supabase
                .from('appointments')
                .select(`
                    id, 
                    start_time, 
                    customer_name, 
                    barber_id,
                    profiles(full_name),
                    services(name, price)
                `)
                .eq('status', 'completed')
                .gte('start_time', startStr)
                .lte('start_time', endStr)
                .order('start_time', { ascending: false })

            if (selectedBarber !== 'all') {
                query = query.eq('barber_id', selectedBarber)
            }

            const { data, error } = await query

            if (error) {
                toast.error("Error al cargar reportes", { description: error.message })
            } else {
                setAppointments((data as any) || [])
            }
            setLoading(false)
        }
        
        fetchReportData()
    }, [filter, selectedBarber, supabase])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    const handleDownloadPDF = () => {
        if (appointments.length === 0) return toast.warning("No hay datos para exportar en este periodo.")

        toast.info("Generando reporte PDF...")

        const doc = new jsPDF()
        
        const barberName = selectedBarber === 'all' 
            ? 'General (Todos)' 
            : barbers.find(b => b.id === selectedBarber)?.full_name || 'Desconocido'

        // Título y Cabecera
        doc.setFontSize(20)
        doc.text(`Reporte de Ventas - ${barberName}`, 14, 20)
        
        doc.setFontSize(10)
        doc.setTextColor(100)
        const periodLabels = { daily: 'Hoy', weekly: 'Esta Semana', monthly: 'Este Mes' }
        doc.text(`Periodo: ${periodLabels[filter]} - Fecha de emisión: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 28)
        
        doc.setFontSize(12)
        doc.setTextColor(0)
        doc.text(`Ingresos Totales: ${formatCurrency(totalRevenue)}`, 14, 38)
        doc.text(`Citas Completadas: ${totalAppointments}`, 14, 45)

        // Tabla
        autoTable(doc, {
            startY: 55,
            head: [['Fecha y Hora', 'Barbero', 'Cliente', 'Servicio', 'Monto ($)']],
            body: appointments.map(a => [
                format(new Date(a.start_time), 'dd/MM/yyyy HH:mm'),
                a.profiles?.full_name || 'Desconocido',
                a.customer_name,
                a.services?.name || 'N/A',
                formatCurrency(a.services?.price || 0)
            ]),
            foot: [['', '', '', 'TOTAL', formatCurrency(totalRevenue)]],
            theme: 'grid',
            headStyles: { fillColor: [109, 50, 148] }, // Color primario de tu marca #6D3294 (aprox)
            footStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' }
        })

        const safeFileName = selectedBarber === 'all' ? 'General' : barberName.replace(/\s+/g, '_')
        doc.save(`Reporte_Ventas_${safeFileName}_${filter}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        toast.success("PDF descargado con éxito")
    }

    return (
        <div className="space-y-6">
            {/* Controladores */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card/90 backdrop-blur-md border border-border p-2 rounded-2xl">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <div className="flex p-1 bg-black/40 rounded-xl shrink-0">
                        {(['daily', 'weekly', 'monthly'] as FilterType[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                {f === 'daily' ? 'Diario' : f === 'weekly' ? 'Semanal' : 'Mensual'}
                            </button>
                        ))}
                    </div>
                    
                    <select 
                        value={selectedBarber} 
                        onChange={e => setSelectedBarber(e.target.value)}
                        className="bg-black/40 border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-primary shrink-0 appearance-none min-w-[200px] [color-scheme:dark]"
                    >
                        <option value="all">👑 Reporte General (Todos)</option>
                        {barbers.map(b => (
                            <option key={b.id} value={b.id}>✂️ {b.full_name || 'Sin nombre'}</option>
                        ))}
                    </select>
                </div>
                
                <button 
                    onClick={handleDownloadPDF}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 rounded-xl text-sm font-bold transition-all text-white shrink-0"
                >
                    <ArrowDownToLine className="w-4 h-4 text-primary" /> Descargar PDF
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Ingresos Totales</span>
                        <div className="p-2 bg-green-500/20 rounded-xl"><Banknote className="w-5 h-5 text-green-400" /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white relative z-10">
                        {loading ? '...' : formatCurrency(totalRevenue)}
                    </h3>
                </div>

                <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Citas Finalizadas</span>
                        <div className="p-2 bg-primary/20 rounded-xl"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white relative z-10">
                        {loading ? '...' : totalAppointments}
                    </h3>
                </div>

                <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Ticket Promedio</span>
                        <div className="p-2 bg-blue-500/20 rounded-xl"><Scissors className="w-5 h-5 text-blue-400" /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white relative z-10">
                        {loading ? '...' : formatCurrency(averageTicket)}
                    </h3>
                </div>
            </div>

            {/* Listado de Ventas (Tabla) */}
            <div className="bg-card/40 border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileDown className="w-5 h-5 text-primary" /> Detalle de Ventas
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/40 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">Fecha y Hora</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">Barbero</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">Cliente</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">Servicio</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider whitespace-nowrap text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/40">
                                        <div className="flex items-center justify-center gap-2">
                                            <Search className="w-4 h-4 animate-spin" /> Procesando datos...
                                        </div>
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-white/40">
                                        No hay citas completadas en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-white/80 whitespace-nowrap">
                                            {format(new Date(appt.start_time), "d MMM yyyy - HH:mm", { locale: es })}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-primary whitespace-nowrap">
                                            {appt.profiles?.full_name || 'Desconocido'}
                                        </td>
                                        <td className="p-4 text-sm text-white whitespace-nowrap">
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

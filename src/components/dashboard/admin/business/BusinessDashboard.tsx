"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Banknote, FileDown, Scissors, CheckCircle2, CalendarDays, Users, Star, ArrowDownToLine, Clock, CalendarX2 } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface Barber {
    id: string
    full_name: string | null
    commission_percentage: number | null
}

interface AppointmentRecord {
    id: string
    start_time: string
    customer_name: string
    customer_phone?: string
    barber_id: string
    status: string
    profiles: { full_name: string } | null
    services: { name: string, price: number, duration_minutes: number } | null
}

export function BusinessDashboard({ barbers, defaultTab }: { barbers: Barber[], defaultTab: string }) {
    const supabase = createClient()
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [currentTab, setCurrentTab] = useState(defaultTab)

    useEffect(() => {
        async function fetchAppointments() {
            setLoading(true)
            const now = new Date()
            let startDate = startOfDay(now)
            let endDate = endOfDay(now)

            if (timeRange === 'weekly') {
                startDate = startOfWeek(now, { weekStartsOn: 1 })
                endDate = endOfWeek(now, { weekStartsOn: 1 })
            } else if (timeRange === 'monthly') {
                startDate = startOfMonth(now)
                endDate = endOfMonth(now)
            }

            const { data, error } = await supabase
                .from('appointments')
                .select('id, start_time, customer_name, customer_phone, barber_id, status, profiles(full_name), services(name, price, duration_minutes)')
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString())

            if (!error && data) {
                setAppointments(data as any[])
            } else {
                setAppointments([])
            }
            setLoading(false)
        }
        
        fetchAppointments()
    }, [timeRange, supabase])

    // Calculate global stats for the persistent header
    const completedAppts = appointments.filter(a => a.status === 'completed')
    const totalGlobalRevenue = completedAppts.reduce((sum, a) => sum + (a.services?.price || 0), 0)
    const totalGlobalServices = completedAppts.length
    const averageGlobalTicket = totalGlobalServices > 0 ? Math.round(totalGlobalRevenue / totalGlobalServices) : 0

    // VENTAS - RESUMEN
    const renderVentasResumen = () => {
        let totalRevenue = 0
        let totalServices = 0
        completedAppts.forEach(a => {
            totalRevenue += a.services?.price || 0
            totalServices++
        })

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Banknote className="w-8 h-8 text-white/50" />
                    </div>
                    <h3 className="font-oswald text-2xl uppercase tracking-widest text-dash-text mb-2">Visión Financiera Integral</h3>
                    <p className="text-dash-text-soft font-jakarta max-w-lg text-sm">
                        Utiliza las pestañas superiores para desglosar tus ingresos por servicio o revisar las comisiones generadas por tu equipo de profesionales en el periodo seleccionado.
                    </p>
                </div>
            </div>
        )
    }

    // VENTAS - SERVICIOS
    const renderVentasServicios = () => {
        const serviceMap = new Map<string, { count: number, revenue: number }>()
        completedAppts.forEach(a => {
            const name = a.services?.name || 'Otro'
            const price = a.services?.price || 0
            if (!serviceMap.has(name)) serviceMap.set(name, { count: 0, revenue: 0 })
            const s = serviceMap.get(name)!
            s.count++
            s.revenue += price
        })

        const chartData = Array.from(serviceMap.entries()).map(([name, data]) => ({
            name,
            Ingresos: data.revenue,
            Cantidad: data.count
        })).sort((a, b) => b.Ingresos - a.Ingresos)

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-8">
                    <h3 className="font-oswald text-xl uppercase tracking-widest text-dash-text mb-8">Ingresos por Servicio</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
                                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '0', fontFamily: 'monospace' }}
                                    itemStyle={{ color: '#ec4899' }}
                                />
                                <Bar dataKey="Ingresos" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )
    }

    // VENTAS - COMISIONES
    const renderComisiones = () => {
        const comisionesData = barbers.map(barber => {
            const barberAppts = completedAppts.filter(a => a.barber_id === barber.id)
            let totalRevenue = 0
            barberAppts.forEach(a => totalRevenue += (a.services?.price || 0))
            const commPercent = barber.commission_percentage || 50
            const payout = (totalRevenue * commPercent) / 100
            const storeKeeps = totalRevenue - payout

            return {
                barber: barber.full_name,
                cuts: barberAppts.length,
                totalRevenue,
                commPercent,
                payout,
                storeKeeps
            }
        }).filter(d => d.totalRevenue > 0)

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto border border-white/5 bg-black/40">
                    <table className="w-full text-left font-jakarta text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted">Profesional</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted text-right">Servicios</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted text-right">Generado</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted text-right">% Com.</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-emerald-500/70 text-right">A Pagar</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-cyan-500/70 text-right">Queda Tienda</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comisionesData.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-white/40 font-mono text-xs uppercase">Sin comisiones generadas</td></tr>
                            ) : comisionesData.map((data, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 font-oswald text-dash-text text-lg uppercase tracking-wide">{data.barber}</td>
                                    <td className="p-4 font-mono text-dash-text-soft text-right">{data.cuts}</td>
                                    <td className="p-4 font-mono text-dash-text text-right">${data.totalRevenue.toLocaleString()}</td>
                                    <td className="p-4 font-mono text-dash-text-soft text-right">{data.commPercent}%</td>
                                    <td className="p-4 font-mono text-emerald-400 font-bold text-right">${data.payout.toLocaleString()}</td>
                                    <td className="p-4 font-mono text-cyan-400 font-bold text-right">${data.storeKeeps.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // RESERVAS - DIAS
    const renderReservasDias = () => {
        const daysMap = { 'Lun':0, 'Mar':0, 'Mié':0, 'Jue':0, 'Vie':0, 'Sáb':0, 'Dom':0 }
        
        appointments.filter(a => a.status !== 'cancelled').forEach(a => {
            const dayName = format(new Date(a.start_time), 'EEE', { locale: es })
            // Normalize day name to match our keys, adjusting for date-fns output
            let key = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            // Quick mapping for date-fns outputs
            if(key === 'Dom') daysMap['Dom']++;
            else if(key === 'Lun') daysMap['Lun']++;
            else if(key === 'Mar') daysMap['Mar']++;
            else if(key === 'Mié' || key === 'Mie') daysMap['Mié']++;
            else if(key === 'Jue') daysMap['Jue']++;
            else if(key === 'Vie') daysMap['Vie']++;
            else if(key === 'Sáb' || key === 'Sab') daysMap['Sáb']++;
        })

        const chartData = Object.entries(daysMap).map(([day, count]) => ({ day, count }))

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-8">
                    <h3 className="font-oswald text-xl uppercase tracking-widest text-dash-text mb-8">Volumen por Día de la Semana</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
                                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '0', fontFamily: 'monospace' }}
                                    itemStyle={{ color: '#8b5cf6' }}
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Citas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )
    }

    // RESERVAS - ESTADO (DASHBOARD COMPLETO)
    const renderReservasEstado = () => {
        let pending = 0, confirmed = 0, completed = 0, cancelled = 0
        const total = appointments.length

        appointments.forEach(a => {
            if(a.status === 'pending') pending++
            if(a.status === 'confirmed') confirmed++
            if(a.status === 'completed') completed++
            if(a.status === 'cancelled') cancelled++
        })

        const getPercent = (val: number) => total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'

        // Data array
        const statusData = [
            { id: 'completed', label: 'Completadas', count: completed, pct: getPercent(completed), color: '#10b981', icon: <CheckCircle2 className="w-5 h-5 text-[#10b981]" /> },
            { id: 'confirmed', label: 'Confirmadas', count: confirmed, pct: getPercent(confirmed), color: '#3b82f6', icon: <CalendarDays className="w-5 h-5 text-[#3b82f6]" /> },
            { id: 'pending',   label: 'Pendientes',  count: pending,   pct: getPercent(pending),   color: '#eab308', icon: <Clock className="w-5 h-5 text-[#eab308]" /> },
            { id: 'cancelled', label: 'Canceladas',  count: cancelled, pct: getPercent(cancelled), color: '#ef4444', icon: <CalendarX2 className="w-5 h-5 text-[#ef4444]" /> },
        ]

        // Filter out zero values for charts to look cleaner, but keep for table if you prefer (we'll filter charts)
        const chartData = statusData.filter(d => d.count > 0).map(d => ({
            name: d.label,
            value: d.count,
            color: d.color
        }))

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. CARDS DE MÉTRICAS (KPIs) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statusData.map(stat => (
                        <div key={stat.id} className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[140px] relative overflow-hidden group">
                            <div className="flex justify-between items-start w-full">
                                <span className="text-xs font-bold uppercase tracking-[0.1em] text-dash-text-soft">{stat.label}</span>
                                <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                                    {stat.icon}
                                </div>
                            </div>
                            <div>
                                <span className="text-3xl font-black font-mono text-dash-text block leading-none">{stat.count}</span>
                                <span className="text-xs font-bold mt-2 block" style={{ color: stat.color }}>{stat.pct}% del total</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. GRÁFICOS (DONA Y BARRAS) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico Donut */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[350px]">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider mb-4">Distribución Porcentual</h3>
                        <div className="flex-1 w-full relative">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={chartData} 
                                            innerRadius="65%" 
                                            outerRadius="90%" 
                                            paddingAngle={3} 
                                            dataKey="value" 
                                            stroke="none"
                                            animationDuration={800}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin datos en este periodo</div>
                            )}
                        </div>
                    </div>

                    {/* Gráfico de Barras */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[350px]">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider mb-4">Comparativa de Volúmenes</h3>
                        <div className="flex-1 w-full relative">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', color: '#fff' }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} maxBarSize={60}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin datos en este periodo</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. TABLA DETALLADA CON PROGRESS BARS */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider">Desglose Detallado</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Estado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Cantidad</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Porcentaje</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 min-w-[200px]">Indicador</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {statusData.map((stat, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                                <span className="text-sm font-medium text-dash-text">{stat.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold font-mono text-dash-text">{stat.count}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold font-mono" style={{ color: stat.color }}>{stat.pct}%</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                                                    style={{ width: `${stat.pct}%`, backgroundColor: stat.color }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )
    }

    // CLIENTES - TOP
    const renderClientesTop = () => {
        const clientMap = new Map<string, { name: string, phone: string, cuts: number, spent: number }>()
        
        completedAppts.forEach(a => {
            const key = a.customer_phone || a.customer_name
            if(!clientMap.has(key)) {
                clientMap.set(key, { name: a.customer_name, phone: a.customer_phone || 'N/A', cuts: 0, spent: 0 })
            }
            const c = clientMap.get(key)!
            c.cuts++
            c.spent += (a.services?.price || 0)
        })

        const topClients = Array.from(clientMap.values()).sort((a, b) => b.spent - a.spent).slice(0, 10)

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto border border-white/5 bg-black/40">
                    <table className="w-full text-left font-jakarta text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted">Rank</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted">Cliente</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted">Contacto</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted text-center">Asistencias</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-[#6D3294] text-right">Inversión Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topClients.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-white/40 font-mono text-xs uppercase">Aún no hay suficientes datos</td></tr>
                            ) : topClients.map((c, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 font-oswald font-black text-2xl text-white/20">#{i+1}</td>
                                    <td className="p-4 font-oswald text-dash-text text-xl uppercase tracking-wide">{c.name}</td>
                                    <td className="p-4 font-mono text-dash-text-soft text-xs">{c.phone}</td>
                                    <td className="p-4 font-mono text-dash-text text-center text-lg">{c.cuts}</td>
                                    <td className="p-4 font-mono text-pink-400 font-bold text-right">${c.spent.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // MAIN RENDER SELECTOR
    const renderContent = () => {
        if (loading) {
            return (
                <div className="w-full min-h-[500px] border border-white/5 bg-black/40 flex items-center justify-center">
                    <span className="font-oswald text-dash-text-muted uppercase tracking-[0.3em] text-xs font-bold animate-pulse">Analizando Datos...</span>
                </div>
            )
        }

        switch (currentTab) {
            case 'ventas-resumen': return renderVentasResumen();
            case 'ventas-servicios': return renderVentasServicios();
            case 'ventas-comisiones': return renderComisiones();
            case 'ventas-productos': 
            case 'ventas-efectivo': 
                return (
                    <div className="w-full min-h-[300px] border border-white/5 bg-black/40 flex items-center justify-center relative overflow-hidden group">
                        <span className="text-[120px] font-oswald font-black text-dash-text/[0.02] block leading-none pointer-events-none select-none absolute">N/A</span>
                        <h3 className="font-oswald text-xl uppercase tracking-widest text-dash-text-soft relative z-10">Módulo No Disponible (Sin Sistema POS Integrado)</h3>
                    </div>
                )
            
            case 'reservas-dias': return renderReservasDias();
            case 'reservas-estado': return renderReservasEstado();
            case 'reservas-fuente': 
                return (
                    <div className="w-full min-h-[300px] border border-white/5 bg-black/40 flex items-center justify-center relative overflow-hidden group">
                        <span className="text-[120px] font-oswald font-black text-dash-text/[0.02] block leading-none pointer-events-none select-none absolute">N/A</span>
                        <h3 className="font-oswald text-xl uppercase tracking-widest text-dash-text-soft relative z-10">Todas las reservas provienen de la Web</h3>
                    </div>
                )
            case 'reservas-colaborador':
                return renderVentasComisiones() // Reusing the layout roughly 

            case 'clientes-retencion':
                return (
                    <div className="w-full min-h-[300px] border border-white/5 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden p-8 text-center">
                        <Users className="w-16 h-16 text-dash-text/20 mb-6" />
                        <h3 className="font-oswald text-4xl uppercase tracking-widest text-dash-text">Métrica de Frecuencia</h3>
                        <p className="text-dash-text-soft font-jakarta mt-4 max-w-lg">
                            Actualmente, el <span className="text-pink-400 font-bold">100%</span> de tus clientes recurrentes están siendo procesados. Se necesitan más cortes finalizados para calcular promedios de días exactos entre visitas.
                        </p>
                    </div>
                )
            case 'clientes-top': return renderClientesTop();

            default: return renderVentasResumen();
        }
    }

    // Helper for reusing a view
    function renderVentasComisiones() {
        const commData = barbers.map(barber => {
            const barberAppts = appointments.filter(a => a.barber_id === barber.id && a.status !== 'cancelled')
            return {
                name: barber.full_name,
                Citas: barberAppts.length
            }
        }).sort((a,b) => b.Citas - a.Citas)

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-8">
                    <h3 className="font-oswald text-xl uppercase tracking-widest text-dash-text mb-8">Carga de Trabajo por Colaborador</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={commData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
                                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 11, fontFamily: 'monospace' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '0', fontFamily: 'monospace' }}
                                    itemStyle={{ color: '#0ea5e9' }}
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                />
                                <Bar dataKey="Citas" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )
    }

    // Determine current parent group
    const isVentas = currentTab.startsWith('ventas');
    const isReservas = currentTab.startsWith('reservas');
    const isClientes = currentTab.startsWith('clientes');

    return (
        <div className="w-full space-y-8 relative z-10">
            {/* Control Principal (Periodo de Tiempo) */}
            <div className="flex justify-end">
                <div className="inline-flex bg-black/40 border border-white/10 rounded-none p-1 shadow-lg">
                    {['daily', 'weekly', 'monthly'].map((tr) => (
                        <button
                            key={tr}
                            onClick={() => setTimeRange(tr as any)}
                            className={`px-6 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-none ${
                                timeRange === tr 
                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tr === 'daily' ? 'Hoy' : tr === 'weekly' ? 'Semana' : 'Mes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pestañas de Navegación 1: Grupos Principales */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setCurrentTab('ventas-resumen')}
                    className={`flex-1 md:flex-none px-6 py-4 border-b-2 font-oswald text-xl uppercase tracking-wider transition-colors ${
                        isVentas ? 'border-primary text-primary' : 'border-transparent text-white/50 hover:text-white/80'
                    }`}
                >
                    Ventas
                </button>
                <button 
                    onClick={() => setCurrentTab('reservas-dias')}
                    className={`flex-1 md:flex-none px-6 py-4 border-b-2 font-oswald text-xl uppercase tracking-wider transition-colors ${
                        isReservas ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-white/50 hover:text-white/80'
                    }`}
                >
                    Reservas
                </button>
                <button 
                    onClick={() => setCurrentTab('clientes-top')}
                    className={`flex-1 md:flex-none px-6 py-4 border-b-2 font-oswald text-xl uppercase tracking-wider transition-colors ${
                        isClientes ? 'border-[#ec4899] text-[#ec4899]' : 'border-transparent text-white/50 hover:text-white/80'
                    }`}
                >
                    Clientes
                </button>
            </div>

            {/* Pestañas de Navegación 2: Filtros Específicos (Sub-tabs) */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
                {isVentas && [
                    { id: 'ventas-resumen', label: 'Resumen General' },
                    { id: 'ventas-servicios', label: 'Por Servicios' },
                    { id: 'ventas-productos', label: 'Por Productos' },
                    { id: 'ventas-comisiones', label: 'Comisiones' },
                    { id: 'ventas-efectivo', label: 'Caja' }
                ].map(sub => (
                    <button 
                        key={sub.id} onClick={() => setCurrentTab(sub.id)}
                        className={`shrink-0 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${
                            currentTab === sub.id 
                                ? 'bg-primary/10 border-primary/50 text-primary' 
                                : 'bg-transparent border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {sub.label}
                    </button>
                ))}

                {isReservas && [
                    { id: 'reservas-dias', label: 'Por Días' },
                    { id: 'reservas-estado', label: 'Por Estado', highlight: true },
                    { id: 'reservas-fuente', label: 'Por Fuente' },
                    { id: 'reservas-colaborador', label: 'Por Colaborador' }
                ].map(sub => (
                    <button 
                        key={sub.id} onClick={() => setCurrentTab(sub.id)}
                        className={`shrink-0 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${
                            currentTab === sub.id 
                                ? (sub.highlight ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-[#3b82f6]/10 border-[#3b82f6]/50 text-[#3b82f6]')
                                : 'bg-transparent border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {sub.label}
                    </button>
                ))}

                {isClientes && [
                    { id: 'clientes-retencion', label: 'Retención' },
                    { id: 'clientes-top', label: 'Top Clientes' }
                ].map(sub => (
                    <button 
                        key={sub.id} onClick={() => setCurrentTab(sub.id)}
                        className={`shrink-0 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${
                            currentTab === sub.id 
                                ? 'bg-[#ec4899]/10 border-[#ec4899]/50 text-[#ec4899]' 
                                : 'bg-transparent border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {sub.label}
                    </button>
                ))}
            </div>

            {/* Contenedor Gráficos / Data */}
            <div className="relative pt-4 space-y-6">
                
                {/* GLOBAL FIXED FINANCIAL SUMMARY - Opción A */}
                {!loading && (
                    <div className="grid grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
                        <div className="bg-black/60 backdrop-blur-xl border border-emerald-500/20 border-t-emerald-500/40 p-4 md:p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                            <div>
                                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-dash-text-soft">Ingresos Brutos</span>
                                <p className="font-mono text-xl md:text-3xl text-emerald-400 font-black mt-1 leading-none">${totalGlobalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="hidden md:flex w-10 h-10 bg-emerald-500/10 items-center justify-center rounded-full border border-emerald-500/30">
                                <Banknote className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-4 md:p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                            <div>
                                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-dash-text-soft">Servicios Listos</span>
                                <p className="font-mono text-xl md:text-3xl text-dash-text font-bold mt-1 leading-none">{totalGlobalServices}</p>
                            </div>
                            <div className="hidden md:flex w-10 h-10 bg-white/5 items-center justify-center rounded-full border border-white/10">
                                <Scissors className="w-5 h-5 text-white/70" />
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-4 md:p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                            <div>
                                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-dash-text-soft">Ticket Prom.</span>
                                <p className="font-mono text-xl md:text-3xl text-cyan-400 font-bold mt-1 leading-none">${averageGlobalTicket.toLocaleString()}</p>
                            </div>
                            <div className="hidden md:flex w-10 h-10 bg-cyan-500/10 items-center justify-center rounded-full border border-cyan-500/30">
                                <ArrowDownToLine className="w-5 h-5 text-cyan-500" />
                            </div>
                        </div>
                    </div>
                )}

                {renderContent()}
            </div>
        </div>
    )
}
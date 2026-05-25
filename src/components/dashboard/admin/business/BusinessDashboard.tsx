"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Banknote, FileDown, Scissors, CheckCircle2, CalendarDays, Users, Star, ArrowDownToLine, Clock, CalendarX2, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, Wallet, Landmark, Receipt, CircleDollarSign } from "lucide-react"
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
  Legend,
  LineChart,
  Line,
  ReferenceLine
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

    // VENTAS - CAJA (RESUMEN DE EFECTIVO)
    const renderResumenEfectivo = () => {
        let grossSales = 0;
        let totalCommissions = 0;
        const expenses = 0; // Fixed as requested for now

        barbers.forEach(b => {
            const appts = completedAppts.filter(a => a.barber_id === b.id)
            let sales = 0;
            appts.forEach(a => sales += (a.services?.price || 0))
            grossSales += sales;
            totalCommissions += (sales * (b.commission_percentage || 50)) / 100
        })

        const netProfit = grossSales - totalCommissions - expenses;
        const profitMargin = grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(2) : '0.00';

        const donutData = [
            { name: 'Ganancia Neta', value: netProfit, color: '#3B82F6' },
            { name: 'Comisiones', value: totalCommissions, color: '#34D399' }
        ].filter(d => d.value > 0)

        const barData = [
            { name: 'Ingresos', value: grossSales, color: '#10b981' },
            { name: 'Egresos', value: totalCommissions + expenses, color: '#ef4444' },
            { name: 'Utilidad Neta', value: netProfit, color: '#3B82F6' }
        ]

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Dinero en Caja</span>
                            <div className="p-2 bg-blue-500/10 rounded-xl"><Wallet className="w-4 h-4 text-blue-500" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-dash-text">${grossSales.toLocaleString()}</span>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Ventas Brutas</span>
                            <div className="p-2 bg-emerald-500/10 rounded-xl"><Landmark className="w-4 h-4 text-emerald-500" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-emerald-400">${grossSales.toLocaleString()}</span>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Comisiones Totales</span>
                            <div className="p-2 bg-[#34D399]/10 rounded-xl"><CircleDollarSign className="w-4 h-4 text-[#34D399]" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-[#34D399]">${totalCommissions.toLocaleString()}</span>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Gastos Totales</span>
                            <div className="p-2 bg-red-500/10 rounded-xl"><Receipt className="w-4 h-4 text-red-500" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-red-400">${expenses.toLocaleString()}</span>
                    </div>
                </div>

                {/* GRÁFICOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Donut Chart */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[350px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider mb-4">Resumen de Efectivo</h3>
                        <div className="flex-1 w-full relative">
                            {grossSales > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={donutData} 
                                            innerRadius="65%" 
                                            outerRadius="90%" 
                                            paddingAngle={3} 
                                            dataKey="value" 
                                            stroke="none"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin flujos registrados</div>
                            )}
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[350px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider">Flujo Financiero</h3>
                            <span className="text-xs font-bold px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-mono">Margen: {profitMargin}%</span>
                        </div>
                        <div className="flex-1 w-full relative">
                            {grossSales > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                        <Tooltip 
                                            formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                                            cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                            {barData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin datos suficientes</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* TABLA DETALLADA */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider">Flujo de Caja Detallado</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Categoría</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-dash-text">Servicios Facturados</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-bold">Ingreso</span></td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">${grossSales.toLocaleString()}</td>
                                </tr>
                                <tr className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-dash-text">Productos</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-bold">Ingreso</span></td>
                                    <td className="px-6 py-4 text-right font-mono text-dash-text-soft">$0</td>
                                </tr>
                                <tr className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-dash-text">Descuentos Aplicados</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-md text-xs font-bold">Rebaja</span></td>
                                    <td className="px-6 py-4 text-right font-mono text-dash-text-soft">$0</td>
                                </tr>
                                <tr className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-dash-text">Comisiones Pagadas</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-md text-xs font-bold">Egreso</span></td>
                                    <td className="px-6 py-4 text-right font-mono text-red-400 font-bold">-${totalCommissions.toLocaleString()}</td>
                                </tr>
                                <tr className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-dash-text">Gastos Operativos</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-md text-xs font-bold">Egreso</span></td>
                                    <td className="px-6 py-4 text-right font-mono text-dash-text-soft">-$0</td>
                                </tr>
                                <tr className="bg-white/5 border-t-2 border-t-white/10">
                                    <td colSpan={2} className="px-6 py-4 text-sm font-black text-dash-text uppercase tracking-widest text-right">Ganancia Neta Calculada</td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-400 font-black text-lg">${netProfit.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    // VENTAS - COMISIONES (DASHBOARD FINANCIERO)
    const renderComisiones = () => {
        let totalCommissions = 0;
        let totalSalesGenerated = 0;

        const comisionesData = barbers.map(barber => {
            const barberAppts = completedAppts.filter(a => a.barber_id === barber.id)
            let totalRevenue = 0
            barberAppts.forEach(a => totalRevenue += (a.services?.price || 0))
            const commPercent = barber.commission_percentage || 50
            const payout = (totalRevenue * commPercent) / 100
            const storeKeeps = totalRevenue - payout

            totalCommissions += payout;
            totalSalesGenerated += totalRevenue;

            return {
                id: barber.id,
                barber: barber.full_name || 'Sin Nombre',
                cuts: barberAppts.length,
                totalRevenue,
                commPercent,
                payout,
                storeKeeps,
                initials: (barber.full_name || 'SN').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
            }
        }).filter(d => d.totalRevenue > 0).sort((a,b) => b.payout - a.payout)

        let topEarner = comisionesData.length > 0 ? comisionesData[0] : { barber: '-', payout: 0 }
        let lowestEarner = comisionesData.length > 0 ? comisionesData[comisionesData.length - 1] : { barber: '-', payout: 0 }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Comisiones Totales</span>
                            <div className="p-2 bg-yellow-500/10 rounded-xl"><CircleDollarSign className="w-4 h-4 text-yellow-500" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-yellow-500">${totalCommissions.toLocaleString()}</span>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)] border-l-4 border-l-yellow-500/50">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft truncate pr-2">Mayor Comisión</span>
                            <div className="p-2 bg-yellow-500/10 rounded-xl"><TrendingUp className="w-4 h-4 text-yellow-500" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-dash-text truncate">{topEarner.barber}</span>
                            <span className="text-sm font-semibold font-mono text-yellow-500 shrink-0">${topEarner.payout.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft truncate pr-2">Menor Comisión</span>
                            <div className="p-2 bg-white/5 rounded-xl"><TrendingDown className="w-4 h-4 text-white/40" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-dash-text truncate">{lowestEarner.barber}</span>
                            <span className="text-sm font-semibold font-mono text-dash-text-soft shrink-0">${lowestEarner.payout.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Ventas Generadas</span>
                            <div className="p-2 bg-emerald-500/10 rounded-xl"><Landmark className="w-4 h-4 text-emerald-500" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-dash-text">${totalSalesGenerated.toLocaleString()}</span>
                    </div>
                </div>

                {/* 2. BAR CHART HORIZONTAL */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[400px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider mb-6">Comparativa de Comisiones Generadas</h3>
                    <div className="flex-1 w-full relative">
                        {comisionesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comisionesData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }} />
                                    <YAxis dataKey="barber" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip 
                                        formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="payout" fill="#EAB308" radius={[0, 6, 6, 0]} animationDuration={800} maxBarSize={35} name="Comisión ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin comisiones generadas</div>
                        )}
                    </div>
                </div>

                {/* 3. TABLA DE COMISIONES */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider">Desglose Económico por Colaborador</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Colaborador</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-right">Comisión (%)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-right">Servicios ($)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-right">Propinas ($)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-right">A Pagar ($)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-right">Ventas Totales ($)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {comisionesData.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-white/40 font-mono text-xs uppercase">Sin data registrada</td></tr>
                                ) : comisionesData.map((data, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-500 font-bold text-sm shrink-0">
                                                    {data.initials}
                                                </div>
                                                <span className="text-sm font-bold text-dash-text">{data.barber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-white/5 text-white/70 border border-white/10">
                                                {data.commPercent}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-medium font-mono text-dash-text">${data.payout.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-medium font-mono text-dash-text-soft">$0</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-lg font-black font-mono text-yellow-500">${data.payout.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold font-mono text-dash-text">${data.totalRevenue.toLocaleString()}</span>
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

    // RESERVAS - DIAS (ANALÍTICA AVANZADA)
    const renderReservasDias = () => {
        const daysMap: Record<string, number> = { 'Lun':0, 'Mar':0, 'Mié':0, 'Jue':0, 'Vie':0, 'Sáb':0, 'Dom':0 }
        const fullDayNames: Record<string, string> = { 'Lun': 'Lunes', 'Mar': 'Martes', 'Mié': 'Miércoles', 'Jue': 'Jueves', 'Vie': 'Viernes', 'Sáb': 'Sábado', 'Dom': 'Domingo' }
        
        const validAppts = appointments.filter(a => a.status !== 'cancelled')
        
        validAppts.forEach(a => {
            const dayName = format(new Date(a.start_time), 'EEE', { locale: es })
            let key = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            if(key === 'Dom') daysMap['Dom']++;
            else if(key === 'Lun') daysMap['Lun']++;
            else if(key === 'Mar') daysMap['Mar']++;
            else if(key === 'Mié' || key === 'Mie') daysMap['Mié']++;
            else if(key === 'Jue') daysMap['Jue']++;
            else if(key === 'Vie') daysMap['Vie']++;
            else if(key === 'Sáb' || key === 'Sab') daysMap['Sáb']++;
        })

        const totalReservations = validAppts.length
        const totalDays = 7
        const average = totalReservations > 0 ? (totalReservations / totalDays) : 0

        let bestDay = { name: '-', count: -1 }
        let worstDay = { name: '-', count: 999999 }

        const chartData = Object.entries(daysMap).map(([shortDay, count], index, array) => {
            if (count > bestDay.count) bestDay = { name: fullDayNames[shortDay], count }
            // Only consider worst day if it's not 0 or if all are 0 (to avoid days we are closed)
            if (count < worstDay.count && count >= 0) worstDay = { name: fullDayNames[shortDay], count }

            const prevCount = index === 0 ? 0 : array[index - 1][1]
            let trend = 0
            if (prevCount > 0) trend = Math.round(((count - prevCount) / prevCount) * 100)
            else if (count > 0) trend = 100
            
            return {
                day: shortDay,
                fullName: fullDayNames[shortDay],
                count,
                average: Number(average.toFixed(1)),
                vsAverage: count - average,
                trend
            }
        })

        if (worstDay.count === 999999) worstDay = { name: '-', count: 0 }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. KPIs SUPERIORES */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Reservas Totales</span>
                            <div className="p-2 bg-white/5 rounded-xl"><CalendarDays className="w-4 h-4 text-white/50" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-dash-text">{totalReservations}</span>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Día Más Fuerte</span>
                            <div className="p-2 bg-emerald-500/10 rounded-xl"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-dash-text">{bestDay.name}</span>
                            <span className="text-sm font-semibold font-mono text-emerald-400">{bestDay.count}</span>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Día Más Débil</span>
                            <div className="p-2 bg-red-500/10 rounded-xl"><TrendingDown className="w-4 h-4 text-red-500" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-dash-text">{worstDay.name}</span>
                            <span className="text-sm font-semibold font-mono text-red-400">{worstDay.count}</span>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Promedio Diario</span>
                            <div className="p-2 bg-blue-500/10 rounded-xl"><Activity className="w-4 h-4 text-blue-500" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-dash-text">{average.toFixed(1)}</span>
                    </div>
                </div>

                {/* 2. GRÁFICOS (BARRAS Y TENDENCIA) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Barras */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[350px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider mb-4">Análisis de Volumen</h3>
                        <div className="flex-1 w-full relative">
                            {totalReservations > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', color: '#fff' }}
                                        />
                                        <Bar dataKey="count" fill="#2BC48A" radius={[6, 6, 0, 0]} animationDuration={800} maxBarSize={45} name="Reservas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin datos suficientes</div>
                            )}
                        </div>
                    </div>

                    {/* Gráfico de Tendencia (Línea + Promedio) */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[350px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider mb-4">Tendencia vs Promedio</h3>
                        <div className="flex-1 w-full relative">
                            {totalReservations > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', color: '#fff' }}
                                        />
                                        <ReferenceLine y={average} stroke="#3b82f6" strokeDasharray="6 6" label={{ position: 'top', value: 'Promedio', fill: '#3b82f6', fontSize: 10, fontWeight: 600 }} />
                                        <Line type="monotone" dataKey="count" stroke="#2BC48A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#111' }} activeDot={{ r: 6 }} animationDuration={800} name="Real" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin datos suficientes</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. TABLA DETALLADA */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider">Desglose por Día</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Día</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Cantidad</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Vs. Promedio</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Tendencia (Día Ant.)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {chartData.map((stat, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-dash-text">{stat.fullName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold font-mono text-dash-text">{stat.count}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {stat.vsAverage === 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-white/5 text-white/50 border border-white/10">
                                                    Igual
                                                </span>
                                            ) : stat.vsAverage > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    +{stat.vsAverage.toFixed(1)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-white/5 text-white/50 border border-white/10">
                                                    {stat.vsAverage.toFixed(1)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {stat.trend === 0 ? (
                                                <span className="inline-flex items-center gap-1 text-sm font-medium font-mono text-white/50">
                                                    - 0%
                                                </span>
                                            ) : stat.trend > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-sm font-medium font-mono text-emerald-400">
                                                    <ArrowUpRight className="w-4 h-4" /> {stat.trend}%
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-sm font-medium font-mono text-red-400">
                                                    <ArrowDownRight className="w-4 h-4" /> {Math.abs(stat.trend)}%
                                                </span>
                                            )}
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
            case 'ventas-efectivo': return renderResumenEfectivo();
            case 'ventas-productos': 
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
                return renderReservasColaboradores();

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

    // RESERVAS - COLABORADORES (ANALÍTICA EMPRESARIAL DE RENDIMIENTO)
    const renderReservasColaboradores = () => {
        const validAppts = appointments.filter(a => a.status !== 'cancelled')
        const totalReservations = validAppts.length
        
        // Calculate data per collaborator
        const collaboratorData = barbers.map(barber => {
            const barberAppts = validAppts.filter(a => a.barber_id === barber.id)
            const count = barberAppts.length
            return {
                id: barber.id,
                name: barber.full_name || 'Sin Nombre',
                count: count,
                percentage: totalReservations > 0 ? Number(((count / totalReservations) * 100).toFixed(1)) : 0
            }
        }).filter(c => c.count > 0).sort((a,b) => b.count - a.count) // Only show active barbers, sort by most reservations

        const totalCollaborators = collaboratorData.length
        const average = totalCollaborators > 0 ? Math.round(totalReservations / totalCollaborators) : 0

        let topCollaborator = collaboratorData.length > 0 ? collaboratorData[0] : { name: '-', count: 0 }
        let lowestCollaborator = collaboratorData.length > 0 ? collaboratorData[collaboratorData.length - 1] : { name: '-', count: 0 }

        // Process data for table (add performance metric)
        const tableData = collaboratorData.map(c => {
            const diff = c.count - average
            return {
                ...c,
                performance: diff,
                initials: c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            }
        })

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. KPIs SUPERIORES */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Reservas Totales</span>
                            <div className="p-2 bg-white/5 rounded-xl"><CalendarDays className="w-4 h-4 text-white/50" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black font-mono text-dash-text">{totalReservations}</span>
                            <span className="text-xs font-medium text-dash-text-soft">{totalCollaborators} activos</span>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)] border-l-4 border-l-[#A78BFA]/50">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft truncate pr-2">Mejor Colaborador</span>
                            <div className="p-2 bg-[#A78BFA]/10 rounded-xl"><TrendingUp className="w-4 h-4 text-[#A78BFA]" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-dash-text truncate">{topCollaborator.name}</span>
                            <span className="text-sm font-semibold font-mono text-[#A78BFA] shrink-0">{topCollaborator.count}</span>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft truncate pr-2">Menor Rendimiento</span>
                            <div className="p-2 bg-white/5 rounded-xl"><TrendingDown className="w-4 h-4 text-white/40" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-dash-text truncate">{lowestCollaborator.name}</span>
                            <span className="text-sm font-semibold font-mono text-dash-text-soft shrink-0">{lowestCollaborator.count}</span>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-dash-text-soft">Promedio Individual</span>
                            <div className="p-2 bg-blue-500/10 rounded-xl"><Activity className="w-4 h-4 text-blue-500" /></div>
                        </div>
                        <span className="text-3xl font-black font-mono text-dash-text">{average}</span>
                    </div>
                </div>

                {/* 2. GRÁFICO HORIZONTAL */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 rounded-2xl flex flex-col h-[400px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider mb-6">Distribución de reservas por colaborador</h3>
                    <div className="flex-1 w-full relative">
                        {collaboratorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={collaboratorData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="count" fill="#A78BFA" radius={[0, 6, 6, 0]} animationDuration={800} maxBarSize={35} name="Reservas" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin datos suficientes</div>
                        )}
                    </div>
                </div>

                {/* 3. TABLA RANKING */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider">Clasificación de Colaboradores</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 w-16">Pos.</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5">Colaborador</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-center">Reservas</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-center">% Partic.</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-dash-text-soft uppercase tracking-wider border-b border-white/5 text-right">Actuación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tableData.map((collab, i) => {
                                    // Medals for top 3
                                    let rankDisplay = <span className="text-sm font-bold text-white/30">{i + 1}</span>;
                                    if (i === 0) rankDisplay = <span className="text-xl">🥇</span>;
                                    else if (i === 1) rankDisplay = <span className="text-xl">🥈</span>;
                                    else if (i === 2) rankDisplay = <span className="text-xl">🥉</span>;

                                    // Badge color logic based on percentage (High > 30%, Medium > 15%, Low <= 15%)
                                    // Custom colors adapted to dark mode
                                    let badgeClass = "bg-white/5 text-white/50 border border-white/10";
                                    if (collab.percentage >= 30) badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                                    else if (collab.percentage >= 15) badgeClass = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                                    else badgeClass = "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";

                                    return (
                                        <tr key={collab.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">{rankDisplay}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#A78BFA]/20 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] font-bold text-sm shrink-0">
                                                        {collab.initials}
                                                    </div>
                                                    <span className="text-sm font-bold text-dash-text">{collab.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-lg font-black font-mono text-dash-text">{collab.count}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold font-mono ${badgeClass}`}>
                                                    {collab.percentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {collab.performance === 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium font-mono bg-white/5 text-white/50 border border-white/10">
                                                        En promedio
                                                    </span>
                                                ) : collab.performance > 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        +{collab.performance} vs prom
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                                                        {collab.performance} vs prom
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
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
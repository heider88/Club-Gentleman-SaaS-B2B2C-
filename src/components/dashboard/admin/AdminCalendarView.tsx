"use client"

import React, { useMemo, useState } from "react"
import { format, startOfDay, addMinutes, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { AppointmentCard } from "../AppointmentCard"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

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

type BarberColumn = {
    barberId: string;
    barberName: string;
    avatarUrl?: string;
    appointments: AppointmentWithService[];
}

export function AdminCalendarView({ appointments, userRole, selectedDate = new Date(), barbersList = [] }: { appointments: AppointmentWithService[], userRole: string, selectedDate?: Date, barbersList?: any[] }) {
    const [selectedAppt, setSelectedAppt] = useState<AppointmentWithService | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const view = searchParams.get('view') || 'daily'

    // Extract unique barbers for filtering
    const allBarbers = useMemo(() => {
        const map = new Map<string, { id: string, name: string, avatar: string, color: string }>();
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500'];
        let colorIdx = 0;
        
        // Primero poblamos con la lista completa de barberos que viene del servidor
        barbersList.forEach(b => {
            if (!map.has(b.id)) {
                map.set(b.id, {
                    id: b.id,
                    name: b.full_name || 'Barbero',
                    avatar: b.avatar_url || '',
                    color: colors[colorIdx % colors.length]
                });
                colorIdx++;
            }
        });

        // Fallback por si hay citas de un barbero que no vino en barbersList (eliminado o inactivo)
        // PERO excluimos estrictamente si sabemos que es Admin o si el nombre contiene "GENTLEMAN"
        appointments.forEach(appt => {
            if (!appt.barber_id || map.has(appt.barber_id)) return;
            const fallbackName = appt.profiles?.full_name || 'Barbero';
            
            // Security check: Ignore "GENTLEMAN" admin account from showing up as a barber column
            if (fallbackName.toUpperCase().includes('GENTLEMAN') || fallbackName.toUpperCase() === 'ADMIN') return;

            map.set(appt.barber_id, {
                id: appt.barber_id,
                name: fallbackName,
                avatar: appt.profiles?.avatar_url || '',
                color: colors[colorIdx % colors.length]
            });
            colorIdx++;
        });
        return Array.from(map.values());
    }, [appointments, barbersList]);

    // Initial state: all barbers selected
    const [selectedBarbers, setSelectedBarbers] = useState<string[]>(allBarbers.map(b => b.id));

    // Si allBarbers se actualiza y hay nuevos, agregarlos a la selección
    React.useEffect(() => {
        const newBarbers = allBarbers.filter(b => !selectedBarbers.includes(b.id));
        if (newBarbers.length > 0 && selectedBarbers.length > 0) {
            setTimeout(() => setSelectedBarbers(prev => [...prev, ...newBarbers.map(b => b.id)]), 0);
        }
        if (selectedBarbers.length === 0 && allBarbers.length > 0) {
             setTimeout(() => setSelectedBarbers(allBarbers.map(b => b.id)), 0);
        }
    }, [allBarbers, selectedBarbers]);

    const toggleBarber = (id: string) => {
        setSelectedBarbers(prev => 
            prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
        )
    }

    const setView = (newView: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', newView)
        router.push(`${pathname}?${params.toString()}`)
    }

    // Filter appointments based on selected barbers
    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => selectedBarbers.includes(a.barber_id));
    }, [appointments, selectedBarbers]);

    // 1. Calcular el rango horario dinámico basado en las citas filtradas
    const { startHour, endHour, barberColumns } = useMemo(() => {
        let minTime = 9 * 60 
        let maxTime = 20 * 60 
        const columnsMap = new Map<string, BarberColumn>()

        filteredAppointments.forEach(appt => {
            if (!appt.barber_id) return;

            const startD = new Date(appt.start_time)
            const endD = new Date(appt.end_time)
            
            const startMins = startD.getHours() * 60 + startD.getMinutes()
            const endMins = endD.getHours() * 60 + endD.getMinutes()

            if (startMins < minTime) minTime = Math.max(0, startMins - 60) 
            if (endMins > maxTime) maxTime = Math.min(24 * 60, endMins + 60) 

            if (!columnsMap.has(appt.barber_id)) {
                columnsMap.set(appt.barber_id, {
                    barberId: appt.barber_id,
                    barberName: appt.profiles?.full_name || 'Barbero',
                    avatarUrl: appt.profiles?.avatar_url || '',
                    appointments: []
                })
            }
            columnsMap.get(appt.barber_id)!.appointments.push(appt)
        })

        const sHour = Math.floor(minTime / 60)
        const eHour = Math.ceil(maxTime / 60)

        return {
            startHour: sHour,
            endHour: eHour,
            barberColumns: Array.from(columnsMap.values())
        }
    }, [filteredAppointments])

    // Generar los "ticks" de tiempo (cada 30 min)
    const timeSlots: Date[] = []
    const baseDate = startOfDay(selectedDate)
    for (let h = startHour; h <= endHour; h++) {
        timeSlots.push(addMinutes(baseDate, h * 60))
        if (h < endHour) {
            timeSlots.push(addMinutes(baseDate, h * 60 + 30))
        }
    }

    const PIXELS_PER_MINUTE = 2 
    const ROW_HEIGHT = 60 

    const calculateTop = (startTimeStr: string) => {
        const d = new Date(startTimeStr)
        const minutesFromStart = (d.getHours() - startHour) * 60 + d.getMinutes()
        return minutesFromStart * PIXELS_PER_MINUTE
    }

    const calculateHeight = (durationMins: number) => {
        return durationMins * PIXELS_PER_MINUTE
    }

    // Renderizado según la vista
    const renderDailyView = () => {
        if (filteredAppointments.length === 0) {
            return (
                <div className="text-center py-20 bg-dash-panel backdrop-blur-xl border border-dash-border flex-1 flex flex-col items-center justify-center">
                    <p className="font-oswald text-4xl text-dash-text-soft/20 uppercase font-black mb-4">00</p>
                    <p className="font-oswald text-2xl text-dash-text-soft uppercase">Agenda Vacía</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-dash-text-muted mt-2">No hay citas registradas para este día.</p>
                </div>
            )
        }
        return (
            <div className="relative border border-dash-border bg-dash-panel backdrop-blur-xl flex flex-col flex-1 overflow-hidden">
                <div className="flex border-b border-dash-border bg-transparent z-20 sticky top-0">
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border flex items-end justify-end pb-2 pr-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-dash-text-soft">Hora</span>
                    </div>
                    <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                        {barberColumns.map(col => {
                            const barberInfo = allBarbers.find(b => b.id === col.barberId);
                            const colorClass = barberInfo?.color || 'bg-dash-text';
                            return (
                            <div key={col.barberId} className="flex-1 min-w-[200px] md:min-w-[250px] p-4 flex items-center gap-3 border-r border-dash-border last:border-r-0">
                                <div className="w-10 h-10 border border-dash-border-alt bg-dash-panel backdrop-blur-xl-alt overflow-hidden shrink-0">
                                    {col.avatarUrl ? (
                                        <img src={col.avatarUrl} alt={col.barberName} className="w-full h-full object-cover grayscale" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center grayscale opacity-50">🧔🏻‍♂️</div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${colorClass} shadow-[0_0_8px_currentColor] opacity-80`} />
                                        <span className="font-oswald text-sm md:text-base uppercase tracking-widest text-dash-text truncate">{col.barberName.split(' ')[0]}</span>
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-dash-text-muted">Barbero</span>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex relative bg-transparent" style={{ backgroundImage: 'linear-gradient(var(--dash-border) 1px, transparent 1px)', backgroundSize: `100% ${ROW_HEIGHT}px` }}>
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border bg-dash-panel backdrop-blur-xl sticky left-0 z-10">
                        {timeSlots.map((time, idx) => (
                            <div key={idx} className="relative w-full border-b border-dash-border/50 text-right pr-2" style={{ height: ROW_HEIGHT }}>
                                {time.getMinutes() === 0 && (
                                    <span className="absolute -top-3 right-2 font-oswald text-xs text-dash-text-muted">
                                        {format(time, 'HH:mm')}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 flex relative min-w-max">
                        {barberColumns.map(col => (
                            <div key={col.barberId} className="flex-1 min-w-[200px] md:min-w-[250px] border-r border-dash-border/30 relative">
                                {col.appointments.map(appt => {
                                    const isPending = appt.status === 'pending' || appt.status === 'confirmed'
                                    const isCancelled = appt.status === 'cancelled'
                                    const duration = appt.services?.duration_minutes || 30
                                    const top = calculateTop(appt.start_time)
                                    const height = calculateHeight(duration)
                                    const isSelected = selectedAppt?.id === appt.id
                                    const barberInfo = allBarbers.find(b => b.id === appt.barber_id);
                                    
                                    // Make cancelled appointments strictly grey
                                    const colorClass = isCancelled ? 'bg-dash-border-alt' : (barberInfo?.color || 'bg-dash-text');

                                    return (
                                        <div 
                                            key={appt.id}
                                            onClick={() => setSelectedAppt(appt)}
                                            className={`absolute left-1 right-1 border p-2 cursor-pointer transition-all duration-300 overflow-hidden group
                                                ${isPending 
                                                    ? 'bg-dash-panel backdrop-blur-xl border-dash-border hover:border-dash-text hover:shadow-lg z-10' 
                                                    : isCancelled
                                                        ? 'bg-black/40 border-dash-border-alt/20 opacity-40 hover:opacity-70 grayscale z-0'
                                                        : 'bg-transparent border-dash-border-alt/30 opacity-60 hover:opacity-100 z-0'
                                                }
                                                ${isSelected ? 'ring-2 ring-dash-text z-30' : ''}
                                            `}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`font-oswald text-[10px] ${isCancelled ? 'line-through text-dash-text-soft/50' : 'text-dash-text-soft'}`}>
                                                    {format(new Date(appt.start_time), 'HH:mm')}
                                                </span>
                                            </div>
                                            <h4 className={`font-oswald text-sm uppercase truncate ${isPending ? 'text-dash-text' : isCancelled ? 'text-dash-text-soft/50 line-through' : 'text-dash-text-muted'}`}>
                                                {appt.customer_name}
                                            </h4>
                                            {height >= 60 && (
                                                <p className={`text-[9px] font-bold uppercase tracking-widest truncate mt-1 ${isCancelled ? 'text-dash-text-soft/50 line-through' : 'text-dash-text-soft'}`}>
                                                    {appt.services?.name || 'Servicio'}
                                                </p>
                                            )}
                                            <div className={`absolute top-0 left-0 w-1 h-full ${colorClass} ${isPending ? 'opacity-100 shadow-[0_0_8px_rgba(255,255,255,0.2)]' : isCancelled ? 'opacity-20' : 'opacity-40'}`}></div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const renderWeeklyView = () => {
        const daysOfWeek = [];
        const d = new Date(selectedDate);
        const dayNum = d.getDay();
        const diff = d.getDate() - dayNum + (dayNum === 0 ? -6 : 1);
        const startOfWeekDate = new Date(d.setDate(diff));
        startOfWeekDate.setHours(0,0,0,0);

        for (let i = 0; i < 7; i++) {
            const currentD = new Date(startOfWeekDate);
            currentD.setDate(startOfWeekDate.getDate() + i);
            daysOfWeek.push(currentD);
        }

        if (filteredAppointments.length === 0) {
            return (
                <div className="text-center py-20 bg-dash-panel backdrop-blur-xl border border-dash-border flex-1 flex flex-col items-center justify-center">
                    <p className="font-oswald text-4xl text-dash-text-soft/20 uppercase font-black mb-4">00</p>
                    <p className="font-oswald text-2xl text-dash-text-soft uppercase">Agenda Vacía</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-dash-text-muted mt-2">No hay citas registradas para esta semana.</p>
                </div>
            )
        }

        return (
            <div className="relative border border-dash-border bg-dash-panel backdrop-blur-xl flex flex-col flex-1 overflow-hidden">
                {/* Cabecera de Días (Editorial) */}
                <div className="flex border-b-2 border-dash-border bg-transparent z-20 sticky top-0">
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border flex items-end justify-end pb-2 pr-2 bg-dash-panel backdrop-blur-xl">
                        <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-dash-text-soft">Hora</span>
                    </div>
                    <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                        {daysOfWeek.map((day, i) => {
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={i} className={`flex-1 min-w-[150px] p-4 flex flex-col items-center justify-center border-r border-dash-border last:border-r-0 ${isToday ? 'bg-dash-text/5' : ''}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isToday ? 'text-primary' : 'text-dash-text-muted'}`}>
                                        {format(day, 'EEEE', { locale: es })}
                                    </span>
                                    <span className={`font-oswald text-2xl tracking-tight ${isToday ? 'text-dash-text font-black' : 'text-dash-text-soft'}`}>
                                        {format(day, 'd MMM', { locale: es })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex relative bg-transparent" style={{ backgroundImage: 'linear-gradient(var(--dash-border) 1px, transparent 1px)', backgroundSize: `100% ${ROW_HEIGHT}px` }}>
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border bg-dash-panel backdrop-blur-xl sticky left-0 z-10">
                        {timeSlots.map((time, idx) => (
                            <div key={idx} className="relative w-full border-b border-dash-border/50 text-right pr-2" style={{ height: ROW_HEIGHT }}>
                                {time.getMinutes() === 0 && (
                                    <span className="absolute -top-3 right-2 font-oswald text-xs text-dash-text-muted">
                                        {format(time, 'HH:mm')}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 flex relative min-w-max">
                        {daysOfWeek.map((day, i) => {
                            const dayAppts = filteredAppointments.filter(a => isSameDay(new Date(a.start_time), day));
                            const isToday = isSameDay(day, new Date());
                            
                            return (
                                <div key={i} className={`flex-1 min-w-[150px] border-r border-dash-border/30 relative ${isToday ? 'bg-white/[0.02]' : ''}`}>
                                    {dayAppts.map((appt, idx) => {
                                        const barberInfo = allBarbers.find(b => b.id === appt.barber_id);
                                        const isCancelled = appt.status === 'cancelled';
                                        const colorClass = isCancelled ? 'bg-dash-border-alt' : (barberInfo?.color || 'bg-dash-text');
                                        
                                        const duration = appt.services?.duration_minutes || 30;
                                        const top = calculateTop(appt.start_time);
                                        const height = calculateHeight(duration);
                                        const isSelected = selectedAppt?.id === appt.id;

                                        const overlaps = dayAppts.filter(a => {
                                            const s1 = new Date(appt.start_time).getTime();
                                            const e1 = new Date(appt.end_time).getTime();
                                            const s2 = new Date(a.start_time).getTime();
                                            const e2 = new Date(a.end_time).getTime();
                                            return Math.max(s1, s2) < Math.min(e1, e2);
                                        });

                                        const overlappingCount = overlaps.length;
                                        const overlapIndex = overlaps.findIndex(a => a.id === appt.id);

                                        const widthStr = overlappingCount > 1 ? `${100 / overlappingCount}%` : 'calc(100% - 8px)';
                                        const leftStr = overlappingCount > 1 ? `${(100 / overlappingCount) * overlapIndex}%` : '4px';

                                        return (
                                            <div 
                                                key={appt.id}
                                                onClick={() => setSelectedAppt(appt)}
                                                className={`absolute border p-2 cursor-pointer transition-all duration-300 overflow-hidden group hover:z-20
                                                    bg-black/60 backdrop-blur-md border-dash-border hover:border-dash-text shadow-[0_4px_10px_rgba(0,0,0,0.5)]
                                                    ${isSelected ? 'ring-1 ring-dash-text z-30' : 'z-10'}
                                                    ${isCancelled ? 'opacity-40 hover:opacity-70 grayscale' : ''}
                                                `}
                                                style={{ top: `${top}px`, height: `${height}px`, width: widthStr, left: leftStr }}
                                            >
                                                {/* Colored glowing accent line */}
                                                <div className={`absolute top-0 left-0 w-1 h-full ${colorClass} ${isCancelled ? 'opacity-20' : 'shadow-[0_0_10px_currentColor] opacity-80 group-hover:opacity-100'}`}></div>
                                                <div className="flex flex-col h-full pl-2">
                                                    <span className={`font-mono text-[9px] leading-tight tracking-widest ${isCancelled ? 'line-through text-dash-text-soft/50' : 'text-dash-text-soft'}`}>
                                                        {format(new Date(appt.start_time), 'HH:mm')}
                                                    </span>
                                                    <h4 className={`font-oswald text-[11px] uppercase truncate leading-tight mt-1 tracking-wide ${isCancelled ? 'line-through text-dash-text-soft/50' : 'text-dash-text'}`}>
                                                        {appt.customer_name}
                                                    </h4>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderMonthlyView = () => {
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        const days = [];
        // Fill padding days for the first week
        const startPad = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // assuming week starts on Monday
        for(let i=0; i<startPad; i++) {
            days.push(null);
        }
        
        for(let i=1; i<=lastDayOfMonth.getDate(); i++) {
            days.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i));
        }

        return (
            <div className="relative border border-dash-border bg-dash-panel backdrop-blur-xl flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-dash-border bg-transparent">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="p-3 text-center border-r border-dash-border last:border-r-0 bg-dash-panel backdrop-blur-xl/50">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-dash-text-muted">{day}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-transparent gap-px border-t border-dash-border/30" style={{ backgroundColor: 'var(--dash-border)' }}>
                    {days.map((day, idx) => {
                        if (!day) return <div key={`pad-${idx}`} className="bg-transparent/50"></div>;

                        const dayAppts = filteredAppointments.filter(a => isSameDay(new Date(a.start_time), day));
                        
                        // Count appts per barber
                        const counts: Record<string, number> = {};
                        dayAppts.forEach(a => {
                            counts[a.barber_id] = (counts[a.barber_id] || 0) + 1;
                        });

                        const isToday = isSameDay(day, new Date());

                        return (
                            <div 
                                key={day.toISOString()} 
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString())
                                    params.set('date', format(day, 'yyyy-MM-dd'))
                                    params.set('view', 'daily')
                                    router.push(`${pathname}?${params.toString()}`)
                                }}
                                className={`bg-dash-panel backdrop-blur-xl p-2 flex flex-col gap-2 cursor-pointer hover:bg-white/[0.05] transition-colors group relative overflow-hidden ${isToday ? 'bg-dash-text/[0.02]' : ''}`}
                            >
                                <span className={`absolute -bottom-4 -right-2 text-[60px] font-oswald font-black leading-none opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none ${isToday ? 'text-dash-text opacity-10' : 'text-white'}`}>
                                    {format(day, 'd')}
                                </span>
                                
                                <span className={`text-sm font-oswald relative z-10 ${isToday ? 'text-dash-text font-black' : 'text-dash-text-soft'}`}>
                                    {format(day, 'd')}
                                </span>
                                
                                <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide flex-1 relative z-10 mt-2">
                                    {Object.entries(counts).map(([bId, count]) => {
                                        const barber = allBarbers.find(b => b.id === bId);
                                        if(!barber) return null;
                                        return (
                                            <div key={bId} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <div className={`w-1.5 h-1.5 rounded-full ${barber.color} shadow-[0_0_8px_currentColor] opacity-80`} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-dash-text-muted hidden sm:block">{barber.name.split(' ')[0]}</span>
                                                <span className="text-[10px] font-mono font-bold text-dash-text ml-auto">{count}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="absolute inset-0 border border-transparent group-hover:border-dash-border-alt pointer-events-none transition-colors"></div>
                                {isToday && <div className="absolute top-0 left-0 w-full h-0.5 bg-dash-text"></div>}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-[70vh] md:h-[80vh]">
            {/* Header Controls: Filters and View Switcher */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-dash-panel backdrop-blur-xl border border-dash-border p-3 rounded-2xl">
                
                {/* Barber Filter Pills */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-dash-text-muted mr-3">Team Filter:</span>
                    {allBarbers.map(barber => {
                        const isSelected = selectedBarbers.includes(barber.id);
                        return (
                            <button 
                                key={barber.id}
                                onClick={() => toggleBarber(barber.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-none border-b-2 transition-all duration-300 group
                                    ${isSelected 
                                        ? `border-dash-text bg-dash-panel backdrop-blur-xl-alt/50 text-dash-text` 
                                        : `border-transparent bg-transparent text-dash-text-soft opacity-40 hover:opacity-100 hover:border-dash-border grayscale hover:grayscale-0`
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${barber.color} ${isSelected ? 'shadow-[0_0_10px_currentColor] animate-pulse' : ''}`} />
                                {barber.avatar ? (
                                    <img src={barber.avatar} alt="avatar" className="w-5 h-5 object-cover rounded-none" />
                                ) : (
                                    <div className="w-5 h-5 bg-transparent flex items-center justify-center text-[8px] font-mono border border-dash-border">B</div>
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{barber.name.split(' ')[0]}</span>
                            </button>
                        )
                    })}
                </div>

                {/* View Switcher Brutalista */}
                <div className="flex bg-black/40 border border-dash-border/50 p-1 rounded-none">
                    {['daily', 'weekly', 'monthly'].map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-none transition-all ${
                                view === v ? 'bg-dash-text text-dash-bg shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-dash-text-muted hover:text-dash-text hover:bg-dash-panel backdrop-blur-xl-alt'
                            }`}
                        >
                            {v === 'daily' ? 'Diario' : v === 'weekly' ? 'Semanal' : 'Mensual'}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'daily' && renderDailyView()}
            {view === 'weekly' && renderWeeklyView()}
            {view === 'monthly' && renderMonthlyView()}

            {/* Popover/Modal Detalles de la Cita */}
            {selectedAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAppt(null)}>
                    <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="bg-dash-panel backdrop-blur-xl border border-dash-border shadow-2xl relative">
                            <button 
                                onClick={() => setSelectedAppt(null)}
                                className="absolute -top-3 -right-3 w-8 h-8 bg-dash-text text-dash-bg font-bold flex items-center justify-center z-10 hover:scale-110 transition-transform"
                            >
                                X
                            </button>
                            <AppointmentCard appt={selectedAppt} userRole={userRole} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


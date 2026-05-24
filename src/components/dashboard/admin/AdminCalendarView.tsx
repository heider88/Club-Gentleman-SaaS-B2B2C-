"use client"

import React, { useMemo, useState } from "react"
import { format, differenceInMinutes, startOfDay, addMinutes, isSameDay, getDay } from "date-fns"
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

export function AdminCalendarView({ appointments, userRole, selectedDate = new Date() }: { appointments: AppointmentWithService[], userRole: string, selectedDate?: Date }) {
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
        
        appointments.forEach(appt => {
            if (!appt.barber_id || map.has(appt.barber_id)) return;
            map.set(appt.barber_id, {
                id: appt.barber_id,
                name: appt.profiles?.full_name || 'Barbero',
                avatar: appt.profiles?.avatar_url || '',
                color: colors[colorIdx % colors.length]
            });
            colorIdx++;
        });
        return Array.from(map.values());
    }, [appointments]);

    // Initial state: all barbers selected
    const [selectedBarbers, setSelectedBarbers] = useState<string[]>(allBarbers.map(b => b.id));

    // Si allBarbers se actualiza y hay nuevos, agregarlos a la selección
    React.useEffect(() => {
        const newBarbers = allBarbers.filter(b => !selectedBarbers.includes(b.id));
        if (newBarbers.length > 0 && selectedBarbers.length > 0) {
            setSelectedBarbers(prev => [...prev, ...newBarbers.map(b => b.id)]);
        }
        if (selectedBarbers.length === 0 && allBarbers.length > 0) {
             setSelectedBarbers(allBarbers.map(b => b.id));
        }
    }, [allBarbers]);

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
    const timeSlots = []
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
        if (barberColumns.length === 0) {
            return (
                <div className="text-center py-20 bg-dash-panel border border-dash-border flex-1">
                    <p className="font-oswald text-2xl text-dash-text-soft uppercase">Agenda Vacía</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-dash-text-muted mt-2">No hay citas registradas para este día.</p>
                </div>
            )
        }
        return (
            <div className="relative border border-dash-border bg-dash-panel flex flex-col flex-1 overflow-hidden">
                <div className="flex border-b border-dash-border bg-dash-bg z-20 sticky top-0">
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border flex items-end justify-end pb-2 pr-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-dash-text-soft">Hora</span>
                    </div>
                    <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                        {barberColumns.map(col => (
                            <div key={col.barberId} className="flex-1 min-w-[200px] md:min-w-[250px] p-4 flex items-center gap-3 border-r border-dash-border last:border-r-0">
                                <div className="w-10 h-10 border border-dash-border-alt bg-dash-panel-alt overflow-hidden shrink-0">
                                    {col.avatarUrl ? (
                                        <img src={col.avatarUrl} alt={col.barberName} className="w-full h-full object-cover grayscale" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center grayscale opacity-50">🧔🏻‍♂️</div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-oswald text-sm md:text-base uppercase tracking-widest text-dash-text truncate">{col.barberName.split(' ')[0]}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-dash-text-muted">Barbero</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex relative bg-dash-bg" style={{ backgroundImage: 'linear-gradient(var(--dash-border) 1px, transparent 1px)', backgroundSize: `100% ${ROW_HEIGHT}px` }}>
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border bg-dash-panel sticky left-0 z-10">
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
                                    const duration = appt.services?.duration_minutes || 30
                                    const top = calculateTop(appt.start_time)
                                    const height = calculateHeight(duration)
                                    const isSelected = selectedAppt?.id === appt.id

                                    return (
                                        <div 
                                            key={appt.id}
                                            onClick={() => setSelectedAppt(appt)}
                                            className={`absolute left-1 right-1 border p-2 cursor-pointer transition-all duration-300 overflow-hidden group
                                                ${isPending 
                                                    ? 'bg-dash-panel border-dash-border hover:border-dash-text hover:shadow-lg z-10' 
                                                    : 'bg-dash-bg border-dash-border-alt/30 opacity-60 hover:opacity-100 z-0'
                                                }
                                                ${isSelected ? 'ring-2 ring-dash-text z-30' : ''}
                                            `}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-oswald text-[10px] text-dash-text-soft">
                                                    {format(new Date(appt.start_time), 'HH:mm')}
                                                </span>
                                            </div>
                                            <h4 className={`font-oswald text-sm uppercase truncate ${isPending ? 'text-dash-text' : 'text-dash-text-muted'}`}>
                                                {appt.customer_name}
                                            </h4>
                                            {height >= 60 && (
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-dash-text-soft truncate mt-1">
                                                    {appt.services?.name || 'Servicio'}
                                                </p>
                                            )}
                                            <div className={`absolute top-0 left-0 w-1 h-full ${isPending ? 'bg-dash-text' : 'bg-dash-border-alt'}`}></div>
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
                <div className="text-center py-20 bg-dash-panel border border-dash-border flex-1">
                    <p className="font-oswald text-2xl text-dash-text-soft uppercase">Agenda Vacía</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-dash-text-muted mt-2">No hay citas registradas para esta semana.</p>
                </div>
            )
        }

        return (
            <div className="relative border border-dash-border bg-dash-panel flex flex-col flex-1 overflow-hidden">
                {/* Cabecera de Días */}
                <div className="flex border-b border-dash-border bg-dash-bg z-20 sticky top-0">
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border flex items-end justify-end pb-2 pr-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-dash-text-soft">Hora</span>
                    </div>
                    <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                        {daysOfWeek.map((day, i) => (
                            <div key={i} className="flex-1 min-w-[150px] p-4 flex flex-col items-center justify-center border-r border-dash-border last:border-r-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-dash-text-muted">{format(day, 'EEEE', { locale: es })}</span>
                                <span className="font-oswald text-xl text-dash-text">{format(day, 'd MMM', { locale: es })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex relative bg-dash-bg" style={{ backgroundImage: 'linear-gradient(var(--dash-border) 1px, transparent 1px)', backgroundSize: `100% ${ROW_HEIGHT}px` }}>
                    <div className="w-16 md:w-20 shrink-0 border-r border-dash-border bg-dash-panel sticky left-0 z-10">
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
                            
                            // Simple collision strategy: divide width by number of concurrent appts
                            // For a better visual, we just offset them a bit if they collide, or place them side by side
                            // Here we will do side by side for overlapping
                            
                            return (
                                <div key={i} className="flex-1 min-w-[150px] border-r border-dash-border/30 relative">
                                    {dayAppts.map((appt, idx) => {
                                        const barberInfo = allBarbers.find(b => b.id === appt.barber_id);
                                        const colorClass = barberInfo?.color || 'bg-dash-text';
                                        
                                        const duration = appt.services?.duration_minutes || 30;
                                        const top = calculateTop(appt.start_time);
                                        const height = calculateHeight(duration);
                                        const isSelected = selectedAppt?.id === appt.id;

                                        // Find overlapping appointments to calculate width and left offset
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
                                                    bg-dash-panel border-dash-border hover:border-dash-text
                                                    ${isSelected ? 'ring-2 ring-dash-text z-30' : 'z-10'}
                                                `}
                                                style={{ top: `${top}px`, height: `${height}px`, width: widthStr, left: leftStr }}
                                            >
                                                <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
                                                <div className="flex flex-col h-full pl-2">
                                                    <span className="font-oswald text-[10px] text-dash-text-soft leading-tight">
                                                        {format(new Date(appt.start_time), 'HH:mm')}
                                                    </span>
                                                    <h4 className="font-oswald text-xs uppercase truncate text-dash-text leading-tight mt-0.5">
                                                        {appt.customer_name}
                                                    </h4>
                                                    {height >= 60 && (
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-dash-text-muted truncate mt-1">
                                                            {appt.profiles?.full_name?.split(' ')[0] || 'Barbero'}
                                                        </p>
                                                    )}
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
            <div className="relative border border-dash-border bg-dash-panel flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-dash-border bg-dash-bg">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="p-3 text-center border-r border-dash-border last:border-r-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-dash-text-muted">{day}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-dash-bg gap-px border-t border-dash-border/30" style={{ backgroundColor: 'var(--dash-border)' }}>
                    {days.map((day, idx) => {
                        if (!day) return <div key={`pad-${idx}`} className="bg-dash-panel/30"></div>;

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
                                className={`bg-dash-panel p-2 flex flex-col gap-1 cursor-pointer hover:bg-dash-panel-alt transition-colors group relative ${isToday ? 'ring-inset ring-1 ring-dash-text' : ''}`}
                            >
                                <span className={`text-sm font-oswald mb-1 ${isToday ? 'text-dash-text font-black' : 'text-dash-text-soft'}`}>
                                    {format(day, 'd')}
                                </span>
                                
                                <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide flex-1">
                                    {Object.entries(counts).map(([bId, count]) => {
                                        const barber = allBarbers.find(b => b.id === bId);
                                        if(!barber) return null;
                                        return (
                                            <div key={bId} className={`flex items-center justify-between px-1.5 py-0.5 ${barber.color}/20 border border-${barber.color.replace('bg-', '')}/30 rounded-sm`}>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest text-${barber.color.replace('bg-', '')}`}>{barber.name.split(' ')[0]}</span>
                                                <span className="text-[10px] font-black text-dash-text">{count}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="absolute inset-0 border border-transparent group-hover:border-dash-border-alt pointer-events-none transition-colors"></div>
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-dash-panel border border-dash-border p-3 rounded-2xl">
                
                {/* Barber Filter Pills */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-dash-text-muted mr-2">Filtro:</span>
                    {allBarbers.map(barber => {
                        const isSelected = selectedBarbers.includes(barber.id);
                        return (
                            <button 
                                key={barber.id}
                                onClick={() => toggleBarber(barber.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
                                    ${isSelected 
                                        ? `bg-dash-panel-alt border-dash-border text-dash-text` 
                                        : `bg-transparent border-dash-border/30 text-dash-text-muted opacity-50 hover:opacity-100 grayscale hover:grayscale-0`
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${barber.color} shadow-[0_0_8px_currentColor]`} />
                                {barber.avatar ? (
                                    <img src={barber.avatar} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-dash-bg flex items-center justify-center text-[8px]">🧑</div>
                                )}
                                <span className="text-xs font-bold uppercase tracking-wider">{barber.name.split(' ')[0]}</span>
                            </button>
                        )
                    })}
                </div>

                {/* View Switcher */}
                <div className="flex bg-dash-bg border border-dash-border p-1 rounded-xl">
                    {['daily', 'weekly', 'monthly'].map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                view === v ? 'bg-dash-text text-dash-bg shadow-md' : 'text-dash-text-muted hover:text-dash-text hover:bg-dash-panel-alt'
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
                        <div className="bg-dash-panel border border-dash-border shadow-2xl relative">
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


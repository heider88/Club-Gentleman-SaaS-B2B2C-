"use client"

import { useMemo, useState } from "react"
import { format, differenceInMinutes, startOfDay, addMinutes, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { AppointmentCard } from "../AppointmentCard"

type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    barber_id: string; // Changed to required for Admin view
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

export function AdminCalendarView({ appointments, userRole }: { appointments: AppointmentWithService[], userRole: string }) {
    const [selectedAppt, setSelectedAppt] = useState<AppointmentWithService | null>(null)

    // 1. Calcular el rango horario dinámico basado en las citas del día
    const { startHour, endHour, barberColumns } = useMemo(() => {
        let minTime = 9 * 60 // 9:00 AM default
        let maxTime = 20 * 60 // 8:00 PM default
        const columnsMap = new Map<string, BarberColumn>()

        // Procesar citas
        appointments.forEach(appt => {
            if (!appt.barber_id) return;

            // Extraer hora y minuto en minutos desde las 00:00
            const startD = new Date(appt.start_time)
            const endD = new Date(appt.end_time)
            
            const startMins = startD.getHours() * 60 + startD.getMinutes()
            const endMins = endD.getHours() * 60 + endD.getMinutes()

            if (startMins < minTime) minTime = Math.max(0, startMins - 60) // Dar 1 hora de margen arriba
            if (endMins > maxTime) maxTime = Math.min(24 * 60, endMins + 60) // Dar 1 hora de margen abajo

            // Agrupar por barbero
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

        // Redondear horas (ej. si minTime es 8:15, hacer que empiece a las 8:00)
        const sHour = Math.floor(minTime / 60)
        const eHour = Math.ceil(maxTime / 60)

        return {
            startHour: sHour,
            endHour: eHour,
            barberColumns: Array.from(columnsMap.values())
        }
    }, [appointments])

    // Generar los "ticks" de tiempo (cada 30 min)
    const timeSlots = []
    const baseDate = startOfDay(new Date())
    for (let h = startHour; h <= endHour; h++) {
        timeSlots.push(addMinutes(baseDate, h * 60))
        if (h < endHour) {
            timeSlots.push(addMinutes(baseDate, h * 60 + 30))
        }
    }

    // Configuración visual (Luxury Industrial)
    const PIXELS_PER_MINUTE = 2 // 1 hora = 120px de altura
    const ROW_HEIGHT = 60 // 30 minutos = 60px

    const calculateTop = (startTimeStr: string) => {
        const d = new Date(startTimeStr)
        const minutesFromStart = (d.getHours() - startHour) * 60 + d.getMinutes()
        return minutesFromStart * PIXELS_PER_MINUTE
    }

    const calculateHeight = (durationMins: number) => {
        return durationMins * PIXELS_PER_MINUTE
    }

    if (barberColumns.length === 0) {
        return (
            <div className="text-center py-20 bg-dash-panel border border-dash-border">
                <p className="font-oswald text-2xl text-dash-text-soft uppercase">Agenda Vacía</p>
                <p className="text-xs font-bold uppercase tracking-widest text-dash-text-muted mt-2">No hay citas registradas para hoy.</p>
            </div>
        )
    }

    return (
        <div className="relative border border-dash-border bg-dash-panel flex flex-col h-[70vh] md:h-[80vh]">
            
            {/* Cabecera Fija (Nombres de Barberos) */}
            <div className="flex border-b border-dash-border bg-dash-bg z-20 sticky top-0">
                {/* Columna vacía esquina superior izq (para el eje Y) */}
                <div className="w-16 md:w-20 shrink-0 border-r border-dash-border flex items-end justify-end pb-2 pr-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-dash-text-soft">Hora</span>
                </div>
                
                {/* Cabeceras de Barberos */}
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

            {/* Cuerpo del Calendario (Scroll Y/X) */}
            <div className="flex-1 overflow-auto flex relative bg-dash-bg" style={{ backgroundImage: 'linear-gradient(var(--dash-border) 1px, transparent 1px)', backgroundSize: `100% ${ROW_HEIGHT}px` }}>
                
                {/* Eje Y Fijo (Horas) */}
                <div className="w-16 md:w-20 shrink-0 border-r border-dash-border bg-dash-panel sticky left-0 z-10">
                    {timeSlots.map((time, idx) => (
                        <div key={idx} className="relative w-full border-b border-dash-border/50 text-right pr-2" style={{ height: ROW_HEIGHT }}>
                            {/* Solo mostrar hora en punto, no en medias horas, para un diseño más limpio */}
                            {time.getMinutes() === 0 && (
                                <span className="absolute -top-3 right-2 font-oswald text-xs text-dash-text-muted">
                                    {format(time, 'HH:mm')}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Columnas de Citas */}
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
                                            {!isPending && (
                                                <span className="text-[8px] bg-dash-text text-dash-bg px-1 font-bold uppercase tracking-widest">OK</span>
                                            )}
                                        </div>
                                        <h4 className={`font-oswald text-sm uppercase truncate ${isPending ? 'text-dash-text' : 'text-dash-text-muted'}`}>
                                            {appt.customer_name}
                                        </h4>
                                        {height >= 60 && (
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-dash-text-soft truncate mt-1">
                                                {appt.services?.name || 'Servicio'}
                                            </p>
                                        )}
                                        
                                        {/* Barra indicadora lateral izquierda de estatus */}
                                        <div className={`absolute top-0 left-0 w-1 h-full ${isPending ? 'bg-dash-text' : 'bg-dash-border-alt'}`}></div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* Popover/Modal Detalles de la Cita */}
                {selectedAppt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAppt(null)}>
                        <div 
                            className="w-full max-w-sm" 
                            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
                        >
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
        </div>
    )
}

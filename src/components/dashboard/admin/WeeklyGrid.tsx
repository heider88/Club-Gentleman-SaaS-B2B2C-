"use client"

import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    barber_id: string;
    services: {
        name: string;
        price: number;
        duration_minutes: number;
    } | null;
}

type Barber = {
    id: string;
    name: string;
    color: string;
}

export const WeeklyGrid = ({
    selectedDate,
    timeSlots,
    appointments,
    allBarbers,
    selectedBarbers,
    startHour,
    onSlotTap,
    onAppointmentTap
}: {
    selectedDate: Date;
    timeSlots: Date[];
    appointments: AppointmentWithService[];
    allBarbers: Barber[];
    selectedBarbers: string[];
    startHour: number;
    onSlotTap: (barberId: string, time: Date) => void;
    onAppointmentTap: (appt: AppointmentWithService) => void;
}) => {
    // Usamos una altura cómoda para leer texto dentro
    const ROW_HEIGHT = 60; 
    const PIXELS_PER_MINUTE = ROW_HEIGHT / 60;

    // Calcular los 7 días de la semana
    const daysOfWeek: Date[] = [];
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

    const calculateTopMins = (startTimeStr: string) => {
        const d = new Date(startTimeStr);
        const minutesFromStart = (d.getHours() - startHour) * 60 + d.getMinutes();
        return minutesFromStart * PIXELS_PER_MINUTE;
    };

    // En vista semanal siempre hay exactamente 1 barbero seleccionado por lógica del padre
    const activeBarberId = selectedBarbers[0];
    const barber = allBarbers.find(b => b.id === activeBarberId);
    
    // Fallbacks de color por si acaso
    const colorHex = barber?.color || 'bg-dash-text'; 
    const borderColorClass = colorHex.replace('bg-', 'border-');
    const bgTranslucentClass = colorHex.replace('bg-', 'bg-').concat('/20');
    const textColorClass = colorHex.replace('bg-', 'text-');

    return (
        <div className="flex-1 overflow-auto flex bg-dash-bg relative">
            {/* Fondo de cuadrícula global (Líneas claras continuas) */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)', 
                    backgroundSize: `100% ${ROW_HEIGHT / 2}px`,
                    marginTop: '40px' // Offset para el header del día
                }} 
            />

            {/* Eje Y: Columna de Horas Fija */}
            <div className="w-10 md:w-12 shrink-0 bg-dash-panel border-r border-dash-border sticky left-0 z-30">
                <div className="h-10 border-b border-dash-border sticky top-0 bg-dash-panel z-40" />
                {timeSlots.map((time, idx) => (
                    <div key={idx} className="relative border-b border-dash-border/30 bg-dash-panel" style={{ height: ROW_HEIGHT }}>
                        {time.getMinutes() === 0 && (
                            <span className="absolute -top-2 right-1.5 text-[8px] md:text-[9px] font-mono text-dash-text-muted">
                                {format(time, 'HH:mm')}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Eje X: Columnas de Días */}
            <div className="flex flex-1 min-w-max">
                {daysOfWeek.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    // Filtrar SOLO citas de este barbero específico para este día
                    const dayAppts = appointments.filter(a => 
                        isSameDay(new Date(a.start_time), day) && a.barber_id === activeBarberId
                    );

                    return (
                        <div key={i} className={`flex-1 min-w-[120px] md:min-w-[150px] border-r border-dash-border/30 relative shrink-0 ${isToday ? 'bg-white/[0.02]' : ''}`}>
                            {/* Cabecera del Día */}
                            <div className="h-10 border-b border-dash-border sticky top-0 bg-dash-panel/90 backdrop-blur z-20 flex flex-col items-center justify-center">
                                <span className={`text-[9px] uppercase font-bold tracking-widest ${isToday ? 'text-green-500' : 'text-dash-text-muted'}`}>
                                    {format(day, 'EEE', { locale: es })}
                                </span>
                                <span className={`text-sm md:text-base font-oswald ${isToday ? 'text-dash-text font-bold' : 'text-dash-text-soft'}`}>
                                    {format(day, 'd MMM', { locale: es })}
                                </span>
                            </div>

                            {/* Fondo clickeable para huecos */}
                            <div className="absolute inset-0 top-10 flex flex-col z-0">
                                {timeSlots.map((time, idx) => (
                                    <div 
                                        key={`slot-${idx}`} 
                                        className="border-b border-dash-border/10 hover:bg-white/5 cursor-pointer active:bg-white/10"
                                        style={{ height: ROW_HEIGHT / 2 }} // Slots de 30 mins
                                        onClick={() => onSlotTap(activeBarberId, time)}
                                    />
                                ))}
                            </div>

                            {/* Tarjetas de citas (Ocupan el 90% del ancho) */}
                            {dayAppts.map(appt => {
                                const isCompleted = appt.status === 'completed';
                                const duration = appt.services?.duration_minutes || 30;
                                
                                const top = calculateTopMins(appt.start_time);
                                const height = duration * PIXELS_PER_MINUTE;

                                return (
                                    <div
                                        key={appt.id}
                                        onClick={() => onAppointmentTap(appt)}
                                        className={`absolute w-[90%] left-[5%] rounded-sm cursor-pointer border-l-[3px] shadow-sm flex flex-col px-1.5 py-1 overflow-hidden z-10 active:scale-95 transition-all
                                            ${bgTranslucentClass} ${borderColorClass}
                                            ${isCompleted ? 'opacity-40 grayscale-[0.5]' : 'opacity-100 hover:brightness-110'}
                                        `}
                                        style={{
                                            top: `${top}px`,
                                            height: `${height}px`,
                                        }}
                                    >
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <span className={`text-[9px] font-mono leading-none ${isCompleted ? 'text-white/50' : textColorClass}`}>
                                                {format(new Date(appt.start_time), 'HH:mm')}
                                            </span>
                                            {isCompleted && <span className="text-green-500 text-[8px] leading-none">✓</span>}
                                        </div>
                                        {height >= 30 && (
                                            <span className={`text-[10px] md:text-[11px] font-medium leading-tight truncate capitalize ${isCompleted ? 'text-white/60' : 'text-white/95'}`}>
                                                {appt.customer_name.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

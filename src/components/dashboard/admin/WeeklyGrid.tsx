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
    // Usamos una altura más compacta que en la vista diaria (48px por hora en lugar de 60px)
    const ROW_HEIGHT = 48; 
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

    return (
        <div className="flex-1 overflow-auto flex bg-dash-bg relative">
            {/* Eje Y: Columna de Horas Fija (Más compacta) */}
            <div className="w-10 md:w-12 shrink-0 bg-dash-panel border-r border-dash-border sticky left-0 z-30">
                <div className="h-10 border-b border-dash-border sticky top-0 bg-dash-panel z-40" />
                {timeSlots.map((time, idx) => (
                    <div key={idx} className="relative border-b border-dash-border/30" style={{ height: ROW_HEIGHT }}>
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
                    const dayAppts = appointments.filter(a => isSameDay(new Date(a.start_time), day));

                    return (
                        <div key={i} className={`flex-1 min-w-[70px] md:min-w-[100px] border-r border-dash-border/30 relative shrink-0 ${isToday ? 'bg-white/[0.02]' : ''}`}>
                            {/* Cabecera del Día */}
                            <div className="h-10 border-b border-dash-border sticky top-0 bg-dash-panel/90 backdrop-blur z-20 flex flex-col items-center justify-center">
                                <span className={`text-[8px] uppercase font-bold tracking-widest ${isToday ? 'text-green-500' : 'text-dash-text-muted'}`}>
                                    {format(day, 'EEE', { locale: es })}
                                </span>
                                <span className={`text-xs md:text-sm font-oswald ${isToday ? 'text-dash-text font-bold' : 'text-dash-text-soft'}`}>
                                    {format(day, 'd MMM', { locale: es })}
                                </span>
                            </div>

                            {/* Celdas interactivas invisibles para crear citas */}
                            <div className="absolute inset-0 top-10 flex flex-col z-0">
                                {timeSlots.map((time, idx) => (
                                    <div 
                                        key={`slot-${idx}`} 
                                        className="border-b border-dash-border/10 hover:bg-white/5 cursor-pointer active:bg-white/10"
                                        style={{ height: ROW_HEIGHT / 2 }} // Slots de 30 mins
                                        onClick={() => onSlotTap('general', time)}
                                    />
                                ))}
                            </div>

                            {/* Código de barras de citas (Sin texto, solo colores) */}
                            {dayAppts.map(appt => {
                                const barberIdx = selectedBarbers.indexOf(appt.barber_id);
                                if (barberIdx === -1) return null; // Por seguridad

                                const barber = allBarbers.find(b => b.id === appt.barber_id);
                                const isCompleted = appt.status === 'completed';
                                const duration = appt.services?.duration_minutes || 30;
                                
                                const top = calculateTopMins(appt.start_time);
                                const height = duration * PIXELS_PER_MINUTE;
                                
                                // Algoritmo visual de escáner: Dividimos el ancho del día por la cantidad de barberos
                                // Esto evita solapamientos y muestra claramente quién está ocupado y quién libre.
                                const widthPct = 100 / selectedBarbers.length;
                                const leftPct = widthPct * barberIdx;

                                return (
                                    <div
                                        key={appt.id}
                                        onClick={() => onAppointmentTap(appt)}
                                        className={`absolute rounded-sm cursor-pointer border-[0.5px] border-black/50 transition-all z-10 active:scale-95
                                            ${barber?.color || 'bg-dash-text'}
                                            ${isCompleted ? 'opacity-30 grayscale-[0.8]' : 'opacity-90 shadow-[0_0_8px_rgba(0,0,0,0.5)] hover:brightness-125'}
                                        `}
                                        style={{
                                            top: `${top}px`,
                                            height: `${height}px`,
                                            left: `${leftPct}%`,
                                            width: `${widthPct}%`,
                                            minWidth: '6px' // Para asegurar que en móviles siempre se vea la línea
                                        }}
                                        title={`${format(new Date(appt.start_time), 'HH:mm')} - ${barber?.name.split(' ')[0]}`}
                                    />
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

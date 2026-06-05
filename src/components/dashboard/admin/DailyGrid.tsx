"use client"

import { format } from "date-fns"
import { CheckCircle2 } from "lucide-react"

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

type BarberColumn = {
    barberId: string;
    barberName: string;
    appointments: AppointmentWithService[];
}

type Barber = {
    id: string;
    name: string;
    color: string;
}

export const DailyGrid = ({ 
    timeSlots, 
    barberColumns, 
    allBarbers, 
    onSlotTap, 
    onAppointmentTap,
    startHour 
}: {
    timeSlots: Date[];
    barberColumns: BarberColumn[];
    allBarbers: Barber[];
    onSlotTap: (barberId: string, time: Date) => void;
    onAppointmentTap: (appt: AppointmentWithService) => void;
    startHour: number;
}) => {
    const ROW_HEIGHT = 60; // 1 hora = 60px
    const PIXELS_PER_MINUTE = 1;

    const calculateTopMins = (startTimeStr: string) => {
        const d = new Date(startTimeStr);
        const minutesFromStart = (d.getHours() - startHour) * 60 + d.getMinutes();
        return minutesFromStart * PIXELS_PER_MINUTE;
    };

    return (
        <div className="flex-1 overflow-auto flex bg-dash-bg relative">
            {/* Fondo de cuadrícula global (Líneas claras continuas) */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.20) 1px, transparent 1px)', 
                    backgroundSize: `100% ${ROW_HEIGHT / 2}px`,
                    marginTop: '40px' // Offset para evadir el header sticky
                }} 
            />

            {/* Eje Y: Columna de Horas Fija a la izquierda */}
            <div className="w-12 md:w-14 shrink-0 bg-dash-panel border-r border-dash-border sticky left-0 z-30">
                {/* Cabecera vacía esquina superior izquierda */}
                <div className="h-10 border-b border-dash-border sticky top-0 bg-dash-panel z-40" /> 
                {timeSlots.map((time, idx) => (
                    <div key={idx} className="h-[60px] relative border-b border-dash-border/30 bg-dash-panel">
                        {time.getMinutes() === 0 && (
                            <span className="absolute -top-2.5 right-2 text-[9px] md:text-[10px] font-mono text-dash-text-muted">
                                {format(time, 'h:mm a')}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Eje X: Columnas de Barberos (Scroll horizontal) */}
            <div className="flex flex-1 min-w-max">
                {barberColumns.map(col => {
                    const barber = allBarbers.find(b => b.id === col.barberId);
                    // Color translúcido basado en el color del barbero (ej. bg-blue-500/20)
                    const colorClass = barber?.color || 'bg-dash-text';
                    const bgTranslucentClass = colorClass.replace('bg-', 'bg-').concat('/10');
                    const borderSolidClass = colorClass.replace('bg-', 'border-');

                    return (
                        <div key={col.barberId} className="w-[180px] md:w-[240px] border-r border-dash-border/30 relative shrink-0">
                            {/* Cabecera del Barbero Sticky */}
                            <div className="h-10 border-b border-dash-border sticky top-0 bg-dash-panel/90 backdrop-blur z-20 flex items-center justify-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                                <span className="text-xs font-bold text-dash-text tracking-wider truncate px-1">{col.barberName.split(' ')[0]}</span>
                            </div>

                            {/* Celdas interactivas para Crear Nueva Cita */}
                            <div className="absolute inset-0 top-10 flex flex-col z-0">
                                {timeSlots.map((time, idx) => (
                                    <div 
                                        key={`slot-${idx}`} 
                                        className="h-[30px] border-b border-dash-border/10 hover:bg-white/5 cursor-pointer"
                                        onClick={() => onSlotTap(col.barberId, time)}
                                    />
                                ))}
                            </div>

                            {/* Bloques de Citas */}
                            {col.appointments.map(appt => {
                                const isCompleted = appt.status === 'completed';
                                const duration = appt.services?.duration_minutes || 30;
                                const height = duration * PIXELS_PER_MINUTE; 
                                const top = calculateTopMins(appt.start_time);

                                return (
                                    <div 
                                        key={appt.id}
                                        onClick={() => onAppointmentTap(appt)}
                                        className={`absolute left-1 right-1 p-2 rounded-sm cursor-pointer border-l-[3px] overflow-hidden z-10 transition-all active:scale-95
                                            ${bgTranslucentClass} ${borderSolidClass}
                                            ${isCompleted ? 'opacity-40 grayscale-[0.5]' : 'opacity-100 shadow-md hover:brightness-110'}
                                        `}
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-xs font-medium capitalize leading-tight truncate ${isCompleted ? 'text-white/60' : 'text-white/90'}`}>
                                                {appt.customer_name.toLowerCase()}
                                            </h4>
                                            {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 ml-1" />}
                                        </div>
                                        {height >= 45 && (
                                            <p className={`text-[10px] truncate mt-0.5 capitalize ${isCompleted ? 'text-white/40' : 'text-white/60'}`}>
                                                {appt.services?.name?.toLowerCase() || 'Servicio'}
                                            </p>
                                        )}
                                        <span className={`text-[9px] font-mono absolute bottom-1 right-1 ${isCompleted ? 'text-white/30' : 'text-white/40'}`}>
                                            {format(new Date(appt.start_time), 'h:mm a')}
                                        </span>
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

"use client"

import { format, differenceInMinutes } from "date-fns"
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
        return (minutesFromStart * PIXELS_PER_MINUTE) + 40; // +40px para compensar la cabecera (h-10)
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
                {timeSlots.map((time, idx) => {
                    const isHour = time.getMinutes() === 0;
                    return (
                        <div key={idx} className={`h-[30px] relative border-b bg-dash-panel ${isHour ? 'border-dash-border/40 border-solid' : 'border-dash-border/10 border-dashed'}`}>
                            {isHour && (
                                <span className="absolute -top-2.5 right-2 text-[9px] md:text-[10px] font-mono text-dash-text-muted">
                                    {format(time, 'h:mm a')}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Eje X: Columnas de Barberos (Scroll horizontal) */}
            <div className="flex flex-1 min-w-max">
                {barberColumns.map(col => {
                    const barber = allBarbers.find(b => b.id === col.barberId);
                    // Color sólido basado en el color del barbero (ej. bg-blue-500)
                    const colorClass = barber?.color || 'bg-dash-text';
                    const bgSolidClass = colorClass;
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
                                {timeSlots.map((time, idx) => {
                                    const isHour = time.getMinutes() === 0;
                                    return (
                                        <div 
                                            key={`slot-${idx}`} 
                                            className={`h-[30px] border-b hover:bg-white/5 cursor-pointer ${isHour ? 'border-dash-border/40 border-solid' : 'border-dash-border/10 border-dashed'}`}
                                            onClick={() => onSlotTap(col.barberId, time)}
                                        />
                                    );
                                })}
                            </div>

                            {/* Bloques de Citas con manejo de solapamientos visuales */}
                            {(() => {
                                const sortedAppts = [...col.appointments].sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                                
                                const withVisuals = sortedAppts.map(appt => {
                                    const actualDuration = differenceInMinutes(new Date(appt.end_time), new Date(appt.start_time));
                                    const visualDuration = Math.max(actualDuration, 25); // Mínimo 25 mins visuales para evitar que se tapen
                                    const vStart = new Date(appt.start_time).getTime();
                                    const vEnd = vStart + (visualDuration * 60000);
                                    return { appt, vStart, vEnd, actualDuration, visualDuration };
                                });

                                const overlappingInfo = withVisuals.map(item => {
                                    const overlapping = withVisuals.filter(other => {
                                        return (item.vStart < other.vEnd && item.vEnd > other.vStart);
                                    });
                                    return {
                                        ...item,
                                        count: overlapping.length,
                                        index: overlapping.findIndex(o => o.appt.id === item.appt.id)
                                    };
                                });

                                return overlappingInfo.map(info => {
                                    const { appt, visualDuration } = info;
                                    const isCompleted = appt.status === 'completed';
                                    const height = visualDuration * PIXELS_PER_MINUTE; 
                                    const top = calculateTopMins(appt.start_time);
                                    
                                    const widthPct = 96 / info.count;
                                    const leftPct = 2 + (info.index * widthPct);

                                    let statusClasses = `${bgSolidClass} ${borderSolidClass} opacity-100 shadow-md hover:brightness-110 hover:z-50`;
                                    if (isCompleted) {
                                        statusClasses = 'bg-neutral-900 border-neutral-700 opacity-80 border-dashed shadow-none hover:bg-neutral-800 hover:z-50';
                                    }

                                    return (
                                        <div 
                                            key={appt.id}
                                            onClick={() => onAppointmentTap(appt)}
                                            className={`absolute p-2 rounded-sm cursor-pointer border-l-[3px] overflow-hidden z-10 transition-all active:scale-95 ${statusClasses}`}
                                            style={{ top: `${top}px`, height: `${height}px`, left: `${leftPct}%`, width: `${widthPct}%` }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-xs font-medium capitalize leading-tight truncate ${isCompleted ? 'text-neutral-500 line-through' : 'text-white'}`}>
                                                {appt.customer_name.toLowerCase()}
                                            </h4>
                                            {isCompleted && <span className="text-white font-bold text-xs shrink-0 ml-1 leading-none">✓</span>}
                                        </div>
                                        {height >= 45 && (
                                            <p className={`text-[10px] truncate mt-0.5 capitalize ${isCompleted ? 'text-neutral-600' : 'text-white/90'}`}>
                                                {appt.services?.name?.toLowerCase() || 'Servicio'}
                                            </p>
                                        )}
                                        <span className={`text-[9px] font-mono absolute bottom-1 left-2 right-2 truncate text-right ${isCompleted ? 'text-neutral-600' : 'text-white/70 font-bold'}`}>
                                            {format(new Date(appt.start_time), 'h:mm a')} - {format(new Date(appt.end_time), 'h:mm a')}
                                        </span>
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

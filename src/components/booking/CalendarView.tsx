"use client"
import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { format, isAfter, isBefore, addMinutes, startOfDay, endOfDay, isSameDay, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { motion } from "framer-motion"
import { ChevronRight, CalendarX2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseTimeSetting } from "@/lib/availability"
import { getBarberAvailabilityData } from "@/app/actions/appointments"

interface TimeSlot {
    time: string;
    available: boolean;
}

interface ScheduleSettings {
    startHour?: string | number;
    endHour?: string | number;
    lunchStart?: string | number;
    lunchEnd?: string | number;
    workDays: number[];
    disabledSlots?: Record<number, string[]> | string[];
}

interface CalendarViewProps {
    barberId: string;
    date: Date | null;
    durationMinutes: number;
    onSelect: (time: string, date: Date) => void;
    allowPastTimes?: boolean; // Prop opcional para que los admins agenden en el pasado
}

export function CalendarView({ barberId, date: initialDate, durationMinutes, onSelect, allowPastTimes = false }: CalendarViewProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date())
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Preloaded Data State
    const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null)
    const [allAppointments, setAllAppointments] = useState<any[]>([])
    const [allBlocks, setAllBlocks] = useState<any[]>([])

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
        }
    }

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
        }
    }

    // Fechas siguientes (45 días = mes y medio)
    const days = useMemo(() => {
        const daysArr = []
        for (let i = 0; i < 45; i++) {
            daysArr.push(addDays(new Date(), i))
        }
        return daysArr
    }, [])

    // 1. PRE-CARGAR TODOS LOS DATOS (Solo se ejecuta 1 vez cuando el componente monta o cambia el barbero)
    useEffect(() => {
        if (!barberId) return;

        async function preloadData() {
            setLoading(true);
            setError(null);
            
            // Calculamos el rango desde hoy hasta 45 días adelante
            const startRangeStr = startOfDay(new Date()).toISOString();
            const endRangeStr = endOfDay(addDays(new Date(), 45)).toISOString();

            try {
                const response = await getBarberAvailabilityData(barberId, startRangeStr, endRangeStr);
                
                if (!response.success) throw new Error(response.error || "Error al cargar la disponibilidad");

                // Fallback de seguridad extrema si el barbero aún no tiene configurado un horario
                const defaultFallbackSettings: ScheduleSettings = { startHour: "09:00", endHour: "19:00", lunchStart: "13:00", lunchEnd: "14:00", workDays: [1, 2, 3, 4, 5, 6] };
                const settings = response.schedule_settings || defaultFallbackSettings;
                
                setScheduleSettings(settings as ScheduleSettings);
                setAllAppointments((response.appointments || []).filter((a: any) => a.status !== 'cancelled'));
                setAllBlocks(response.blocks || []);
            }  
    catch (err: unknown) {
                console.error("Error preloading data:", err);
                setError(err instanceof Error ? err.message : "Hubo un error al cargar las horas disponibles.");
            } finally {
                setLoading(false);
            }
        }

        preloadData();
    }, [barberId, retryCount]);

    // 2. CALCULAR SLOTS (Síncrono e instantáneo cuando cambia la fecha)
    const calculateSlots = useCallback(() => {
        if (!scheduleSettings || !selectedDate) return;

        // Filtrar datos pre-cargados solo para el día seleccionado
        const dayAppointments = allAppointments.filter(a => isSameDay(new Date(a.start_time), selectedDate));
        const dayBlocks = allBlocks.filter(b => isSameDay(new Date(b.start_time), selectedDate));

        const isColliding = (slotStart: Date, slotEnd: Date) => {
            // Check manual disabled slots
            let disabledForDay: string[] = [];
            if (scheduleSettings.disabledSlots) {
                if (Array.isArray(scheduleSettings.disabledSlots)) {
                    disabledForDay = scheduleSettings.disabledSlots;
                } else {
                    disabledForDay = scheduleSettings.disabledSlots[selectedDate.getDay()] || [];
                }
            }

            if (disabledForDay.length > 0) {
                let checkTime = new Date(slotStart);
                while (isBefore(checkTime, slotEnd)) {
                    const timeString = `${checkTime.getHours().toString().padStart(2, '0')}:${checkTime.getMinutes().toString().padStart(2, '0')}`;
                    if (disabledForDay.includes(timeString)) {
                        return true;
                    }
                    checkTime = addMinutes(checkTime, 5);
                }
            }

            // Check lunch
            if (scheduleSettings.lunchStart && scheduleSettings.lunchEnd) {
                const ls = parseTimeSetting(scheduleSettings.lunchStart);
                const le = parseTimeSetting(scheduleSettings.lunchEnd);
                const lunchStart = new Date(selectedDate);
                lunchStart.setHours(ls.hours, ls.minutes, 0, 0);
                const lunchEnd = new Date(selectedDate);
                lunchEnd.setHours(le.hours, le.minutes, 0, 0);

                if (isBefore(slotStart, lunchEnd) && isAfter(slotEnd, lunchStart)) return true;
            }

            // Check appointments
            for (const appt of dayAppointments) {
                const apptStart = new Date(appt.start_time);
                const apptEnd = new Date(appt.end_time);
                if (isBefore(slotStart, apptEnd) && isAfter(slotEnd, apptStart)) return true;
            }

            // Check blocks
            for (const block of dayBlocks) {
                const blkStart = new Date(block.start_time);
                const blkEnd = new Date(block.end_time);
                if (isBefore(slotStart, blkEnd) && isAfter(slotEnd, blkStart)) return true;
            }

            // Check if in past (if today) unless explicitly allowed
            if (!allowPastTimes) {
                // Timezone fix para Bogotá al evaluar el momento "actual"
                const now = new Date();
                const bogotaFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/Bogota',
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: 'numeric', minute: 'numeric', second: 'numeric',
                    hour12: false
                });
                const parts = bogotaFormatter.formatToParts(now);
                const b: any = {};
                parts.forEach(p => b[p.type] = p.value);
                const localNow = new Date(b.year, b.month - 1, b.day, b.hour, b.minute, b.second);

                const localSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                const isTodayLocal = localSelectedDate.getTime() === new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()).getTime();

                if (isTodayLocal && isBefore(slotStart, localNow)) {
                    return true;
                }
            }

            return false;
        }

        let current = new Date(selectedDate);
        const sh = scheduleSettings.startHour !== undefined ? parseTimeSetting(scheduleSettings.startHour) : { hours: 0, minutes: 0 };
        const eh = scheduleSettings.endHour !== undefined ? parseTimeSetting(scheduleSettings.endHour) : { hours: 23, minutes: 59 };
        
        current.setHours(sh.hours, sh.minutes, 0, 0);
        const endTime = new Date(selectedDate);
        endTime.setHours(eh.hours, eh.minutes, 59, 999);

        const dayOfWeek = selectedDate.getDay();
        if (!scheduleSettings.workDays.includes(dayOfWeek)) {
            setSlots([]);
            return;
        }

        const generatedSlots: TimeSlot[] = [];
        while (isBefore(current, endTime) || current.getTime() === endTime.getTime()) {
            const slotStart = new Date(current);
            const slotEnd = addMinutes(current, durationMinutes);

            if (isAfter(slotEnd, endTime)) {
                break;
            }

            const timeStr = format(slotStart, 'h:mm a');
            const available = !isColliding(slotStart, slotEnd);
            
            // Mostrar todos los slots en la lista visual, para que el cliente vea cuáles están inhabilitados
            generatedSlots.push({
                time: timeStr,
                available: available
            });

            current = addMinutes(current, 5);
        }

        setSlots(generatedSlots)
    }, [selectedDate, durationMinutes, scheduleSettings, allAppointments, allBlocks]);

    useEffect(() => {
        if (!loading && scheduleSettings) {
            // We use setTimeout to defer state update to next tick to avoid cascading renders warning
            setTimeout(() => calculateSlots(), 0);
        }
    }, [selectedDate, loading, calculateSlots, scheduleSettings]);

    if (loading) {
        return <div className="text-white/50 text-sm animate-pulse p-4 text-center">Calculando disponibilidad...</div>
    }

    if (error) {
        return (
            <div className="text-red-400 text-sm p-4 text-center border border-red-500/20 bg-red-500/10 rounded-2xl">
                {error}
                <br/>
                <button 
                    onClick={() => setRetryCount(c => c + 1)} 
                    className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                    Reintentar
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Selector de Fecha */}
            <div className="pt-2 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Fechas Disponibles</h4>
                <div className="relative group/scroll">
                    {/* Botón Izquierdo */}
                    <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#111111] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:block" />
                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-10 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full text-white hover:text-primary transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex shadow-xl shadow-black/50"
                    >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>

                    <div
                        ref={scrollContainerRef}
                        className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide py-1 scroll-smooth"
                    >
                        {days.map((d) => {
                            const isSelected = isSameDay(d, selectedDate)
                            const isWorkingDay = scheduleSettings ? scheduleSettings.workDays.includes(d.getDay()) : true;
                            
                            return (
                                <button
                                    key={d.toISOString()}
                                    onClick={() => {
                                        if(isWorkingDay) setSelectedDate(d)
                                    }}
                                    disabled={!isWorkingDay}
                                    className={cn(
                                        "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl border transition-all relative shrink-0 overflow-hidden",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"
                                            : !isWorkingDay
                                                ? "bg-black/20 border-transparent text-white/20 cursor-not-allowed grayscale"
                                                : "bg-black/40 backdrop-blur-sm border-white/10 hover:bg-black/60 hover:border-primary/50 text-white/90"
                                    )}
                                >
                                    {!isSelected && isWorkingDay && <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />}
                                    
                                    {!isWorkingDay && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-full h-px bg-white/10 rotate-[-35deg]" />
                                        </div>
                                    )}

                                    <span className="text-xs font-medium uppercase z-10 opacity-80">
                                        {format(d, 'EEE', { locale: es })}
                                    </span>
                                    <span className="text-xl font-black z-10">
                                        {format(d, 'd')}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Botón Derecho */}
                    <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#111111] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:block" />
                    <button
                        onClick={scrollRight}
                        className="absolute right-0 top-10 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full text-white hover:text-primary transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex shadow-xl shadow-black/50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Selector de Horas */}
            <div className="pt-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Horas Disponibles</h4>
                {slots.length === 0 ? (
                    <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5 backdrop-blur-md text-white/50 space-y-2 min-h-[44px] flex flex-col justify-center items-center">
                        <CalendarX2 className="w-8 h-8 opacity-50 mb-2" />
                        <p>No hay disponibilidad para el <strong>{format(selectedDate, 'EEEE d', { locale: es })}</strong></p>
                        <p className="text-xs">Por favor, selecciona otro día en el calendario.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {slots.map(slot => (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={slot.time}
                                disabled={!slot.available}
                                onClick={() => onSelect(slot.time, selectedDate)}
                                className={cn(
                                    "py-3 rounded-lg font-bold text-sm min-h-[44px] transition-all",
                                    slot.available
                                        ? "bg-white/5 hover:bg-primary/20 text-white hover:text-primary hover:border-primary/50 border border-white/10 active:scale-95"
                                        : "bg-white/5 text-white/20 border border-transparent opacity-50 cursor-not-allowed"
                                )}
                            >
                                {slot.time}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}


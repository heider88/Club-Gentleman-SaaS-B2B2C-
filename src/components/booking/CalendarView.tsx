"use client"
import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { format, isAfter, isBefore, addMinutes, startOfDay, endOfDay, isSameDay, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { motion } from "framer-motion"
import { ChevronRight, CalendarX2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseTimeSetting } from "@/lib/availability"

interface TimeSlot {
    time: string;
    available: boolean;
}

interface ScheduleSettings {
    startHour: string | number;
    endHour: string | number;
    lunchStart: string | number;
    lunchEnd: string | number;
    workDays: number[];
}

interface CalendarViewProps {
    barberId: string;
    date: Date | null;
    durationMinutes: number;
    onSelect: (time: string, date: Date) => void;
}

export function CalendarView({ barberId, date: initialDate, durationMinutes, onSelect }: CalendarViewProps) {
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

    // Fechas siguientes (14 días)
    const days = useMemo(() => {
        const daysArr = []
        for (let i = 0; i < 14; i++) {
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
            const supabase = createClient();
            
            // Calculamos el rango desde hoy hasta 14 días adelante
            const startRangeStr = startOfDay(new Date()).toISOString();
            const endRangeStr = endOfDay(addDays(new Date(), 14)).toISOString();

            try {
                // Promise.all para ejecutar consultas concurrentes
                // 1. Obtener horario ESPECÍFICO del Barbero seleccionado
                const [barberProfileRes, appointmentsRes, blocksRes] = await Promise.all([
                    supabase.from('profiles').select('schedule_settings').eq('id', barberId).single(),
                    supabase.from('appointments').select('start_time, end_time, status').eq('barber_id', barberId).gte('start_time', startRangeStr).lte('start_time', endRangeStr),
                    supabase.from('availability_blocks').select('start_time, end_time').eq('barber_id', barberId).gte('start_time', startRangeStr).lte('start_time', endRangeStr)
                ]);

                // Fallback de seguridad extrema si el barbero aún no tiene configurado un horario
                const defaultFallbackSettings: ScheduleSettings = { startHour: "09:00", endHour: "19:00", lunchStart: "13:00", lunchEnd: "14:00", workDays: [1, 2, 3, 4, 5, 6] };
                const settings = barberProfileRes.data?.schedule_settings || defaultFallbackSettings;

                if (appointmentsRes.error) throw appointmentsRes.error;
                if (blocksRes.error) throw blocksRes.error;
                
                setScheduleSettings(settings as ScheduleSettings);
                setAllAppointments((appointmentsRes.data || []).filter(a => a.status !== 'cancelled'));
                setAllBlocks(blocksRes.data || []);
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
            // Check lunch
            const ls = parseTimeSetting(scheduleSettings.lunchStart);
            const le = parseTimeSetting(scheduleSettings.lunchEnd);
            const lunchStart = new Date(selectedDate);
            lunchStart.setHours(ls.hours, ls.minutes, 0, 0);
            const lunchEnd = new Date(selectedDate);
            lunchEnd.setHours(le.hours, le.minutes, 0, 0);

            if (isBefore(slotStart, lunchEnd) && isAfter(slotEnd, lunchStart)) return true;

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

            // Check if in past (if today)
            if (isSameDay(selectedDate, new Date()) && isBefore(slotStart, new Date())) return true;

            return false;
        }

        let current = new Date(selectedDate);
        const sh = parseTimeSetting(scheduleSettings.startHour);
        const eh = parseTimeSetting(scheduleSettings.endHour);
        
        current.setHours(sh.hours, sh.minutes, 0, 0);
        const endTime = new Date(selectedDate);
        endTime.setHours(eh.hours, eh.minutes, 0, 0);

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
            
            // Solo añadir a la lista visual los slots que realmente están disponibles
            if (available) {
                generatedSlots.push({
                    time: timeStr,
                    available: true
                });
            }

            current = addMinutes(current, 15);
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


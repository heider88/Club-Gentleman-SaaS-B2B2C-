"use client"
import { useEffect, useState, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { format, isAfter, isBefore, addMinutes, startOfDay, endOfDay, isSameDay, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeSlot {
    time: string;
    available: boolean;
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
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date())
    const scrollContainerRef = useRef<HTMLDivElement>(null)

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

    // Fechas siguientes
    const days = useMemo(() => {
        const daysArr = []
        for (let i = 0; i < 14; i++) {
            daysArr.push(addDays(new Date(), i))
        }
        return daysArr
    }, [])

    useEffect(() => {
        if (!barberId || !selectedDate) return;

        async function fetchAvailability() {
            setLoading(true);
            const supabase = createClient();

            // 1. Fetch barber profile for schedule settings
            const { data: profile } = await supabase.from('profiles').select('schedule_settings').eq('id', barberId).single();
            const settings = profile?.schedule_settings || { startHour: 9, endHour: 19, lunchStart: 13, lunchEnd: 14, workDays: [1, 2, 3, 4, 5, 6] };

            // 2. Fetch existing appointments
            const startStr = startOfDay(selectedDate).toISOString();
            const endStr = endOfDay(selectedDate).toISOString();

            const { data: appointmentsRes } = await supabase.from('appointments')
                .select('start_time, end_time, status')
                .eq('barber_id', barberId)
                .gte('start_time', startStr)
                .lte('start_time', endStr);

            // 3. Fetch availability blocks
            const { data: blocksRes } = await supabase.from('availability_blocks')
                .select('start_time, end_time')
                .eq('barber_id', barberId)
                .gte('start_time', startStr)
                .lte('start_time', endStr);

            const activeAppointments = (appointmentsRes || []).filter(a => a.status !== 'cancelled')
            const blocks = blocksRes || [];

            // Helper to check collision
            const isColliding = (slotStart: Date, slotEnd: Date) => {
                // Check lunch
                const lunchStart = new Date(selectedDate);
                lunchStart.setHours(settings.lunchStart, 0, 0, 0);
                const lunchEnd = new Date(selectedDate);
                lunchEnd.setHours(settings.lunchEnd, 0, 0, 0);

                if (isBefore(slotStart, lunchEnd) && isAfter(slotEnd, lunchStart)) return true; // Colisiona con almuerzo

                // Check appointments
                for (const appt of activeAppointments) {
                    const apptStart = new Date(appt.start_time);
                    const apptEnd = new Date(appt.end_time);
                    if (isBefore(slotStart, apptEnd) && isAfter(slotEnd, apptStart)) return true;
                }

                // Check blocks
                for (const block of blocks) {
                    const blkStart = new Date(block.start_time);
                    const blkEnd = new Date(block.end_time);
                    if (isBefore(slotStart, blkEnd) && isAfter(slotEnd, blkStart)) return true;
                }

                // Check if in past (if today)
                if (isSameDay(selectedDate, new Date()) && isBefore(slotStart, new Date())) return true;

                return false;
            }

            // Generate slots
            let current = new Date(selectedDate);
            current.setHours(settings.startHour, 0, 0, 0);
            const endTime = new Date(selectedDate);
            endTime.setHours(settings.endHour, 0, 0, 0);

            const dayOfWeek = selectedDate.getDay(); // 0 is Sunday
            // if day not in workdays, no slots
            if (!settings.workDays.includes(dayOfWeek)) {
                setSlots([]);
                setLoading(false);
                return;
            }

            const generatedSlots: TimeSlot[] = [];
            while (isBefore(current, endTime) || current.getTime() === endTime.getTime()) {
                const slotStart = new Date(current);
                const slotEnd = addMinutes(current, durationMinutes);

                // If adding duration passes the end of the day, mark unavailable or stop
                if (isAfter(slotEnd, endTime)) {
                    break;
                }

                // format time e.g., '09:00 AM'
                const timeStr = format(slotStart, 'h:mm a');

                generatedSlots.push({
                    time: timeStr,
                    available: !isColliding(slotStart, slotEnd)
                })

                // advance by 15 mins to maximize schedule packing
                current = addMinutes(current, 15);
            }

            setSlots(generatedSlots)
            setLoading(false)
        }

        fetchAvailability()
    }, [barberId, selectedDate, durationMinutes])

    if (loading) {
        return <div className="text-white/50 text-sm animate-pulse p-4 text-center">Calculando disponibilidad...</div>
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
                            return (
                                <button
                                    key={d.toISOString()}
                                    onClick={() => setSelectedDate(d)}
                                    className={cn(
                                        "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl border transition-all relative shrink-0 overflow-hidden",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"
                                            : "bg-black/40 backdrop-blur-sm border-white/10 hover:bg-black/60 hover:border-primary/50 text-white/90"
                                    )}
                                >
                                    {!isSelected && <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />}

                                    <span className="text-xs font-medium uppercase opacity-80 z-10">
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
                    <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5 backdrop-blur-md text-white/50 space-y-2 min-h-[44px]">
                        <p>El barbero no labora el <strong>{format(selectedDate, 'EEEE d', { locale: es })}</strong></p>
                        <p className="text-xs">Por favor, elige otra fecha.</p>
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


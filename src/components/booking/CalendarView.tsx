"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { format, parse, isAfter, isBefore, addMinutes, startOfDay, endOfDay, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TimeSlot {
    time: string;
    available: boolean;
}

interface CalendarViewProps {
    barberId: string;
    date: Date;
    durationMinutes: number;
    onSelect: (time: string) => void;
}

export function CalendarView({ barberId, date, durationMinutes, onSelect }: CalendarViewProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!barberId || !date) return;

        async function fetchAvailability() {
            setLoading(true);
            const supabase = createClient();

            // 1. Fetch barber profile for schedule settings
            const { data: profile } = await supabase.from('profiles').select('schedule_settings').eq('id', barberId).single();
            const settings = profile?.schedule_settings || { startHour: 9, endHour: 19, lunchStart: 13, lunchEnd: 14, workDays: [1, 2, 3, 4, 5, 6] };

            // 2. Fetch existing appointments
            const startStr = startOfDay(date).toISOString();
            const endStr = endOfDay(date).toISOString();

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
                const lunchStart = new Date(date);
                lunchStart.setHours(settings.lunchStart, 0, 0, 0);
                const lunchEnd = new Date(date);
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
                if (isSameDay(date, new Date()) && isBefore(slotStart, new Date())) return true;

                return false;
            }

            // Generate slots
            let current = new Date(date);
            current.setHours(settings.startHour, 0, 0, 0);
            const endTime = new Date(date);
            endTime.setHours(settings.endHour, 0, 0, 0);

            const dayOfWeek = date.getDay(); // 0 is Sunday
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

                // format time e.g., '09:00'
                const timeStr = format(slotStart, 'HH:mm');

                generatedSlots.push({
                    time: timeStr,
                    available: !isColliding(slotStart, slotEnd)
                })

                // advance by 30 mins
                current = addMinutes(current, 30);
            }

            setSlots(generatedSlots)
            setLoading(false)
        }

        fetchAvailability()
    }, [barberId, date, durationMinutes])

    if (loading) {
        return <div className="text-white/50 text-sm animate-pulse p-4 text-center">Calculando disponibilidad...</div>
    }

    if (slots.length === 0) {
        return (
            <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5 backdrop-blur-md text-white/50 space-y-2 min-h-[44px]">
                <p>El barbero no labora el <strong>{format(date, 'EEEE d', { locale: es })}</strong></p>
                <p className="text-xs">Por favor retrocede e intenta con otra fecha.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-center border-b border-white/10 pb-2">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-2">
                {slots.map((slot, i) => (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => slot.available && onSelect(slot.time)}
                        className={cn(
                            "py-3 rounded-xl border text-sm font-medium transition-all duration-300 min-h-[44px]",
                            slot.available
                                ? "border-white/10 bg-white/5 backdrop-blur-md active:scale-95 hover:border-primary hover:bg-primary hover:text-primary-foreground text-white shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(var(--color-primary),0.4)]"
                                : "opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-white/50 hover:bg-black/20"
                        )}
                    >
                        {slot.time}
                    </motion.button>
                ))}
            </div>
        </div>
    )
}

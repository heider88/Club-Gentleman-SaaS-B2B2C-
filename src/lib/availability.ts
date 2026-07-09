import { addMinutes, format } from 'date-fns'

export interface TimeSlot {
    time: string
    available: boolean
}

export interface ScheduleSettings {
    startHour: string | number
    endHour: string | number
    lunchStart: string | number
    lunchEnd: string | number
    workDays: number[] // 0=Sun, 1=Mon, etc.
}

export const DEFAULT_SCHEDULE: ScheduleSettings = {
    startHour: "09:00",
    endHour: "19:00",
    lunchStart: "13:00",
    lunchEnd: "14:00",
    workDays: [1, 2, 3, 4, 5, 6] // Mon-Sat
}

// Represent an occupied block of time (either an appointment or manual block)
export interface OccupiedBlock {
    start: Date;
    end: Date;
}

export function parseTimeSetting(val: string | number): { hours: number, minutes: number } {
    if (typeof val === 'number') {
        const hours = Math.floor(val);
        const minutes = Math.round((val - hours) * 60);
        return { hours, minutes };
    }
    if (typeof val === 'string') {
        const [h, m] = val.split(':').map(Number);
        return { hours: h || 0, minutes: m || 0 };
    }
    return { hours: 0, minutes: 0 };
}

export function formatTimeInput(val: string | number): string {
    if (typeof val === 'string') return val;
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Generates available time slots for a given day.
 * 
 * @param date The selected date.
 * @param serviceDuration Duration of the service in minutes.
 * @param schedule Shop/Barber schedule settings for the day.
 * @param occupiedBlocks Array of existing appointments and blocked times.
 * @returns Array of TimeSlots indicating availability.
 */
export function generateTimeSlots(
    date: Date,
    serviceDuration: number = 30,
    schedule: ScheduleSettings = DEFAULT_SCHEDULE,
    occupiedBlocks: OccupiedBlock[] = []
): TimeSlot[] {
    const slots: TimeSlot[] = []

    // 1. Check if day is working day
    const dayOfWeek = date.getDay()
    if (!schedule.workDays.includes(dayOfWeek)) {
        return [] // Closed today
    }

    // 2. Setup start/end times for the day
    const start = parseTimeSetting(schedule.startHour)
    const end = parseTimeSetting(schedule.endHour)
    const lStart = parseTimeSetting(schedule.lunchStart)
    const lEnd = parseTimeSetting(schedule.lunchEnd)

    let currentTime = new Date(date)
    currentTime.setHours(start.hours, start.minutes, 0, 0)

    const endTime = new Date(date)
    endTime.setHours(end.hours, end.minutes, 0, 0)

    const lunchStart = new Date(date)
    lunchStart.setHours(lStart.hours, lStart.minutes, 0, 0)
    
    const lunchEnd = new Date(date)
    lunchEnd.setHours(lEnd.hours, lEnd.minutes, 0, 0)

    // Grid step in minutes. Can be adjusted to 15 or 30.
    const stepMinutes = 30

    // Helper to check if a proposed slot [start, end] overlaps with lunch or any occupied block
    const isOverlapping = (slotStart: Date, slotEnd: Date) => {
        // Overlap with lunch?
        // True if (slotStart < lunchEnd) AND (slotEnd > lunchStart)
        if (slotStart < lunchEnd && slotEnd > lunchStart) {
            return true;
        }

        // Overlap with any appointment/block?
        for (const block of occupiedBlocks) {
            // Two time ranges overlap if start1 < end2 AND end1 > start2
            if (slotStart < block.end && slotEnd > block.start) {
                return true;
            }
        }
        return false;
    }

    // 3. Loop through day and check each potential slot
    while (currentTime < endTime) {
        const slotStart = new Date(currentTime)
        const slotEnd = addMinutes(slotStart, serviceDuration)

        // Check bounds (don't allow slots that end after closing time)
        if (slotEnd > endTime) break

        const isAvailable = !isOverlapping(slotStart, slotEnd)

        slots.push({
            time: format(slotStart, 'h:mm a'),
            available: isAvailable
        })

        // Advance by our grid step
        currentTime = addMinutes(currentTime, stepMinutes)
    }

    return slots
}

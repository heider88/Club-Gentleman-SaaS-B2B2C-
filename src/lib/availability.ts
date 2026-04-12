import { addMinutes, format } from 'date-fns'

export interface TimeSlot {
    time: string
    available: boolean
}

export interface ScheduleSettings {
    startHour: number
    endHour: number
    lunchStart: number
    lunchEnd: number
    workDays: number[] // 0=Sun, 1=Mon, etc.
}

export const DEFAULT_SCHEDULE: ScheduleSettings = {
    startHour: 9,
    endHour: 19,
    lunchStart: 13,
    lunchEnd: 14,
    workDays: [1, 2, 3, 4, 5, 6] // Mon-Sat
}

// Represent an occupied block of time (either an appointment or manual block)
export interface OccupiedBlock {
    start: Date;
    end: Date;
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
    let currentTime = new Date(date)
    currentTime.setHours(schedule.startHour, 0, 0, 0)

    const endTime = new Date(date)
    endTime.setHours(schedule.endHour, 0, 0, 0)

    const lunchStart = new Date(date)
    lunchStart.setHours(schedule.lunchStart, 0, 0, 0)
    
    const lunchEnd = new Date(date)
    lunchEnd.setHours(schedule.lunchEnd, 0, 0, 0)

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
            time: format(slotStart, 'HH:mm'),
            available: isAvailable
        })

        // Advance by our grid step
        currentTime = addMinutes(currentTime, stepMinutes)
    }

    return slots
}

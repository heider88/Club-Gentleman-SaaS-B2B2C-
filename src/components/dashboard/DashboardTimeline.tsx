"use client"

import { format, differenceInMinutes } from "date-fns"
import { AppointmentRow } from "./AppointmentRow"

type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    barber_id?: string;
    profiles?: {
        full_name: string;
        avatar_url: string | null;
    } | null;
    services: {
        name: string;
        duration_minutes: number;
        price: number;
    } | null;
}

export function DashboardTimeline({ appointments, userRole }: { appointments: AppointmentWithService[], userRole: string }) {
    // Ordenar citas por start_time
    const sorted = [...appointments].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    
    const timelineItems: any[] = []

    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i]
        
        // Agregar cita actual
        timelineItems.push({ type: 'appointment', data: current })
        
        // Calcular gap con el siguiente si no es el último
        if (i < sorted.length - 1) {
            const next = sorted[i + 1]
            const endOfCurrent = new Date(current.end_time)
            const startOfNext = new Date(next.start_time)
            
            const gapMinutes = differenceInMinutes(startOfNext, endOfCurrent)
            
            // Si hay un espacio de al menos 15 minutos, insertamos un slot libre
            if (gapMinutes >= 15) {
                timelineItems.push({ 
                    type: 'free_slot', 
                    start: endOfCurrent.toISOString(),
                    end: startOfNext.toISOString(),
                    duration: gapMinutes
                })
            }
        }
    }

    return (
        <div className="space-y-2 md:space-y-3 pb-12 w-full">
            {timelineItems.map((item, idx) => {
                if (item.type === 'appointment') {
                    const appt = item.data as AppointmentWithService
                    return (
                        <AppointmentRow key={appt.id} appt={appt} userRole={userRole} />
                    )
                } else {
                    return (
                        <div key={`gap-${idx}`} className="flex items-center justify-center py-1 opacity-50">
                            <div className="h-px flex-1 border-b border-dashed border-dash-border/50"></div>
                            <span className="text-[10px] font-bold font-oswald uppercase tracking-widest text-dash-text-muted px-4">
                                {item.duration} min libre
                            </span>
                            <div className="h-px flex-1 border-b border-dashed border-dash-border/50"></div>
                        </div>
                    )
                }
            })}
        </div>
    )
}

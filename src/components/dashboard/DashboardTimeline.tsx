"use client"

import { format, differenceInMinutes } from "date-fns"
import { AppointmentCard } from "./AppointmentCard"

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
        <div className="relative border-l border-dash-border ml-16 md:ml-24 pl-6 md:pl-10 space-y-8 pb-12 before:absolute before:inset-0 before:-left-[1px] before:w-[1px] before:bg-gradient-to-b before:from-dash-border-alt before:via-dash-border before:to-transparent">
            {timelineItems.map((item, idx) => {
                if (item.type === 'appointment') {
                    const appt = item.data as AppointmentWithService
                    const isPending = appt.status === 'pending' || appt.status === 'confirmed'
                    return (
                        <div key={appt.id} className="relative group">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[30px] md:-left-[46px] top-6 w-3 h-3 rounded-none border-2 border-dash-bg z-10 ${isPending ? 'bg-dash-text shadow-xl' : 'bg-dash-border-alt'}`}></div>
                            
                            {/* Time Label for the Dot */}
                            <div className="absolute -left-[90px] md:-left-[110px] top-4 text-right w-12 md:w-16">
                                <span className="font-oswald text-sm text-dash-text-soft block leading-none">{format(new Date(appt.start_time), 'HH:mm')}</span>
                                <span className="font-oswald text-[10px] text-dash-text-muted block mt-1">{format(new Date(appt.end_time), 'HH:mm')}</span>
                            </div>

                            {/* Card */}
                            <AppointmentCard appt={appt} userRole={userRole} />
                        </div>
                    )
                } else {
                    return (
                        <div key={`gap-${idx}`} className="relative py-4 opacity-40 hover:opacity-100 transition-opacity">
                            <div className="absolute -left-[27px] md:-left-[43px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-dash-border z-10"></div>
                            <div className="flex items-center gap-4 text-dash-text-muted">
                                <div className="h-[1px] flex-1 border-dashed border-b border-dash-border"></div>
                                <span className="text-[10px] font-bold font-oswald uppercase tracking-widest text-dash-text-muted bg-dash-panel px-2 py-1 border border-dash-border">{item.duration} min libre</span>
                            </div>
                        </div>
                    )
                }
            })}
        </div>
    )
}

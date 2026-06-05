"use client"

import React, { useMemo, useState } from "react"
import { format, startOfDay, addMinutes, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { CompactHeader } from "./CompactHeader"
import { DailyGrid } from "./DailyGrid"
import { WeeklyGrid } from "./WeeklyGrid"
import { ActionBottomSheet } from "./ActionBottomSheet"
import { updateAppointmentStatus } from "@/app/actions/appointments"
import { toast } from "sonner"

type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    barber_id: string; 
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

type BarberColumn = {
    barberId: string;
    barberName: string;
    appointments: AppointmentWithService[];
}

export function AdminCalendarView({ appointments, userRole, selectedDate = new Date(), barbersList = [] }: { appointments: AppointmentWithService[], userRole: string, selectedDate?: Date, barbersList?: any[] }) {
    const [selectedAppt, setSelectedAppt] = useState<AppointmentWithService | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const view = searchParams.get('view') || 'daily'

    // Extract unique barbers for filtering
    const allBarbers = useMemo(() => {
        const map = new Map<string, { id: string, name: string, color: string }>();
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500'];
        let colorIdx = 0;
        
        barbersList.forEach(b => {
            if (!map.has(b.id)) {
                map.set(b.id, {
                    id: b.id,
                    name: b.full_name || 'Barbero',
                    color: colors[colorIdx % colors.length]
                });
                colorIdx++;
            }
        });

        appointments.forEach(appt => {
            if (!appt.barber_id || map.has(appt.barber_id)) return;
            const fallbackName = appt.profiles?.full_name || 'Barbero';
            
            if (fallbackName.toUpperCase().includes('GENTLEMAN') || fallbackName.toUpperCase() === 'ADMIN') return;

            map.set(appt.barber_id, {
                id: appt.barber_id,
                name: fallbackName,
                color: colors[colorIdx % colors.length]
            });
            colorIdx++;
        });
        return Array.from(map.values());
    }, [appointments, barbersList]);

    const [selectedBarbers, setSelectedBarbers] = useState<string[]>(allBarbers.map(b => b.id));

    React.useEffect(() => {
        const newBarbers = allBarbers.filter(b => !selectedBarbers.includes(b.id));
        if (newBarbers.length > 0 && selectedBarbers.length > 0) {
            setTimeout(() => setSelectedBarbers(prev => [...prev, ...newBarbers.map(b => b.id)]), 0);
        }
        if (selectedBarbers.length === 0 && allBarbers.length > 0) {
             setTimeout(() => setSelectedBarbers(allBarbers.map(b => b.id)), 0);
        }
    }, [allBarbers, selectedBarbers]);

    const toggleBarber = (id: string) => {
        setSelectedBarbers(prev => 
            prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
        )
    }

    const setView = (newView: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', newView)
        router.push(`${pathname}?${params.toString()}`)
    }

    // Filter appointments
    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => selectedBarbers.includes(a.barber_id) && a.status !== 'cancelled');
    }, [appointments, selectedBarbers]);

    const { startHour, endHour, barberColumns } = useMemo(() => {
        let minTime = 9 * 60 
        let maxTime = 20 * 60 
        const columnsMap = new Map<string, BarberColumn>()

        // Initialize columns for all selected barbers to ensure they show up even if empty
        selectedBarbers.forEach(barberId => {
            const barberInfo = allBarbers.find(b => b.id === barberId);
            if (barberInfo) {
                columnsMap.set(barberId, {
                    barberId: barberId,
                    barberName: barberInfo.name,
                    appointments: []
                });
            }
        });

        filteredAppointments.forEach(appt => {
            if (!appt.barber_id) return;

            const startD = new Date(appt.start_time)
            const endD = new Date(appt.end_time)
            
            const startMins = startD.getHours() * 60 + startD.getMinutes()
            const endMins = endD.getHours() * 60 + endD.getMinutes()

            if (startMins < minTime) minTime = Math.max(0, startMins - 60) 
            if (endMins > maxTime) maxTime = Math.min(24 * 60, endMins + 60) 

            if (columnsMap.has(appt.barber_id)) {
                columnsMap.get(appt.barber_id)!.appointments.push(appt)
            }
        })

        const sHour = Math.floor(minTime / 60)
        const eHour = Math.ceil(maxTime / 60)

        return {
            startHour: sHour,
            endHour: eHour,
            barberColumns: Array.from(columnsMap.values())
        }
    }, [filteredAppointments, selectedBarbers, allBarbers])

    const timeSlots: Date[] = []
    const baseDate = startOfDay(selectedDate)
    for (let h = startHour; h <= endHour; h++) {
        timeSlots.push(addMinutes(baseDate, h * 60))
        if (h < endHour) {
            timeSlots.push(addMinutes(baseDate, h * 60 + 30))
        }
    }

    const handleAction = async (action: string, id: string) => {
        if (action === 'complete') {
            await updateAppointmentStatus(id, 'completed');
            toast.success("Cita marcada como terminada");
        } else if (action === 'cancel') {
            await updateAppointmentStatus(id, 'cancelled');
            toast.success("Cita cancelada");
        }
        router.refresh();
    };

    const handleSlotTap = (barberId: string, time: Date) => {
        // En el futuro, podemos abrir un modal de creación con estos datos pre-cargados
        toast.info(`Crear cita para barbero ${barberId} a las ${format(time, 'HH:mm')}`);
    };

    return (
        <div className="flex flex-col h-[75vh] md:h-[80vh] bg-dash-panel border border-dash-border rounded-xl overflow-hidden shadow-2xl">
            <CompactHeader 
                totalAppointments={appointments.length}
                pendingCount={appointments.filter(a => a.status === 'pending').length}
                allBarbers={allBarbers}
                selectedBarbers={selectedBarbers}
                toggleBarber={toggleBarber}
                view={view}
                setView={setView}
            />

            {view === 'daily' && (
                <DailyGrid 
                    timeSlots={timeSlots}
                    barberColumns={barberColumns}
                    allBarbers={allBarbers}
                    onSlotTap={handleSlotTap}
                    onAppointmentTap={setSelectedAppt}
                    startHour={startHour}
                />
            )}
            
            {view === 'weekly' && (
                <WeeklyGrid 
                    selectedDate={selectedDate}
                    timeSlots={timeSlots}
                    appointments={filteredAppointments}
                    allBarbers={allBarbers}
                    selectedBarbers={selectedBarbers}
                    startHour={startHour}
                    onSlotTap={handleSlotTap}
                    onAppointmentTap={setSelectedAppt}
                />
            )}
            
            {view === 'monthly' && (
                <div className="flex-1 flex items-center justify-center text-dash-text-soft bg-dash-bg">
                    <p>La vista mensual requiere una cuadrícula adaptada. Cambia a &quot;Día&quot; o &quot;Semanal&quot;.</p>
                </div>
            )}

            <ActionBottomSheet 
                appt={selectedAppt}
                onClose={() => setSelectedAppt(null)}
                onAction={handleAction}
            />
        </div>
    )
}


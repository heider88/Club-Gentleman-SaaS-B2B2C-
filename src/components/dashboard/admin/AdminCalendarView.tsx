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
    service_id?: string;
    profiles?: {
        full_name: string;
        avatar_url: string | null;
    } | null;
    services: {
        id?: string;
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
        const colors = [
            'bg-blue-600',   // Azul rey
            'bg-red-600',    // Rojo fuerte
            'bg-orange-500', // Naranja brillante
            'bg-purple-600', // Morado oscuro
            'bg-teal-600',   // Verde agua
            'bg-pink-600',   // Fucsia
            'bg-yellow-600', // Mostaza
        ];
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
        // Inicialización: si no hay nadie seleccionado y ya tenemos la lista, seleccionamos por defecto.
        // En vista diaria seleccionamos a todos, en vista semanal solo al primero.
        if (selectedBarbers.length === 0 && allBarbers.length > 0) {
            if (view === 'weekly') {
                setSelectedBarbers([allBarbers[0].id]);
            } else {
                setSelectedBarbers(allBarbers.map(b => b.id));
            }
        }
    }, [allBarbers, selectedBarbers.length, view]);

    const toggleBarber = (id: string) => {
        // Actúa como un checkbox múltiple en ambas vistas
        setSelectedBarbers(prev => 
            prev.includes(id) && prev.length > 1 ? prev.filter(bId => bId !== id) : [...prev, id]
        )
    }

    React.useEffect(() => {
        // Asegurar que siempre haya alguien seleccionado al inicio
        if (allBarbers.length > 0 && selectedBarbers.length === 0) {
            setSelectedBarbers(allBarbers.map(b => b.id));
        }
    }, [allBarbers, selectedBarbers.length]);

    const setView = (newView: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', newView)
        router.push(`${pathname}?${params.toString()}`)
    }

    // Filter appointments
    const filteredAppointments = useMemo(() => {
        // Volvemos a ocultar las citas canceladas
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
        toast.info(`Crear cita para barbero ${barberId} a las ${format(time, 'h:mm a')}`);
    };

    return (
        <div className="flex flex-col h-[75vh] md:h-[80vh] bg-dash-panel border border-dash-border rounded-xl overflow-hidden shadow-2xl">
            <CompactHeader 
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
                barbers={Array.from(allBarbers.values())}
                onClose={() => setSelectedAppt(null)}
                onAction={handleAction}
                isAdmin={userRole === 'admin'}
            />
        </div>
    )
}


"use client"

import { format, differenceInMinutes, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2, UserX, Edit, X, CalendarClock, ChevronLeft } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CalendarView } from "@/components/booking/CalendarView"
import { rescheduleAppointment } from "@/app/actions/appointments"

type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    barber_id: string;
    services: {
        name: string;
        price: number;
        duration_minutes?: number;
    } | null;
}

export const ActionBottomSheet = ({ appt, onClose, onAction }: { appt: AppointmentWithService | null, onClose: () => void, onAction: (action: string, id: string) => Promise<void> }) => {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [view, setView] = useState<'menu' | 'reschedule'>('menu');

    if (!appt) return null;

    const handleAction = async (action: string) => {
        setLoadingAction(action);
        try {
            await onAction(action, appt.id);
            onClose();
        } catch (error) {
            toast.error("Error al ejecutar la acción");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleReschedule = async (timeStr: string, date: Date) => {
        setLoadingAction('reschedule');
        try {
            const duration = appt.services?.duration_minutes || differenceInMinutes(new Date(appt.end_time), new Date(appt.start_time));
            const [hours, mins] = timeStr.split(':').map(Number);
            const newStart = new Date(date);
            newStart.setHours(hours, mins, 0, 0);
            const newEnd = addMinutes(newStart, duration);

            const result = await rescheduleAppointment(appt.id, newStart.toISOString(), newEnd.toISOString());
            if (result?.success) {
                toast.success("Cita reagendada exitosamente");
                await onAction('reschedule', appt.id); // Para refrescar
                onClose();
            } else {
                toast.error(result?.error || "Error al reagendar");
            }
        } catch (error) {
            toast.error("Error inesperado al reagendar");
        } finally {
            setLoadingAction(null);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="w-full sm:max-w-sm bg-dash-panel border-t sm:border border-dash-border rounded-t-2xl sm:rounded-2xl p-5 pb-8 animate-in slide-in-from-bottom-full duration-300 relative max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Indicador de arrastre (UI móvil) */}
                <div className="w-12 h-1.5 bg-dash-border rounded-full mx-auto mb-5 sm:hidden" />

                <button onClick={onClose} className="absolute top-4 right-4 text-dash-text-soft hover:text-dash-text bg-dash-panel-alt p-1 rounded-full hidden sm:block">
                    <X className="w-5 h-5" />
                </button>

                {view === 'menu' ? (
                    <>
                        <div className="mb-6">
                            <h3 className="text-xl font-oswald text-dash-text capitalize">{appt.customer_name.toLowerCase()}</h3>
                            <p className="text-sm text-dash-text-soft capitalize">{appt.services?.name?.toLowerCase() || 'Servicio General'}</p>
                            <p className="text-xs font-mono text-dash-text-muted mt-2">
                                {format(new Date(appt.start_time), 'h:mm a')} - {format(new Date(appt.end_time), 'h:mm a')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {appt.status !== 'completed' && (
                                <button 
                                    onClick={() => handleAction('complete')} 
                                    disabled={!!loadingAction}
                                    className="w-full py-3.5 bg-green-500 text-black font-bold text-xs uppercase tracking-widest rounded-md flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                                >
                                    {loadingAction === 'complete' ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                                    Marcar como Terminada
                                </button>
                            )}
                            
                            <button 
                                onClick={() => setView('reschedule')} 
                                disabled={!!loadingAction}
                                className="w-full py-3.5 bg-blue-500/10 text-blue-400 font-bold text-xs uppercase tracking-widest rounded-md border border-blue-500/20 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <CalendarClock className="w-4 h-4" /> Reagendar Cita
                            </button>

                            <button 
                                onClick={() => {
                                    toast.info("Funcionalidad de edición próximamente");
                                    onClose();
                                }} 
                                className="w-full py-3.5 bg-white/5 text-dash-text font-bold text-xs uppercase tracking-widest rounded-md border border-dash-border active:scale-95 transition-transform flex justify-center items-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Editar Detalles
                            </button>
                            
                            <button 
                                onClick={() => handleAction('cancel')} 
                                disabled={!!loadingAction}
                                className="w-full py-3.5 bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-widest rounded-md border border-red-500/20 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {loadingAction === 'cancel' ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/> : <UserX className="w-4 h-4" />}
                                Cancelar Cita
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <button 
                                onClick={() => setView('menu')}
                                className="p-2 bg-dash-panel-alt rounded-lg hover:bg-white/10 text-dash-text transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h3 className="text-lg font-oswald text-dash-text">Reagendar Cita</h3>
                                <p className="text-xs text-dash-text-soft">Selecciona nueva fecha y hora</p>
                            </div>
                        </div>

                        <div className="-mx-5 sm:mx-0 px-5 sm:px-0">
                            {loadingAction === 'reschedule' ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                                    <p className="text-sm font-bold text-dash-text animate-pulse">Reagendando...</p>
                                </div>
                            ) : (
                                <CalendarView 
                                    barberId={appt.barber_id} 
                                    date={new Date(appt.start_time)}
                                    durationMinutes={appt.services?.duration_minutes || differenceInMinutes(new Date(appt.end_time), new Date(appt.start_time))}
                                    onSelect={handleReschedule}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

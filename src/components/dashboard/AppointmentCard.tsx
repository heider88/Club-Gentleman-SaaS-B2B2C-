"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Clock, Contact, Banknote, CheckCircle2, Ban, Phone } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cancelAppointment } from "@/app/actions/appointments"

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
    } | null;
    services: {
        name: string;
        price: number;
    } | null;
}

export function AppointmentCard({ appt, userRole }: { appt: AppointmentWithService, userRole: string }) {
    const [status, setStatus] = useState(appt.status)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const isAdmin = userRole === 'admin'

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    const updateStatus = async (newStatus: 'completed' | 'cancelled') => {
        const confirmMsg = newStatus === 'completed' 
            ? '¿Marcar esta cita como completada?' 
            : '¿Estás seguro de cancelar esta cita? Esto liberará el espacio en la agenda.'
            
        if (!window.confirm(confirmMsg)) return

        setLoading(true)
        
        try {
            if (newStatus === 'cancelled') {
                // Llama al Server Action blindado
                await cancelAppointment(appt.id);
            } else {
                // Actualiza como "completed" (permitido por RLS para el barbero o admin)
                const { error } = await supabase
                    .from('appointments')
                    .update({ status: newStatus })
                    .eq('id', appt.id)

                if (error) throw new Error(error.message);
            }

            setStatus(newStatus)
            toast.success(newStatus === 'completed' ? 'Cita completada exitosamente' : 'Cita cancelada')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || "Error al actualizar la cita")
        } finally {
            setLoading(false)
        }
    }

    const isCompleted = status === 'completed'
    const isCancelled = status === 'cancelled'
    const isPending = status === 'pending'

    if (isCancelled) return null // Opcional: no mostrar canceladas o mostrar grisáceas

    return (
        <div className={`relative rounded-2xl p-6 bg-card border hover:border-primary/40 backdrop-blur-sm bg-opacity-90 transition-all duration-300 shadow-[0_2px_15px_rgba(0,0,0,0.4)] flex flex-col h-full ${isCompleted ? 'border-primary/20 opacity-70 bg-primary/5' : 'border-white/10'}`}>
            {loading && (
                <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
                <div className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-bold text-[15px]">{format(new Date(appt.start_time), 'HH:mm')}</span>
                    <span className="text-white/30 px-1">-</span>
                    <span className="text-white/50 text-[15px]">{format(new Date(appt.end_time), 'HH:mm')}</span>
                </div>
                {isPending && (
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] animate-pulse" title="Pendiente" />
                )}
                {isCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-primary" title="Completada" />
                )}
            </div>

            <div className="mb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
                        <Contact className="w-5 h-5 text-white/40" />
                        {appt.customer_name}
                    </h3>
                    {appt.customer_phone && appt.customer_phone !== "N/A" && (
                        <a href={`tel:${appt.customer_phone}`} className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/80 transition-colors ml-7 mt-1 tracking-wide w-fit">
                            <Phone className="w-3 h-3" />
                            {appt.customer_phone}
                        </a>
                    )}
                </div>
                {isAdmin && appt.profiles?.full_name && (
                    <div className="bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md text-right">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-primary/60 mb-0.5">Barbero</span>
                        <span className="block text-xs font-bold text-primary truncate max-w-[100px]">{appt.profiles.full_name.split(' ')[0]}</span>
                    </div>
                )}
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between mt-auto mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-0.5">Servicio</span>
                    <span className="text-sm font-semibold text-white/80">{appt.services?.name || 'Servicio Externo'}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-0.5">Monto</span>
                    <span className="text-sm font-bold text-primary flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5" />
                        {formatCurrency(appt.services?.price || 0)}
                    </span>
                </div>
            </div>

            {isPending && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button 
                        onClick={() => updateStatus('completed')}
                        className="flex-1 flex justify-center items-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/50 rounded-xl text-sm font-bold transition-all"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Completar
                    </button>
                    {isAdmin && (
                        <button 
                            onClick={() => updateStatus('cancelled')}
                            className="flex justify-center items-center p-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 hover:border-destructive/50 rounded-xl transition-all"
                            title="Cancelar cita (Solo Admin)"
                        >
                            <Ban className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

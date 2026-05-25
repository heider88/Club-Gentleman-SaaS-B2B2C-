"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Phone, UserX, MoreHorizontal, Scissors } from "lucide-react"
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
    const [showOptions, setShowOptions] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const optionsRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const isAdmin = userRole === 'admin'

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowOptions(false)
                setShowCancelModal(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const updateStatus = async (newStatus: 'completed' | 'cancelled') => {
        setLoading(true)
        setShowOptions(false)
        setShowCancelModal(false)
        
        try {
            if (newStatus === 'cancelled') {
                await cancelAppointment(appt.id);
            } else {
                const { error } = await supabase
                    .from('appointments')
                    .update({ status: newStatus })
                    .eq('id', appt.id)

                if (error) throw new Error(error.message);
            }

            setStatus(newStatus)
            toast.success(newStatus === 'completed' ? 'Corte finalizado' : 'Cita cancelada')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || "Error al actualizar la cita")
        } finally {
            setLoading(false)
        }
    }

    const isCompleted = status === 'completed'
    const isCancelled = status === 'cancelled' || (appt.services?.price || 0) === 0
    const isPending = status === 'pending' || status === 'confirmed'

    if (isCancelled) return null

    // Determine state colors based on luxury industrial palette
    const cardBg = isCompleted ? 'bg-dash-bg border-dash-border/50' : 'bg-dash-panel border-dash-border'
    const textColor = isCompleted ? 'text-dash-text-muted' : 'text-dash-text'

    return (
        <div className={`relative rounded-none p-6 border transition-all duration-500 flex flex-col w-full group ${cardBg} ${isCompleted ? 'grayscale opacity-70 hover:opacity-100' : 'hover:border-dash-border-alt hover:shadow-xl'}`}>
            
            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 z-20 bg-dash-bg/90 rounded-none flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-dash-border-alt border-t-dash-text rounded-full animate-spin"></span>
                </div>
            )}
            
            {/* Header: Service & Options */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <Scissors className={`w-3.5 h-3.5 ${isCompleted ? 'text-dash-text-muted' : 'text-dash-text-soft'}`} />
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${isCompleted ? 'text-dash-text-muted' : 'text-dash-text-soft'}`}>
                        {appt.services?.name || 'Servicio General'}
                    </span>
                </div>
                
                <div className="relative" ref={optionsRef}>
                    <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className={`p-1 rounded-none transition-colors ${showOptions ? 'bg-dash-panel-alt text-dash-text' : 'text-dash-text-muted hover:text-dash-text hover:bg-dash-panel-alt/50'}`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    {/* Dropdown Options */}
                    {showOptions && isPending && !showCancelModal && (
                        <div className="absolute right-0 top-8 w-48 bg-dash-panel-alt border border-dash-border-alt shadow-2xl z-30 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                            {appt.customer_phone && appt.customer_phone !== "N/A" && (
                                <a href={`tel:${appt.customer_phone}`} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-dash-text-soft hover:text-dash-text hover:bg-dash-panel-alt flex items-center gap-3 transition-colors">
                                    <Phone className="w-4 h-4" /> Llamar Cliente
                                </a>
                            )}
                            <button onClick={() => setShowCancelModal(true)} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-3 transition-colors border-t border-dash-border/50">
                                <UserX className="w-4 h-4" /> Marcar No Asistió
                            </button>
                        </div>
                    )}

                    {/* Cancel Confirmation */}
                    {showCancelModal && (
                        <div className="absolute right-0 top-8 w-64 bg-dash-panel border border-dash-border-alt shadow-2xl z-30 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                            <p className="text-xs font-bold uppercase tracking-widest text-dash-text-soft mb-4 text-center leading-relaxed">¿El cliente no llegó?</p>
                            <div className="flex gap-2">
                                <button onClick={() => {setShowCancelModal(false); setShowOptions(false)}} className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest text-dash-text-soft bg-dash-panel-alt hover:brightness-110 transition-all border border-dash-border">Volver</button>
                                <button onClick={() => updateStatus('cancelled')} className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-red-900 hover:bg-red-800 transition-colors border border-red-800">Confirmar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Body: Customer & Price */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h3 className={`font-oswald text-3xl md:text-4xl font-medium tracking-tight uppercase ${textColor}`}>
                        {appt.customer_name}
                    </h3>
                    {isAdmin && appt.profiles?.full_name && (
                        <span className="text-[10px] uppercase tracking-widest text-dash-text-muted font-bold mt-2 block border-l-2 border-dash-border-alt pl-2">
                            Barbero: <span className="text-dash-text-soft">{appt.profiles.full_name.split(' ')[0]}</span>
                        </span>
                    )}
                </div>
                
                <div className="text-right">
                    <span className={`font-oswald text-xl md:text-2xl ${isCompleted ? 'text-dash-text-muted' : 'text-dash-text'}`}>
                        {formatCurrency(appt.services?.price || 0)}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto">
                {isPending ? (
                    <button 
                        onClick={() => updateStatus('completed')}
                        className="w-full bg-dash-text text-dash-bg hover:opacity-80 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-[0.98] border border-transparent"
                    >
                        Finalizar y Cobrar
                    </button>
                ) : (
                    <div className="w-full border border-dash-border/50 bg-dash-panel-alt/30 py-3 flex items-center justify-center gap-2 text-dash-text-muted text-xs font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Completado
                    </div>
                )}
            </div>
        </div>
    )
}

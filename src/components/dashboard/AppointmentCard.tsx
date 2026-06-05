"use client"

import { useState, useRef, useEffect } from "react"
import { CheckCircle2, Phone, UserX, MoreHorizontal, Scissors } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateAppointmentStatus } from "@/app/actions/appointments"

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
    const cancelModalRef = useRef<HTMLDivElement>(null)
        const router = useRouter()

    const isAdmin = userRole === 'admin'

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowOptions(false)
            }
            if (cancelModalRef.current && !cancelModalRef.current.contains(event.target as Node)) {
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
            await updateAppointmentStatus(appt.id, newStatus);

            setStatus(newStatus)
            toast.success(newStatus === 'completed' ? 'Corte finalizado' : 'Cita cancelada')
            router.refresh()
        }  
    catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Error al actualizar la cita")
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
                    {showOptions && isPending && (
                        <div className="absolute right-0 top-8 w-48 bg-dash-panel-alt border border-dash-border-alt shadow-2xl z-30 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                            {appt.customer_phone && appt.customer_phone !== "N/A" && (
                                <a href={`tel:${appt.customer_phone}`} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-dash-text-soft hover:text-dash-text hover:bg-dash-panel-alt flex items-center gap-3 transition-colors">
                                    <Phone className="w-4 h-4" /> Llamar Cliente
                                </a>
                            )}
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
            <div className="mt-auto relative">
                {isPending ? (
                    <div className="flex gap-2 relative">
                        {isAdmin && (
                            <button 
                                onClick={() => setShowCancelModal(true)}
                                className="flex-[0.3] bg-red-950/20 text-red-500 hover:bg-red-950/50 hover:text-red-400 py-3 flex items-center justify-center font-bold transition-all duration-300 shadow-xl active:scale-[0.98] border border-red-500/20 hover:border-red-500/50"
                                title="Marcar Inasistencia"
                            >
                                <UserX className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={() => updateStatus('completed')}
                            className="flex-1 bg-dash-text text-dash-bg hover:opacity-80 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-[0.98] border border-transparent"
                        >
                            Finalizar y Cobrar
                        </button>

                        {/* Cancel Confirmation Popup */}
                        {showCancelModal && isAdmin && (
                            <div ref={cancelModalRef} className="absolute bottom-full mb-2 left-0 right-0 bg-dash-panel border border-red-900/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-40 p-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <p className="text-xs font-bold uppercase tracking-widest text-dash-text-soft mb-4 text-center leading-relaxed">¿Confirmar que el cliente no asistió?</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCancelModal(false)} className="flex-[0.4] py-2 text-[10px] font-bold uppercase tracking-widest text-dash-text-soft bg-dash-panel-alt hover:brightness-110 transition-all border border-dash-border">Cancelar</button>
                                    <button onClick={() => updateStatus('cancelled')} className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 transition-colors border border-red-500">Sí, No Asistió</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full border border-dash-border/50 bg-dash-panel-alt/30 py-3 flex items-center justify-center gap-2 text-dash-text-muted text-xs font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Completado
                    </div>
                )}
            </div>
        </div>
    )
}

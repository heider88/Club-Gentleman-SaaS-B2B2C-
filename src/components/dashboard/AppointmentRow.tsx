"use client"

import { useState, useRef, useEffect } from "react"
import { CheckCircle2, Phone, UserX, MoreVertical, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateAppointmentStatus } from "@/app/actions/appointments"
import { format } from "date-fns"

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

export function AppointmentRow({ appt, userRole }: { appt: AppointmentWithService, userRole: string }) {
    const [status, setStatus] = useState(appt.status)
    const [loading, setLoading] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const optionsRef = useRef<HTMLDivElement>(null)
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
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const updateStatus = async (newStatus: 'completed' | 'cancelled') => {
        setLoading(true)
        setShowOptions(false)
        
        try {
            await updateAppointmentStatus(appt.id, newStatus);
            setStatus(newStatus)
            toast.success(newStatus === 'completed' ? 'Corte finalizado' : 'Cita cancelada')
            router.refresh()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Error al actualizar la cita")
        } finally {
            setLoading(false)
        }
    }

    const isCompleted = status === 'completed'
    const isCancelled = status === 'cancelled' || (appt.services?.price || 0) === 0
    const isPending = status === 'pending' || status === 'confirmed'

    if (isCancelled) return null

    const rowBg = isCompleted ? 'bg-green-950/20 border-green-900/30' : 'bg-dash-panel border-dash-border hover:border-dash-border-alt'
    const textColor = isCompleted ? 'text-green-600/70' : 'text-dash-text'

    return (
        <div className={`relative flex items-center justify-between p-3 md:p-4 border rounded-none transition-all duration-300 group ${rowBg} ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-dash-panel/50 backdrop-blur-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-dash-text" />
                </div>
            )}
            
            {/* Left: Time & Info */}
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <div className={`flex flex-col items-center justify-center shrink-0 min-w-[50px] md:min-w-[60px] border-r ${isCompleted ? 'border-green-900/30' : 'border-dash-border'} pr-3 md:pr-4`}>
                    <span className={`font-oswald text-sm md:text-base leading-none ${textColor}`}>{format(new Date(appt.start_time), 'h:mm a')}</span>
                    <span className={`font-oswald text-[10px] md:text-xs mt-1 ${isCompleted ? 'text-green-700/50' : 'text-dash-text-muted'}`}>{format(new Date(appt.end_time), 'h:mm a')}</span>
                </div>
                
                <div className="flex flex-col min-w-0 flex-1 py-1">
                    <h3 className={`font-oswald text-base md:text-lg uppercase truncate leading-none ${textColor}`}>
                        {appt.customer_name}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
                        <span className={`text-[9px] md:text-[10px] uppercase tracking-widest font-bold truncate ${isCompleted ? 'text-green-600/50' : 'text-dash-text-soft'}`}>
                            {appt.services?.name || 'Servicio'}
                        </span>
                        <span className={`text-[9px] md:text-[10px] font-mono ${isCompleted ? 'text-green-600/50' : 'text-dash-text-muted'}`}>
                            {formatCurrency(appt.services?.price || 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
                {!isAdmin && appt.customer_phone && appt.customer_phone !== "N/A" && (
                    <div className="flex gap-1 mr-1">
                        <a href={`https://wa.me/${appt.customer_phone.replace('+', '')}`} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center border border-dash-border bg-dash-panel text-dash-text-soft hover:text-dash-text hover:bg-dash-panel-alt transition-colors active:scale-95" title="WhatsApp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </a>
                    </div>
                )}
                {isPending ? (
                    <>
                        <button 
                            onClick={() => updateStatus('completed')}
                            className="w-9 h-9 md:w-auto md:px-4 md:py-2 flex items-center justify-center bg-dash-text text-black hover:opacity-80 transition-all active:scale-95 shadow-lg"
                            title="Finalizar"
                        >
                            <CheckCircle2 className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline font-bold text-[10px] uppercase tracking-widest">Cobrar</span>
                        </button>
                        
                        <div className="relative" ref={optionsRef}>
                            <button 
                                onClick={() => setShowOptions(!showOptions)}
                                className="w-9 h-9 flex items-center justify-center border border-dash-border text-dash-text-soft hover:text-dash-text hover:bg-dash-panel-alt transition-colors active:scale-95 bg-dash-panel"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                            {showOptions && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-dash-panel-alt border border-dash-border-alt shadow-2xl z-30 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                    
                                    {isAdmin && (
                                        <button 
                                            onClick={() => updateStatus('cancelled')}
                                            className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 flex items-center gap-3"
                                        >
                                            <UserX className="w-3.5 h-3.5" /> No Asistió
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center w-9 h-9 md:w-auto md:px-3 md:py-1.5 border border-green-900/30 bg-green-950/20 text-green-600/70">
                        <CheckCircle2 className="w-4 h-4 md:mr-1.5" />
                        <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">Listo</span>
                    </div>
                )}
            </div>
        </div>
    )
}

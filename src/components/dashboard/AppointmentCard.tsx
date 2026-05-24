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
    const isCancelled = status === 'cancelled'
    const isPending = status === 'pending' || status === 'confirmed'

    if (isCancelled) return null

    // Determine state colors based on luxury industrial palette
    const cardBg = isCompleted ? 'bg-zinc-950/40 border-zinc-900/50' : 'bg-black border-zinc-800'
    const textColor = isCompleted ? 'text-zinc-500' : 'text-zinc-100'

    return (
        <div className={`relative rounded-none p-6 border transition-all duration-500 flex flex-col w-full group ${cardBg} ${isCompleted ? 'grayscale opacity-70 hover:opacity-100' : 'hover:border-zinc-500 hover:shadow-[0_10px_30px_rgba(255,255,255,0.02)]'}`}>
            
            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 z-20 bg-black/90 rounded-none flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></span>
                </div>
            )}
            
            {/* Header: Service & Options */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <Scissors className={`w-3.5 h-3.5 ${isCompleted ? 'text-zinc-600' : 'text-zinc-400'}`} />
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${isCompleted ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {appt.services?.name || 'Servicio General'}
                    </span>
                </div>
                
                <div className="relative" ref={optionsRef}>
                    <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className={`p-1 rounded-none transition-colors ${showOptions ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    {/* Dropdown Options */}
                    {showOptions && isPending && !showCancelModal && (
                        <div className="absolute right-0 top-8 w-48 bg-zinc-900 border border-zinc-700 shadow-2xl z-30 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                            {appt.customer_phone && appt.customer_phone !== "N/A" && (
                                <a href={`tel:${appt.customer_phone}`} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-3 transition-colors">
                                    <Phone className="w-4 h-4" /> Llamar Cliente
                                </a>
                            )}
                            <button onClick={() => setShowCancelModal(true)} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-3 transition-colors border-t border-zinc-800/50">
                                <UserX className="w-4 h-4" /> Marcar No Asistió
                            </button>
                        </div>
                    )}

                    {/* Cancel Confirmation */}
                    {showCancelModal && (
                        <div className="absolute right-0 top-8 w-64 bg-black border border-zinc-700 shadow-2xl z-30 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 text-center leading-relaxed">¿El cliente no llegó?</p>
                            <div className="flex gap-2">
                                <button onClick={() => {setShowCancelModal(false); setShowOptions(false)}} className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800">Volver</button>
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
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-2 block border-l-2 border-zinc-700 pl-2">
                            Barbero: <span className="text-zinc-300">{appt.profiles.full_name.split(' ')[0]}</span>
                        </span>
                    )}
                </div>
                
                <div className="text-right">
                    <span className={`font-oswald text-xl md:text-2xl ${isCompleted ? 'text-zinc-600' : 'text-white'}`}>
                        {formatCurrency(appt.services?.price || 0)}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto">
                {isPending ? (
                    <button 
                        onClick={() => updateStatus('completed')}
                        className="w-full bg-white text-black hover:bg-zinc-200 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] border border-transparent"
                    >
                        Finalizar y Cobrar
                    </button>
                ) : (
                    <div className="w-full border border-zinc-800/50 bg-zinc-900/30 py-3 flex items-center justify-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Completado
                    </div>
                )}
            </div>
        </div>
    )
}

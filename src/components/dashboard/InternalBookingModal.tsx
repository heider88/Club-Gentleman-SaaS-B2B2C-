"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CalendarView } from "@/components/booking/CalendarView"
import { Plus, X, Calendar, User, Phone, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { format, parse } from "date-fns"
import { useRouter } from "next/navigation"

export function InternalBookingModal({ barberId }: { barberId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [services, setServices] = useState<any[]>([])
    const [loadingServices, setLoadingServices] = useState(true)

    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    
    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (isOpen && services.length === 0) {
            async function fetchServices() {
                const { data } = await supabase.from('services').select('*').eq('barber_id', barberId)
                if (data) setServices(data)
                setLoadingServices(false)
            }
            fetchServices()
        }
    }, [isOpen, barberId])

    const selectedService = services.find(s => s.id === selectedServiceId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedService || !selectedTime) return toast.error("Selecciona servicio y hora.")

        setIsSaving(true)
        
        // Calcular startTime y endTime
        const [hours, minutes] = selectedTime.split(':')
        const startDateTime = new Date(selectedDate)
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        
        const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_minutes * 60000)

        const { error } = await supabase.from('appointments').insert([{
            barber_id: barberId,
            service_id: selectedService.id,
            customer_name: customerName || "Cliente",
            customer_phone: customerPhone || "N/A",
            customer_email: customerEmail || "local@barberia.app",
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            status: 'pending'
        }])

        setIsSaving(false)

        if (error) {
            toast.error("No se pudo agendar la cita.", { description: error.message })
        } else {
            toast.success("Cita agregada a la agenda.")
            setIsOpen(false)
            resetForm()
            router.refresh()
        }
    }

    const resetForm = () => {
        setSelectedServiceId("")
        setSelectedTime("")
        setCustomerName("")
        setCustomerPhone("")
        setCustomerEmail("")
        setSelectedDate(new Date())
    }

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-sm shadow-lg"
            >
                <Plus className="w-4 h-4" /> Agendar Local
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" /> Agregar Cita Manual
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                            {loadingServices ? (
                                <p className="text-white/50 text-center animate-pulse py-8">Cargando tus servicios...</p>
                            ) : services.length === 0 ? (
                                <p className="text-white/50 text-center py-8">No tienes servicios asignados. Pide al admin que te agregue servicios al catálogo.</p>
                            ) : (
                                <form id="internalBooking" onSubmit={handleSubmit} className="space-y-6">
                                    {/* 1. Datos Cliente */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Nombre Cliente</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <input 
                                                    type="text" required
                                                    value={customerName} onChange={e => setCustomerName(e.target.value)}
                                                    placeholder="Ej: Juan Pérez"
                                                    className="w-full p-3 pl-10 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Teléfono (Opc.)</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <input 
                                                    type="tel"
                                                    value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                                                    placeholder="Ej: 300..."
                                                    className="w-full p-3 pl-10 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Correo (Opc.)</label>
                                            <div className="relative">
                                                <input 
                                                    type="email"
                                                    value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                                                    placeholder="Ej: correo@cliente.com"
                                                    className="w-full p-3 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Servicio y Fecha */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Servicio *</label>
                                            <select 
                                                required
                                                value={selectedServiceId} 
                                                onChange={e => {
                                                    setSelectedServiceId(e.target.value)
                                                    setSelectedTime("") // Reset time if service changes
                                                }}
                                                className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary appearance-none text-sm"
                                            >
                                                <option value="" disabled>Selecciona...</option>
                                                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}m)</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Día de la Cita *</label>
                                            <input 
                                                type="date" 
                                                required
                                                value={format(selectedDate, 'yyyy-MM-dd')}
                                                onChange={e => {
                                                    setSelectedDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))
                                                    setSelectedTime("")
                                                }}
                                                className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary text-sm [color-scheme:dark]"
                                                min={format(new Date(), 'yyyy-MM-dd')}
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Selección de Hora (Solo si hay servicio y fecha) */}
                                    {selectedService && selectedDate && (
                                        <div className="pt-2 border-t border-white/5">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 mb-2 block">Elige la hora disponible</label>
                                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                                <CalendarView 
                                                    barberId={barberId}
                                                    date={selectedDate}
                                                    durationMinutes={selectedService.duration_minutes}
                                                    onSelect={(time) => setSelectedTime(time)}
                                                />
                                            </div>
                                            {selectedTime && (
                                                <div className="mt-4 flex items-center justify-center gap-2 text-primary font-bold bg-primary/10 py-2 rounded-xl border border-primary/20">
                                                    <CheckCircle2 className="w-5 h-5" /> 
                                                    Hora seleccionada: {selectedTime}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="internalBooking"
                                disabled={isSaving || !selectedTime}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground disabled:opacity-50 hover:brightness-110 flex items-center gap-2 shadow-[0_0_15px_rgba(var(--color-primary),0.3)] transition-all"
                            >
                                {isSaving ? <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : null}
                                Agendar en mi Agenda
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

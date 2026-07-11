"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CalendarView } from "@/components/booking/CalendarView"
import { Plus, X, Calendar, User, Phone, CheckCircle2, Scissors } from "lucide-react"
import { toast } from "sonner"
import { format, parse } from "date-fns"
import { useRouter } from "next/navigation"

import { createAppointmentAction } from "@/app/actions/appointments"

export function AdminBookingModal() {
    const [isOpen, setIsOpen] = useState(false)
    
    const [barbers, setBarbers] = useState<any[]>([])
    const [selectedBarberId, setSelectedBarberId] = useState("")

    const [services, setServices] = useState<any[]>([])
    const [loadingServices, setLoadingServices] = useState(false)

    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    
    const [isExtraordinary, setIsExtraordinary] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (isOpen && barbers.length === 0) {
            async function fetchBarbers() {
                const { data } = await supabase.from('profiles').select('*').eq('role', 'barber')
                if (data) setBarbers(data)
            }
            fetchBarbers()
        }
    }, [isOpen, barbers.length, supabase])

    useEffect(() => {
        if (selectedBarberId) {
            setLoadingServices(true)
            setSelectedServiceId("")
            setSelectedTime("")
            async function fetchServices() {
                const { data } = await supabase.from('services').select('*').eq('barber_id', selectedBarberId)
                if (data) setServices(data)
                setLoadingServices(false)
            }
            fetchServices()
        } else {
            setServices([])
        }
    }, [selectedBarberId, supabase])

    const selectedService = services.find(s => s.id === selectedServiceId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBarberId) return toast.error("Selecciona un barbero.")
        if (!selectedService || !selectedTime) return toast.error("Selecciona servicio y hora.")

        setIsSaving(true)
        
        const startDateTime = parse(selectedTime, 'h:mm a', selectedDate)
        const endDateTime = new Date(startDateTime.getTime() + (selectedService.duration_minutes as number) * 60000)

        const result = await createAppointmentAction({
            barberId: selectedBarberId,
            serviceId: selectedService.id,
            customerName: customerName || "Cliente",
            customerPhone: customerPhone || "N/A",
            customerEmail: customerEmail || "local@barberia.app",
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            isExtraordinary: isExtraordinary
        })

        setIsSaving(false)

        if (!result.success) {
            toast.error("No se pudo agendar la cita.", { description: result.error })
        } else {
            toast.success("Cita agregada a la agenda general y correo enviado.")
            setIsOpen(false)
            resetForm()
            router.refresh()
        }
    }

    const resetForm = () => {
        setSelectedBarberId("")
        setSelectedServiceId("")
        setSelectedTime("")
        setCustomerName("")
        setCustomerPhone("")
        setCustomerEmail("")
        setIsExtraordinary(false)
    }

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-primary/20 hover:bg-primary/40 text-primary font-bold px-4 py-2 rounded-xl border border-primary/20 transition-all flex items-center gap-2 text-sm shadow-lg"
            >
                <Plus className="w-4 h-4" /> Nueva Cita
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" /> Agendar Cita Manual
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                            <form id="adminBooking" onSubmit={handleSubmit} className="space-y-6">
                                {/* 0. Selección de Barbero */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Barbero *</label>
                                    <div className="relative">
                                        <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                        <select 
                                            required
                                            value={selectedBarberId} 
                                            onChange={e => setSelectedBarberId(e.target.value)}
                                            className="w-full p-3 pl-10 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary appearance-none text-sm"
                                        >
                                            <option value="" disabled>Seleccionar Barbero...</option>
                                            {barbers.map(b => <option key={b.id} value={b.id}>{b.full_name}</option>)}
                                        </select>
                                    </div>
                                </div>

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

                                {/* 2. Servicio */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Servicio *</label>
                                    <select 
                                        required
                                        disabled={!selectedBarberId || loadingServices}
                                        value={selectedServiceId} 
                                        onChange={e => {
                                            setSelectedServiceId(e.target.value)
                                            setSelectedTime("")
                                        }}
                                        className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary appearance-none text-sm disabled:opacity-50"
                                    >
                                        <option value="" disabled>{loadingServices ? "Cargando..." : "Selecciona..."}</option>
                                        {services.map(s => <option key={s.id as string} value={s.id as string}>{s.name as string} ({s.duration_minutes as number}m)</option>)}
                                    </select>
                                </div>

                                {/* 3. Selección de Día y Hora */}
                                {selectedService && selectedBarberId && (
                                    <div className="pt-2 border-t border-white/5">
                                        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                            <CalendarView 
                                                barberId={selectedBarberId}
                                                date={selectedDate}
                                                durationMinutes={selectedService.duration_minutes as number}
                                                allowPastTimes={true}
                                                onSelect={(time, date) => {
                                                    setSelectedTime(time)
                                                    setSelectedDate(date)
                                                }}
                                                ignoreScheduleLimits={isExtraordinary}
                                            />
                                        </div>
                                        
                                        <div className="mt-4 flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                                    🔥 Horario Extraordinario
                                                </span>
                                                <span className="text-[10px] text-white/50">Ignorar límites y bloqueos</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={isExtraordinary} onChange={e => setIsExtraordinary(e.target.checked)} />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                            </label>
                                        </div>

                                        {selectedTime && (
                                            <div className="mt-4 flex flex-col items-center justify-center gap-1 text-primary bg-primary/10 py-3 rounded-xl border border-primary/20">
                                                <div className="flex items-center gap-2 font-bold">
                                                    <CheckCircle2 className="w-5 h-5" /> 
                                                    Hora seleccionada: {selectedTime}
                                                </div>
                                                <span className="text-xs text-primary/70">
                                                    {format(selectedDate, "EEEE d 'de' MMMM", { locale: require('date-fns/locale/es').es })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
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
                                form="adminBooking"
                                disabled={isSaving || !selectedTime}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground disabled:opacity-50 hover:brightness-110 flex items-center gap-2 shadow-[0_0_15px_rgba(var(--color-primary),0.3)] transition-all"
                            >
                                {isSaving ? <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : null}
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

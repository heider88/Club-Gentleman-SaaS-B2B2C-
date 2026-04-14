"use client"
import { useEffect, useState, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { format, addDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Barber {
    id: string
    full_name: string
    avatar_url: string
    bio: string
}

interface BarberSelectionProps {
    serviceName: string
    onSelect: (barberId: string, exactServiceId: string, date: Date, barberName: string) => void
}

export function BarberSelection({ serviceName, onSelect }: BarberSelectionProps) {
    const [barbers, setBarbers] = useState<(Barber & { exactServiceId: string })[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedBarber, setSelectedBarber] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
        }
    }

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
        }
    }

    useEffect(() => {
        async function fetchBarbers() {
            setLoading(true)
            const supabase = createClient()

            // Traer perfiles y servicios donde nombre coincida
            const [profilesRes, servicesRes] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('services').select('id, barber_id, name').eq('name', serviceName)
            ])

            if (profilesRes.data && servicesRes.data) {
                // Filtrar barberos que dictan este servicio
                const available = profilesRes.data.map(profile => {
                    const svc = servicesRes.data.find(s => s.barber_id === profile.id);
                    if (!svc) return null;
                    return { ...profile, exactServiceId: svc.id } as Barber & { exactServiceId: string };
                }).filter(Boolean) as (Barber & { exactServiceId: string })[]

                setBarbers(available)
            }
            setLoading(false)
        }
        fetchBarbers()
    }, [serviceName])

    // Fechas siguientes
    const days = useMemo(() => {
        const daysArr = []
        for (let i = 0; i < 14; i++) {
            daysArr.push(addDays(new Date(), i))
        }
        return daysArr
    }, [])

    const handleConfirm = () => {
        if (!selectedBarber) return;
        const barberInfo = barbers.find(b => b.id === selectedBarber);
        if (barberInfo) {
            onSelect(selectedBarber, barberInfo.exactServiceId, selectedDate, barberInfo.full_name || "Barbero");
        }
    }

    if (loading) return <div className="text-white/50 text-sm animate-pulse p-4">Cargando barberos...</div>
    if (barbers.length === 0) return <div className="text-white/50 text-sm p-4 text-center">Nadie ofrece este servicio de momento.</div>

    return (
        <div className="flex flex-col gap-6">
            {/* Lista de Barberos */}
            <div className="grid gap-3">
                {barbers.map((barber, idx) => {
                    const isSelected = selectedBarber === barber.id
                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={barber.id}
                            onClick={() => setSelectedBarber(barber.id)}
                            className={cn(
                                "group relative overflow-hidden rounded-xl backdrop-blur-md border cursor-pointer min-h-[44px] active:scale-95 transition-all duration-300",
                                isSelected
                                    ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--color-primary),0.2)]"
                                    : "bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center gap-4 p-4">
                                <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-full bg-secondary ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                                    <img
                                        src={barber.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + barber.id}
                                        alt={barber.full_name || "Barber"}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className={cn("text-lg font-bold transition-colors", isSelected ? "text-primary" : "text-white group-hover:text-primary")}>
                                        {barber.full_name || "Barbero"}
                                    </h3>
                                    <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                                        {barber.bio || "Especialista en cortes y barbas."}
                                    </p>
                                </div>
                                <div className={cn("transition-colors", isSelected ? "text-primary" : "text-white/20 group-hover:text-primary/50")}>
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Selector de Fecha */}
            <AnimatePresence>
                {selectedBarber && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 space-y-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Fechas Disponibles</h4>
                            <div className="relative group/scroll">
                                {/* Botón Izquierdo */}
                                <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#111111] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:block" />
                                <button
                                    onClick={scrollLeft}
                                    className="absolute left-0 top-10 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full text-white hover:text-primary transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex shadow-xl shadow-black/50"
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>

                                <div
                                    ref={scrollContainerRef}
                                    className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide py-1 scroll-smooth"
                                >
                                    {days.map((date) => {
                                        const isSelected = isSameDay(date, selectedDate)
                                        return (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => setSelectedDate(date)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl border transition-all relative shrink-0 overflow-hidden",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"
                                                        : "bg-black/40 backdrop-blur-sm border-white/10 hover:bg-black/60 hover:border-primary/50 text-white/90"
                                                )}
                                            >
                                                {/* Efecto hover interactivo extra */}
                                                {!isSelected && <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />}

                                                <span className="text-xs font-medium uppercase opacity-80 z-10">
                                                    {format(date, 'EEE', { locale: es })}
                                                </span>
                                                <span className="text-xl font-black z-10">
                                                    {format(date, 'd')}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Botón Derecho */}
                                <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#111111] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:block" />
                                <button
                                    onClick={scrollRight}
                                    className="absolute right-0 top-10 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full text-white hover:text-primary transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex shadow-xl shadow-black/50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={handleConfirm}
                                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2"
                            >
                                Continuar a ver horas <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { ChevronRight, Scissors } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Barber {
    id: string
    full_name: string
    avatar_url: string
    bio: string
    specialty: string | null
}

interface BarberSelectionProps {
    onSelect: (barberId: string, exactServiceId: string, date: Date, barberName: string) => void
}

export function BarberSelection({ onSelect }: BarberSelectionProps) {
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchBarbers() {
            setLoading(true)
            const supabase = createClient()

            // Traer todos los perfiles que son barberos
            const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, bio, specialty').eq('role', 'barber')

            if (data) {
                setBarbers(data as unknown as Barber[])
            }
            setLoading(false)
        }
        fetchBarbers()
    }, [])

    if (loading) return <div className="text-white/50 text-sm animate-pulse p-4">Cargando equipo...</div>
    if (barbers.length === 0) return <div className="text-white/50 text-sm p-4 text-center">Aún no hay equipo registrado.</div>

    return (
        <div className="flex flex-col gap-6">
            {/* Lista de Barberos */}
            <div className="grid gap-3">
                {barbers.map((barber, idx) => {
                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={barber.id}
                            onClick={() => onSelect(barber.id, "", new Date(), barber.full_name || "Barbero")}
                            className={cn(
                                "group relative overflow-hidden rounded-xl backdrop-blur-md border cursor-pointer min-h-[44px] active:scale-95 transition-all duration-300",
                                "bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center gap-4 p-4">
                                <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-full bg-secondary ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                                    <Image
                                        src={barber.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + barber.id}
                                        alt={barber.full_name || "Barber"}
                                        fill
                                        unoptimized
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                        {barber.full_name || "Barbero"}
                                    </h3>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-0.5 mb-1">
                                        {barber.specialty || "Barbero"}
                                    </p>
                                    <p className="text-xs text-white/50 line-clamp-1">
                                        {barber.bio || "Especialista listo para atenderte."}
                                    </p>
                                </div>
                                <div className="text-white/20 group-hover:text-primary/50 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}


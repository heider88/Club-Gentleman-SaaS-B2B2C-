"use client"
import { motion } from "framer-motion"

interface ServiceGroup {
    id: string
    name: string
    price: number
    duration: number
    description: string | null
    barber_id?: string
}

interface ServiceSelectionProps {
    services: any[]
    barberId: string
    onSelect: (service: ServiceGroup) => void
}

export function ServiceSelection({ services, barberId, onSelect }: ServiceSelectionProps) {
    const barberServices = services
        .filter(s => s.barber_id === barberId)
        .map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            duration: item.duration_minutes,
            description: item.description
        }))

    if (!barberServices || barberServices.length === 0) return <div className="text-white/50 text-sm p-4">No hay servicios disponibles actualmente.</div>

    return (
        <div className="flex flex-col gap-3">
            {barberServices.map((service, idx) => (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={service.id}
                    onClick={() => onSelect(service)}
                    className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:bg-white/10 hover:border-primary/50 active:scale-95 min-h-[44px] transition-all group"
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-base text-white group-hover:text-primary transition-colors">{service.name}</span>
                        <span className="font-bold text-white">${service.price}</span>
                    </div>
                    {service.description && (
                        <p className="text-sm text-white/60 mb-2 line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex items-center text-xs text-white/50 gap-2">
                        <span className="flex items-center gap-1 font-medium group-hover:text-white/80 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {service.duration} mins
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    )
}

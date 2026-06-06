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

    if (!barberServices || barberServices.length === 0) return <div className="text-white/50 text-sm p-4 font-mono uppercase tracking-widest">No hay servicios disponibles.</div>

    return (
        <div className="flex flex-col gap-0 border-t border-b border-white/20 py-2">
            {barberServices.map((service, idx) => (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={service.id}
                    onClick={() => onSelect(service)}
                    className="w-full text-left py-5 px-4 bg-transparent hover:bg-[#6D3294]/20 border-b border-white/[0.05] last:border-b-0 group transition-all duration-300 relative overflow-hidden"
                >
                    {/* Hover indicator line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6D3294] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start gap-2 sm:gap-4 mb-2">
                        <span className="font-oswald text-lg sm:text-xl uppercase tracking-wider text-white/90 group-hover:text-white transition-colors">{service.name}</span>
                        <div className="hidden sm:block flex-1 border-b-2 border-dotted border-white/10 group-hover:border-[#6D3294]/50 transition-colors mx-2 relative top-[12px]"></div>
                        <div className="sm:hidden flex-1"></div>
                        <span className="font-mono text-base sm:text-lg font-bold text-white group-hover:text-pink-400 transition-colors shrink-0 whitespace-nowrap mt-1">${service.price}</span>
                    </div>
                    
                    {service.description && (
                        <p className="text-sm font-jakarta text-white/50 mb-3 pr-16 group-hover:text-white/70 transition-colors">{service.description}</p>
                    )}
                    
                    <div className="flex items-center">
                        <span className="inline-block border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/60 uppercase tracking-widest group-hover:border-[#6D3294]/50 group-hover:text-white/90 transition-colors">
                            {service.duration} MINUTOS
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    )
}

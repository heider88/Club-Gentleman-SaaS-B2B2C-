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
                <motion.div
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={service.id}
                    onClick={() => onSelect(service)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelect(service)}
                    className="w-full text-left py-3 sm:py-4 px-3 sm:px-4 bg-transparent hover:bg-[#6D3294]/20 border-b border-white/[0.05] last:border-b-0 group transition-all duration-300 relative overflow-hidden cursor-pointer"
                >
                    {/* Hover indicator line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6D3294] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start gap-3 mb-1">
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-oswald text-lg uppercase tracking-wider text-white/90 group-hover:text-white transition-colors leading-tight break-words">{service.name}</span>
                            
                            {service.description ? (
                                <p className="text-[13px] font-jakarta text-white/70 mt-1.5 leading-relaxed group-hover:text-white/90 transition-colors whitespace-pre-wrap break-words block">{service.description}</p>
                            ) : (
                                <p className="text-[12px] font-jakarta text-white/30 mt-1.5 italic block">(No hay descripción para este corte)</p>
                            )}
                            
                            <div className="mt-2">
                                <span className="inline-block border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono text-white/60 uppercase tracking-widest group-hover:border-[#6D3294]/50 group-hover:text-white/90 transition-colors rounded-sm">
                                    {service.duration} MINUTOS
                                </span>
                            </div>
                        </div>
                        <span className="font-mono text-base font-bold text-white group-hover:text-pink-400 transition-colors shrink-0 whitespace-nowrap">${service.price}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

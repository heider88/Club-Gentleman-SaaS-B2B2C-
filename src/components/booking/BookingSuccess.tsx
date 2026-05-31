"use client"

import { motion } from "framer-motion"
import { useEffect, useRef } from "react"

interface BookingSuccessProps {
    date: Date | null
    time: string
}

export function BookingSuccess({ date, time }: BookingSuccessProps) {
    const successRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // En cuanto se renderice este componente, forzamos la vista hacia él.
        // Esto previene el salto abrupto hacia la sección de barberos inferior.
        if (successRef.current) {
            // Un timeout pequeñito asegura que el DOM se pintó (altura final resuelta)
            setTimeout(() => {
                successRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
        }
    }, []);

    return (
        <div ref={successRef} className="text-center py-8">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </motion.div>

            <h2 className="text-3xl font-bold mb-2 text-white">¡Reserva Confirmada!</h2>
            <p className="text-white/60 mb-8">Te hemos enviado un mensaje con los detalles.</p>

            <div className="bg-black/60 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between">
                    <span className="text-white/60">Fecha</span>
                    <span className="font-bold text-white">{date?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/60">Hora</span>
                    <span className="font-bold text-primary">{time}</span>
                </div>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="w-full py-4 min-h-[44px] rounded-xl bg-white/10 border border-white/20 text-white font-bold text-lg hover:bg-white/20 active:scale-95 transition-all"
            >
                Volver al inicio
            </button>
        </div>
    )
}

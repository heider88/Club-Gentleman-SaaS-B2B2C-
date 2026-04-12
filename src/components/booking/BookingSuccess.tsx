"use client"

import { motion } from "framer-motion"

interface BookingSuccessProps {
    date: Date | null
    time: string
}

export function BookingSuccess({ date, time }: BookingSuccessProps) {
    return (
        <div className="text-center py-8">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </motion.div>

            <h2 className="text-3xl font-bold mb-2">¡Reserva Confirmada!</h2>
            <p className="text-muted-foreground mb-8">Te hemos enviado un correo con los detalles.</p>

            <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-bold">{date?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Hora</span>
                    <span className="font-bold text-primary">{time}</span>
                </div>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="text-primary hover:underline"
            >
                Volver al inicio
            </button>
        </div>
    )
}

"use client";
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ServiceSelection } from "./ServiceSelection"
import { BarberSelection } from "./BarberSelection"
import { CalendarView } from "./CalendarView"
import { ContactForm } from "./ContactForm"
import { BookingSuccess } from "./BookingSuccess"
import { Check, Edit2 } from "lucide-react"

export interface GlobalBookingState {
    serviceName: string;
    serviceDuration: number;
    serviceId: string;
    barberId: string;
    date: Date | null;
    time: string;
}

export default function BookingWizard() {
    const [step, setStep] = useState(1)
    const [bookingData, setBookingData] = useState<GlobalBookingState>({
        serviceName: "",
        serviceDuration: 0,
        serviceId: "",
        barberId: "",
        date: null,
        time: "",
    })

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Smooth scroll the horizontal container when step changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            if (step > 1) {
                const targetScroll = (step - 1) * 260; // Approx width of collapsed steps
                container.scrollTo({ left: targetScroll, behavior: 'smooth' });
            } else {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
    }, [step])

    if (step === 5) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <BookingSuccess date={bookingData.date} time={bookingData.time} />
            </motion.div>
        )
    }

    return (
        <div
            ref={scrollContainerRef}
            className="w-full relative py-2 overflow-x-auto pb-8 snap-x snap-mandatory flex items-start gap-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

            {/* Step 1: Service */}
            <div className={`shrink-0 snap-start flex flex-col transition-all duration-700 ease-in-out ${step === 1 ? 'w-[300px] sm:w-[350px]' : 'w-[200px]'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 z-10 shrink-0 ${step === 1 ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--color-primary),0.5)]' : step > 1 ? 'bg-green-500 border-green-500 text-white' : 'bg-black/50 border-white/20 text-white/50'}`}>
                        {step > 1 ? <Check className="w-5 h-5" /> : 1}
                    </div>
                    <div className="flex-1 h-[2px] bg-white/10 rounded-full" />
                </div>

                {step === 1 ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-20">
                        <h3 className="text-xl font-bold mb-4 text-white">Elige un Servicio</h3>
                        <div className="max-h-[500px] overflow-y-auto pr-2 pb-4 scrollbar-hide">
                            <ServiceSelection onSelect={(svc) => {
                                setBookingData(prev => ({ ...prev, serviceName: svc.name, serviceDuration: svc.duration }))
                                setStep(2)
                            }} />
                        </div>
                    </motion.div>
                ) : step > 1 ? (
                    <div
                        onClick={() => setStep(1)}
                        className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col gap-3 cursor-pointer hover:bg-black/80 hover:border-primary/50 transition-all relative z-20 group h-32 justify-center"
                    >
                        <span className="text-sm font-medium text-white/80">Paso 1 completado</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:text-primary/80">
                            Editar Servicio <Edit2 className="w-3.5 h-3.5" />
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Step 2: Barber & Date */}
            <div className={`shrink-0 snap-start flex flex-col transition-all duration-700 ease-in-out ${step === 2 ? 'w-[300px] sm:w-[350px]' : step > 2 ? 'w-[200px]' : 'w-[80px] opacity-40 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 z-10 shrink-0 ${step === 2 ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--color-primary),0.5)]' : step > 2 ? 'bg-green-500 border-green-500 text-white' : 'bg-black/50 border-white/20 text-white/50'}`}>
                        {step > 2 ? <Check className="w-5 h-5" /> : 2}
                    </div>
                    <div className="flex-1 h-[2px] bg-white/10 rounded-full" />
                </div>

                {step === 2 ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-20">
                        <h3 className="text-xl font-bold mb-4 text-white">Barbero & Fecha</h3>
                        <div className="max-h-[500px] overflow-y-auto pr-2 pb-4 scrollbar-hide">
                            <BarberSelection
                                serviceName={bookingData.serviceName}
                                onSelect={(barberId, exactSvcId, date) => {
                                    setBookingData(prev => ({ ...prev, barberId, serviceId: exactSvcId, date }))
                                    setStep(3)
                                }}
                            />
                        </div>
                    </motion.div>
                ) : step > 2 ? (
                    <div
                        onClick={() => setStep(2)}
                        className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col gap-3 cursor-pointer hover:bg-black/80 hover:border-primary/50 transition-all relative z-20 group h-32 justify-center"
                    >
                        <span className="text-sm font-medium text-white/80">Paso 2 completado</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:text-primary/80">
                            Editar Barbero/Día <Edit2 className="w-3.5 h-3.5" />
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Step 3: Time Slot */}
            <div className={`shrink-0 snap-start flex flex-col transition-all duration-700 ease-in-out ${step === 3 ? 'w-[300px] sm:w-[350px]' : step > 3 ? 'w-[200px]' : 'w-[80px] opacity-40 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 z-10 shrink-0 ${step === 3 ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--color-primary),0.5)]' : step > 3 ? 'bg-green-500 border-green-500 text-white' : 'bg-black/50 border-white/20 text-white/50'}`}>
                        {step > 3 ? <Check className="w-5 h-5" /> : 3}
                    </div>
                    <div className="flex-1 h-[2px] bg-white/10 rounded-full" />
                </div>

                {step === 3 ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-20">
                        <h3 className="text-xl font-bold mb-4 text-white">Hora Exacta</h3>
                        <div className="max-h-[500px] overflow-y-auto pr-2 pb-4 scrollbar-hide">
                            {!bookingData.barberId || !bookingData.date ? (
                                <p className="text-white/50 text-sm">Faltan datos previos.</p> // Failsafe
                            ) : (
                                <CalendarView
                                    barberId={bookingData.barberId}
                                    date={bookingData.date}
                                    durationMinutes={bookingData.serviceDuration}
                                    onSelect={(time) => {
                                        setBookingData(prev => ({ ...prev, time }))
                                        setStep(4)
                                    }}
                                />
                            )}
                        </div>
                    </motion.div>
                ) : step > 3 ? (
                    <div
                        onClick={() => setStep(3)}
                        className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col gap-3 cursor-pointer hover:bg-black/80 hover:border-primary/50 transition-all relative z-20 group h-32 justify-center"
                    >
                        <span className="text-sm font-medium text-white/80">Paso 3 completado</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:text-primary/80">
                            Editar Horario <Edit2 className="w-3.5 h-3.5" />
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Step 4: Contact Form */}
            <div className={`shrink-0 snap-start flex flex-col transition-all duration-700 ease-in-out ${step === 4 ? 'w-[300px] sm:w-[350px]' : step > 4 ? 'w-[200px]' : 'w-[80px] opacity-40 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 z-10 shrink-0 ${step === 4 ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--color-primary),0.5)]' : step > 4 ? 'bg-green-500 border-green-500 text-white' : 'bg-black/50 border-white/20 text-white/50'}`}>
                        {step > 4 ? <Check className="w-5 h-5" /> : 4}
                    </div>
                </div>

                {step === 4 ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-20">
                        <h3 className="text-xl font-bold mb-4 text-white">Último Paso</h3>
                        <div className="max-h-[500px] overflow-y-auto pr-2 pb-4 scrollbar-hide">
                            <ContactForm
                                bookingData={bookingData as any}
                                onSuccess={() => setStep(5)}
                                onError={(msg) => alert(msg)}
                            />
                        </div>
                    </motion.div>
                ) : step > 4 ? (
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col gap-3 relative z-20 h-32 justify-center">
                        <span className="text-sm font-medium text-white/80">Datos confirmados</span>
                    </div>
                ) : null}
            </div>

        </div>
    )
}

"use client"

import { useState, useRef } from "react"
import { UserPlus, ChevronDown, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { createEmployee } from "@/app/actions/admin"

export function CollapsibleEmployeeForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        const toastId = toast.loading("Creando cuenta...")
        
        try {
            const res = await createEmployee(formData)

            if (res?.error) {
                toast.error(res.error, { id: toastId })
            } else {
                toast.success("Empleado creado con éxito", { id: toastId })
                formRef.current?.reset()
                setIsOpen(false)
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado", { id: toastId })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl shadow-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <UserPlus className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Agregar Nuevo Empleado</h2>
                </div>
                <div className={`p-2 rounded-full bg-black/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-white/50" />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-2 border-t border-white/5">
                            <form ref={formRef} action={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white/80 uppercase tracking-wider pl-1">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            name="fullName" 
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary outline-none transition-colors"
                                            placeholder="Ej: Carlos Peluquero"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white/80 uppercase tracking-wider pl-1">Correo de Acceso</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary outline-none transition-colors"
                                            placeholder="ejemplo@barberia.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 max-w-sm">
                                    <label className="text-sm font-bold text-white/80 uppercase tracking-wider pl-1">Contraseña Temporal</label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        required
                                        minLength={6}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary outline-none transition-colors"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-primary hover:brightness-110 text-primary-foreground font-bold rounded-xl px-8 py-3.5 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                        {isSubmitting ? "Creando..." : "Crear Cuenta de Barbero"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

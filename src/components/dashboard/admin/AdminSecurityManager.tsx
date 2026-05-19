"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ShieldCheck, Mail, KeyRound, Loader2 } from "lucide-react"
import { updateEmployeeEmail, updateEmployeePassword } from "@/app/actions/admin"

export function AdminSecurityManager({ barberId, currentEmail }: { barberId: string, currentEmail: string }) {
    const [email, setEmail] = useState(currentEmail || "")
    const [password, setPassword] = useState("")
    
    const [savingEmail, setSavingEmail] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || email === currentEmail) return

        if (!window.confirm("¿Seguro que deseas cambiar el correo de acceso de este barbero? Tendrá que iniciar sesión con el nuevo correo.")) return

        setSavingEmail(true)
        const result = await updateEmployeeEmail(barberId, email)
        
        if (result.error) {
            toast.error("Fallo al actualizar correo", { description: result.error })
        } else {
            toast.success(result.message)
        }
        setSavingEmail(false)
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password || password.length < 6) {
            return toast.error("La contraseña debe tener al menos 6 caracteres")
        }

        if (!window.confirm("¿Forzar el cambio de contraseña para este barbero?")) return

        setSavingPassword(true)
        const result = await updateEmployeePassword(barberId, password)
        
        if (result.error) {
            toast.error("Fallo al actualizar contraseña", { description: result.error })
        } else {
            toast.success(result.message)
            setPassword("") // Limpiar el campo por seguridad
        }
        setSavingPassword(false)
    }

    return (
        <div className="space-y-6">
            <p className="text-sm text-white/50 mb-4">Solo tú (Administrador) tienes el poder de modificar los datos de acceso al sistema de este empleado.</p>
            
            {/* Formulario de Email */}
            <form onSubmit={handleUpdateEmail} className="bg-black/30 rounded-2xl p-4 border border-white/5 space-y-3">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Correo de Acceso
                </label>
                <div className="flex gap-2">
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1 p-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none transition-all text-white text-sm"
                    />
                    <button 
                        type="submit"
                        disabled={savingEmail || email === currentEmail}
                        className="bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
                    >
                        {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                    </button>
                </div>
            </form>

            {/* Formulario de Contraseña */}
            <form onSubmit={handleUpdatePassword} className="bg-black/30 rounded-2xl p-4 border border-red-500/10 hover:border-red-500/30 transition-colors space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-red-500/10 transition-colors" />
                
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 flex items-center gap-1.5 relative z-10">
                    <KeyRound className="w-3.5 h-3.5 text-red-400" /> Forzar Nueva Contraseña
                </label>
                <div className="flex gap-2 relative z-10">
                    <input 
                        type="text" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        className="flex-1 p-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-red-500 outline-none transition-all text-white text-sm placeholder:text-white/20"
                    />
                    <button 
                        type="submit"
                        disabled={savingPassword || password.length < 6}
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
                    >
                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                    </button>
                </div>
            </form>
        </div>
    )
}

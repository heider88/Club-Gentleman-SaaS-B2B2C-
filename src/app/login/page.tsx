"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Lock, Mail, UserPlus, LogIn } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)

    // Form States
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                toast.error("Error al iniciar sesión", { description: error.message })
            } else {
                toast.success("¡Bienvenido, Barbero!")
                router.push("/dashboard")
                router.refresh()
            }
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                // Puedes enviar metadata inicial si quisieras
                options: {
                    data: { full_name: "Nuevo Barbero" }
                }
            })
            if (error) {
                toast.error("Error al registrarse", { description: error.message })
            } else {
                toast.success("¡Cuenta creada!", { description: "Ahora inicia sesión con tu contraseña." })
                setIsLogin(true)
                setPassword("")
            }
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Club Gentleman</h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        {isLogin ? "Acceso exclusivo para profesionales." : "Suma tu arte a nuestro equipo."}
                    </p>
                </div>

                {/* Main Form Box */}
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Email Profesional</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3.5 pl-12 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder:text-white/20"
                                    placeholder="tunombre@barberia.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Contraseña secreta</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3.5 pl-12 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder:text-white/20"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--color-primary),0.3)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(var(--color-primary),0.5)] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isLogin ? (
                                <>Entrar al Dashboard <LogIn className="w-5 h-5" /></>
                            ) : (
                                <>Crear mi cuenta <UserPlus className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>
                </div>

                {/* Toggles */}
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white/50 hover:text-white transition-colors text-sm font-medium"
                    >
                        {isLogin ? "¿Nuevo barbero? Forma parte del equipo." : "¿Ya tienes cuenta? Inicia sesión aquí."}
                    </button>
                </div>

            </div>
        </div>
    )
}

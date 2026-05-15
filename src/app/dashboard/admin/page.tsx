import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { createEmployee } from "@/app/actions/admin"
import { UserPlus, ShieldAlert, Users } from "lucide-react"

export default async function AdminPage() {
    const supabase = await createClient()

    // 1. Doble verificación de seguridad en el Servidor (Además del middleware)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect("/dashboard")
    }

    // 2. Fetch de la lista de todos los empleados actuales (Solo el admin puede leer todo sin RLS si usamos adminClient, 
    // pero temporalmente lo leeremos normal porque el admin debería tener acceso a ver perfiles públicos).
    const { data: barbers } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'barber')

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    Panel de Administración <ShieldAlert className="text-primary w-8 h-8" />
                </h1>
                <p className="text-muted-foreground mt-2">
                    Zona de alto riesgo. Desde aquí puedes crear cuentas de acceso para nuevos barberos.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda: Formulario de Creación */}
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/20 rounded-xl">
                            <UserPlus className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nuevo Empleado</h2>
                    </div>

                    <form action={createEmployee} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Nombre Completo</label>
                            <input 
                                type="text" 
                                name="fullName" 
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                placeholder="Ej: Carlos Peluquero"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Correo de Acceso</label>
                            <input 
                                type="email" 
                                name="email" 
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                placeholder="ejemplo@barberia.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Contraseña Temporal</label>
                            <input 
                                type="password" 
                                name="password" 
                                required
                                minLength={6}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl p-4 mt-4 transition-all active:scale-95"
                        >
                            Crear Cuenta de Barbero
                        </button>
                    </form>
                </div>

                {/* Columna Derecha: Lista de Barberos Actuales */}
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Equipo Actual</h2>
                    </div>

                    {barbers && barbers.length > 0 ? (
                        <div className="space-y-3">
                            {barbers.map(barber => (
                                <div key={barber.id} className="p-4 bg-black/40 border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div>
                                        <p className="font-bold text-white">{barber.full_name || "Sin nombre"}</p>
                                        <p className="text-xs text-muted-foreground">{barber.email}</p>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/10 rounded-md text-white/70 w-fit">
                                        Barbero
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aún no has creado cuentas para tus empleados.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
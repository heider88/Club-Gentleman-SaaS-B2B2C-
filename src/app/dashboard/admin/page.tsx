import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldAlert, Users } from "lucide-react"
import { DeleteEmployeeButton } from "@/components/dashboard/DeleteEmployeeButton"
import { CollapsibleEmployeeForm } from "@/components/dashboard/admin/CollapsibleEmployeeForm"

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

    // 2. Fetch de la lista de todos los empleados actuales
    const { data: barbers } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'barber')
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
            <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    Panel de Administración <ShieldAlert className="text-primary w-8 h-8" />
                </h1>
                <p className="text-muted-foreground font-medium">
                    Zona de alto riesgo. Gestiona a tu equipo de barberos desde aquí.
                </p>
            </header>

            {/* Formulario Desplegable */}
            <CollapsibleEmployeeForm />

            {/* Lista de Barberos Actuales */}
            <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Equipo Actual ({barbers?.length || 0})</h2>
                </div>

                {barbers && barbers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {barbers.map(barber => (
                            <div key={barber.id} className="p-6 bg-black/40 border border-white/10 rounded-2xl flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors shadow-lg">
                                <div>
                                    <p className="font-bold text-white text-lg">{barber.full_name || "Sin nombre"}</p>
                                    <p className="text-sm text-muted-foreground">{barber.email}</p>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 bg-white/10 rounded-lg text-white/70 w-fit">
                                        Barbero
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <a href={`/dashboard/admin/barber/${barber.id}`} className="text-xs uppercase font-bold tracking-wider px-5 py-2.5 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl transition-all">
                                            Gestionar
                                        </a>
                                        <DeleteEmployeeButton userId={barber.id} userName={barber.full_name || "Empleado"} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-16 border border-dashed border-white/10 rounded-3xl bg-black/20">
                        Aún no has creado cuentas para tus empleados.
                    </p>
                )}
            </div>
        </div>
    )
}
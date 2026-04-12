"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, Scissors, Save, X, Ban, CheckCircle2 } from "lucide-react"

interface Service {
    id: string
    name: string
    duration_minutes: number
    price: number
    description: string
}

export default function ServicesPage() {
    const supabase = createClient()
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [currentService, setCurrentService] = useState<Partial<Service>>({
        name: "",
        duration_minutes: 30,
        price: 0,
        description: ""
    })

    useEffect(() => {
        fetchServices()
    }, [])

    async function fetchServices() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            setUserId(user.id)
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('barber_id', user.id)
                .order('created_at', { ascending: true })

            if (data) {
                setServices(data as Service[])
            }
        }
        setLoading(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setCurrentService(prev => ({
            ...prev,
            [name]: name === "price" || name === "duration_minutes" ? Number(value) : value
        }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) {
            toast.error("Debes iniciar sesión para guardar servicios.")
            setIsEditing(false)
            return
        }

        setSaving(true)

        if (currentService.id) {
            // Actualizar
            const { error } = await supabase
                .from('services')
                .update({
                    name: currentService.name as string,
                    duration_minutes: currentService.duration_minutes as number,
                    price: currentService.price as number,
                    description: currentService.description || null
                })
                .eq('id', currentService.id)

            if (error) {
                toast.error("Error al actualizar", { description: error.message })
            } else {
                toast.success("Servicio actualizado correctamente")
            }
        } else {
            // Crear
            const { error } = await supabase
                .from('services')
                .insert([{
                    barber_id: userId,
                    name: currentService.name as string,
                    duration_minutes: currentService.duration_minutes as number,
                    price: currentService.price as number,
                    description: currentService.description || null
                }])

            if (error) {
                toast.error("Error al crear servicio", { description: error.message })
            } else {
                toast.success("Nuevo servicio añadido a tu catálogo")
            }
        }

        setSaving(false)
        setIsEditing(false)
        fetchServices()
    }

    const handleDelete = async (serviceId: string) => {
        const isConfirmed = window.confirm("¿Seguro que deseas eliminar este servicio definitivamente?")
        if (!isConfirmed) return

        // Check if there are appointments attached to avoid orphan rendering errors, 
        // though our CASCADE or SET NULL on Appointments handles this at DB level, 
        // it's good UX to warn them!
        const { data: appointments, error: checkError } = await supabase
            .from('appointments')
            .select('id, status')
            .eq('service_id', serviceId)

        if (appointments && appointments.length > 0) {
            const activeAppointments = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed')
            if (activeAppointments.length > 0) {
                toast.warning(`Atención: Hay ${activeAppointments.length} cita(s) futura(s) agendada(s) con este servicio. Borrarlo podría confundir a tus clientes.`, {
                    action: {
                        label: 'Borrar de todos modos',
                        onClick: () => executeDelete(serviceId)
                    }
                })
                return
            }
        }

        await executeDelete(serviceId)
    }

    const executeDelete = async (serviceId: string) => {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', serviceId)

        if (error) {
            toast.error("No se pudo eliminar", { description: error.message })
        } else {
            toast.success("Servicio eliminado de tu catálogo")
            fetchServices()
        }
    }

    const startEdit = (service: Service) => {
        setCurrentService(service)
        setIsEditing(true)
    }

    const startCreate = () => {
        setCurrentService({ name: "", duration_minutes: 30, price: 0, description: "" })
        setIsEditing(true)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    if (loading) {
        return (
            <div className="p-8 text-center animate-pulse flex flex-col items-center justify-center space-y-4">
                <Scissors className="w-10 h-10 text-white/20 animate-spin" />
                <span className="text-white/50 font-medium">Afilando tijeras... (Cargando catálogo)</span>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Catálogo de Servicios</h1>
                    <p className="text-muted-foreground font-medium mt-1">Administra los cortes que ofreces, personaliza precios y sus tiempos asociados.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={startCreate}
                        className="bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--color-primary),0.5)] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Agregar Servicio
                    </button>
                )}
            </header>

            {isEditing ? (
                <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-10 animate-in fade-in zoom-in-95 shadow-2xl relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                    <h2 className="text-2xl font-bold border-b border-white/10 pb-4 mb-8 text-white flex items-center gap-3">
                        {currentService.id ? <><Edit2 className="w-6 h-6 text-primary" /> Editando Servicio</> : <><Plus className="w-6 h-6 text-primary" /> Crear Nuevo Servicio</>}
                    </h2>

                    <form onSubmit={handleSave} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Nombre del Servicio *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={currentService.name}
                                    onChange={handleChange}
                                    placeholder="Ej. Corte Clásico Elite"
                                    className="w-full p-4 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Precio Cobrado *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        min="0"
                                        step="1"
                                        value={currentService.price === 0 ? '' : currentService.price}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full p-4 pl-8 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 sm:col-span-2 md:col-span-1">
                                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Tiempo Asignado en Agenda *</label>
                                <select
                                    name="duration_minutes"
                                    required
                                    value={currentService.duration_minutes}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white font-medium appearance-none"
                                >
                                    <option value="15" className="bg-background">15 min (Arreglo rápido)</option>
                                    <option value="30" className="bg-background">30 min (Media Hora)</option>
                                    <option value="45" className="bg-background">45 min (Estándar)</option>
                                    <option value="60" className="bg-background">60 min (1 Hora)</option>
                                    <option value="90" className="bg-background">90 min (Corte + Barba + Spa)</option>
                                    <option value="120" className="bg-background">120 min (2 Horas Premium)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Descripción Breve (Opcional)</label>
                            <textarea
                                name="description"
                                value={currentService.description}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Incluye lavado, perfilado navaja y bebida de cortesía..."
                                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white resize-y"
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-white/10 mt-8">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-bold transition-all border border-transparent hover:border-white/10"
                            >
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-primary text-primary-foreground font-extrabold px-8 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(var(--color-primary),0.3)] disabled:opacity-50"
                            >
                                {saving ? <span className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Save className="w-5 h-5" />}
                                {saving ? "Guardando..." : "Guardar Servicio"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 border border-dashed border-white/20 rounded-3xl bg-black/20 backdrop-blur-sm group">
                            <Ban className="w-16 h-16 text-white/10 group-hover:text-primary/50 transition-colors duration-500 mb-4" />
                            <h3 className="text-xl font-bold text-white/80 mb-2">Vitrina Vacía</h3>
                            <p className="text-muted-foreground mb-6 text-center max-w-sm">No tienes ningún servicio ofrecido a tus clientes. ¡Impulsa tu barbería agregando el primero!</p>
                            <button
                                onClick={startCreate}
                                className="bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground font-bold px-6 py-2.5 rounded-full transition-all"
                            >
                                Agregar Catálogo
                            </button>
                        </div>
                    ) : (
                        services.map(service => (
                            <div key={service.id} className="bg-card border border-white/10 rounded-3xl p-6 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(var(--color-primary),0.1)] transition-all flex flex-col justify-between group h-full">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight">
                                            {service.name}
                                        </h3>
                                        <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-sm font-extrabold shrink-0">
                                            {formatCurrency(service.price)}
                                        </span>
                                    </div>
                                    <p className="text-white/50 text-sm mb-6 line-clamp-3 leading-relaxed">
                                        {service.description || "Un estilo impecable para tu día."}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-auto">
                                    <span className="text-xs font-bold text-white/40 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        {service.duration_minutes} min
                                    </span>
                                    <div className="flex gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(service)}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all hover:text-primary"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-destructive/20 text-white hover:text-destructive transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

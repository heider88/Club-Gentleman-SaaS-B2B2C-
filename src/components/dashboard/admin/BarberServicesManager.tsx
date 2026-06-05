"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Scissors, Trash2, Plus, Save, X, Download, Edit2 } from "lucide-react"
import { manageBarberService, importServicesToBarber } from "@/app/actions/admin"

interface Service {
    id: string
    name: string
    price: number
    duration_minutes: number
    description?: string | null
}

export function BarberServicesManager({ barberId, globalServices }: { barberId: string, globalServices: Service[] }) {
    const supabase = createClient()
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [newService, setNewService] = useState({ name: "", price: 0, duration_minutes: 30, description: "" })

    const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ name: "", price: 0, duration_minutes: 30 })

    // Estado del Modal de Importación
    const [showImportModal, setShowImportModal] = useState(false)
    const [selectedToImport, setSelectedToImport] = useState<string[]>([])
    const [isImporting, setIsImporting] = useState(false)

    useEffect(() => { 
        const fetchServices = async () => {
            setLoading(true)
            const { data } = await supabase
                .from('services')
                .select('id, name, price, duration_minutes')
                .eq('barber_id', barberId)
                .order('created_at', { ascending: false })
            
            if (data) setServices(data)
            setLoading(false)
        }
        fetchServices() 
    }, [barberId, supabase])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    const handleDelete = async (id: string) => {
        if(!window.confirm("¿Seguro que deseas eliminar este servicio de este barbero?")) return;

        const res = await manageBarberService('delete', { id })
        if(res?.error) {
            toast.error("Error al eliminar", { description: res.error })
        } else {
            toast.success("Servicio eliminado")
            setServices(services.filter(s => s.id !== id))
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            barber_id: barberId,
            name: newService.name,
            price: newService.price,
            duration_minutes: newService.duration_minutes,
            description: newService.description || null
        }

        const res = await manageBarberService('add', payload)

        if (res?.error) {
            toast.error("Error al añadir servicio", { description: res.error })
        } else if (res?.data) {
            toast.success("Servicio añadido al barbero")
            setServices([res.data, ...services])
            setIsCreating(false)
            setNewService({ name: "", price: 0, duration_minutes: 30, description: "" })
        }

        setSaving(false)
    }

    const startEditing = (service: Service) => {
        setEditingServiceId(service.id)
        setEditForm({ name: service.name, price: service.price, duration_minutes: service.duration_minutes })
    }

    const cancelEditing = () => {
        setEditingServiceId(null)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingServiceId) return
        setSaving(true)

        const payload = {
            id: editingServiceId,
            name: editForm.name,
            price: editForm.price,
            duration_minutes: editForm.duration_minutes
        }

        const res = await manageBarberService('update', payload)

        if (res?.error) {
            toast.error("Error al actualizar servicio", { description: res.error })
        } else if (res?.data) {
            toast.success("Servicio actualizado")
            setServices(services.map(s => s.id === editingServiceId ? res.data : s))
            setEditingServiceId(null)
        }

        setSaving(false)
    }

    const handleImport = async () => {
        if (selectedToImport.length === 0) return toast.warning("Selecciona al menos un servicio.")
        
        setIsImporting(true)
        const servicesDataToImport = globalServices.filter(gs => selectedToImport.includes(gs.id))

        const res = await importServicesToBarber(barberId, servicesDataToImport)

        if (res?.error) {
            toast.error("Error al importar", { description: res.error })
        } else if (res?.data) {
            toast.success(`${res.data.length} servicios importados`)
            setServices([...res.data, ...services])
            setShowImportModal(false)
            setSelectedToImport([])
        }
        
        setIsImporting(false)
    }

    const toggleImportSelection = (id: string) => {
        setSelectedToImport(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-xl" />

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <p className="text-white/60 text-sm w-full sm:w-auto">Servicios activos: {services.length}</p>
                <div className="flex gap-2 w-full sm:w-auto">
                    {!isCreating && globalServices.length > 0 && (
                        <button 
                            onClick={() => setShowImportModal(true)}
                            className="flex-1 sm:flex-none justify-center text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors border border-white/5"
                        >
                            <Download className="w-3 h-3" /> Importar Global
                        </button>
                    )}
                    {!isCreating && (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="flex-1 sm:flex-none justify-center text-xs bg-primary hover:brightness-110 text-primary-foreground font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-[0_0_10px_rgba(var(--color-primary),0.3)]"
                        >
                            <Plus className="w-3 h-3" /> Crear Único
                        </button>
                    )}
                </div>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="bg-black/50 border border-primary/30 p-4 rounded-xl space-y-3 mb-4">
                    <input 
                        type="text" required placeholder="Nombre (Ej. Corte Clásico)"
                        value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})}
                        className="w-full p-2 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary"
                    />
                    <textarea 
                        rows={2} placeholder="Descripción del servicio (Opcional)"
                        value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})}
                        className="w-full p-2 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary resize-y"
                    />
                    <div className="flex gap-2">
                        <input 
                            type="number" required placeholder="Precio $" min="0"
                            value={newService.price || ''} onChange={e => setNewService({...newService, price: Number(e.target.value)})}
                            className="w-1/2 p-2 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary"
                        />
                        <div className="relative w-1/2">
                            <input 
                                type="number"
                                min="5"
                                value={newService.duration_minutes || ''} 
                                onChange={e => setNewService({...newService, duration_minutes: Number(e.target.value)})}
                                placeholder="Minutos"
                                className="w-full p-2 pr-10 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-xs">min</span>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setIsCreating(false)} className="text-white/50 hover:text-white text-xs px-2"><X className="w-4 h-4"/></button>
                        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50 flex gap-1 items-center">
                            {saving ? 'Guardando...' : <><Save className="w-3 h-3"/> Guardar</>}
                        </button>
                    </div>
                </form>
            )}

            {/* Modal de Importación */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Download className="w-4 h-4 text-primary" /> Importar del Catálogo
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="text-white/40 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto space-y-2 flex-1">
                            {globalServices.length === 0 ? (
                                <p className="text-white/50 text-sm text-center py-4">No hay servicios globales creados. Ve a la pestaña &quot;Servicios&quot; como administrador para crear plantillas.</p>
                            ) : (
                                <>
                                    <div className="flex justify-end mb-2">
                                        <button 
                                            onClick={() => setSelectedToImport(globalServices.map(g => g.id))}
                                            className="text-xs text-primary hover:underline font-bold"
                                        >
                                            Seleccionar Todos
                                        </button>
                                    </div>
                                    {globalServices.map(gs => (
                                        <label key={gs.id} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedToImport.includes(gs.id)}
                                                onChange={() => toggleImportSelection(gs.id)}
                                                className="mt-1 w-4 h-4 rounded bg-black border-white/20 text-primary focus:ring-primary focus:ring-offset-0"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-white leading-none mb-1">{gs.name}</p>
                                                <p className="text-xs text-white/50">{formatCurrency(gs.price)} • {gs.duration_minutes} min</p>
                                            </div>
                                        </label>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-2">
                            <button 
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleImport}
                                disabled={isImporting || selectedToImport.length === 0}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground disabled:opacity-50 hover:brightness-110 flex items-center gap-2"
                            >
                                {isImporting ? <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : null}
                                Importar {selectedToImport.length > 0 ? `(${selectedToImport.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                {services.length === 0 && !isCreating ? (
                    <p className="text-white/40 text-sm text-center py-4">Este barbero no tiene servicios asignados.</p>
                ) : (
                    services.map(s => {
                        if (editingServiceId === s.id) {
                            return (
                                <form key={s.id} onSubmit={handleUpdate} className="bg-white/10 border border-primary/50 p-3 rounded-xl space-y-3">
                                    <input 
                                        type="text" required placeholder="Nombre (Ej. Corte Clásico)"
                                        value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full p-2 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary"
                                    />
                                    <textarea 
                                        rows={2} placeholder="Descripción del servicio (Opcional)"
                                        value={editData.description || ''} 
                                        onChange={e => setEditData({...editData, description: e.target.value})}
                                        className="w-full p-2 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary resize-y"
                                    />
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" required placeholder="Precio $" min="0"
                                            value={editForm.price || ''} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                                            className="w-1/2 p-2 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary"
                                        />
                                        <div className="relative w-1/2">
                                            <input 
                                                type="number"
                                                min="5"
                                                value={editForm.duration_minutes || ''} 
                                                onChange={e => setEditForm({...editForm, duration_minutes: Number(e.target.value)})}
                                                placeholder="Minutos"
                                                className="w-full p-2 pr-10 text-sm rounded bg-black/50 border border-white/10 text-white outline-none focus:border-primary"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-xs">min</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end pt-1">
                                        <button type="button" onClick={cancelEditing} className="text-white/50 hover:text-white text-xs px-2"><X className="w-4 h-4"/></button>
                                        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50 flex gap-1 items-center">
                                            {saving ? 'Guardando...' : <><Save className="w-3 h-3"/> Guardar</>}
                                        </button>
                                    </div>
                                </form>
                            )
                        }

                        return (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                                <div>
                                    <p className="text-white font-medium text-sm flex items-center gap-2">
                                        <Scissors className="w-3 h-3 text-primary" /> {s.name}
                                    </p>
                                    <p className="text-white/50 text-xs mt-0.5">{formatCurrency(s.price)} • {s.duration_minutes} min</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => startEditing(s)} className="p-2 text-white/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

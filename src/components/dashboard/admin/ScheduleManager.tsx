"use client"

import { useState } from "react"
import { Lock, Unlock, CalendarX2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createAvailabilityBlock, deleteAvailabilityBlock } from "@/app/actions/admin"

export function ScheduleManager({ barbers, existingBlocks }: { barbers: any[], existingBlocks: any[] }) {
    
    
    // Form State
    const [targetType, setTargetType] = useState<'global' | 'barber'>('global')
    const [selectedBarberId, setSelectedBarberId] = useState("")
    const [blockType, setBlockType] = useState<'full_day' | 'range'>('full_day')
    
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("18:00")
    const [reason, setReason] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleCreateBlock = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date) return toast.error("Selecciona una fecha.")
        if (targetType === 'barber' && !selectedBarberId) return toast.error("Selecciona un barbero.")
        
        setIsSaving(true)

        let startISO = ""
        let endISO = ""

        if (blockType === 'full_day') {
            startISO = new Date(`${date}T00:00:00`).toISOString()
            endISO = new Date(`${date}T23:59:59`).toISOString()
        } else {
            if (!startTime || !endTime) {
                setIsSaving(false)
                return toast.error("Faltan horas.")
            }
            startISO = new Date(`${date}T${startTime}:00`).toISOString()
            endISO = new Date(`${date}T${endTime}:00`).toISOString()
        }

        const payload = {
            barber_id: targetType === 'global' ? null : selectedBarberId,
            start_time: startISO,
            end_time: endISO,
            reason: reason || "No especificada",
            is_global: targetType === 'global'
        }

        const res = await createAvailabilityBlock(payload)
        
        setIsSaving(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Horario bloqueado exitosamente.")
            // Reset form
            setDate("")
            setReason("")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Desbloquear este horario?")) return
        const res = await deleteAvailabilityBlock(id)
        if (res.error) toast.error(res.error)
        else toast.success("Horario desbloqueado.")
    }

    return (
        <div className="space-y-12">
            {/* Formulario de Bloqueo */}
            <section className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 p-6 md:p-10 relative overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <Lock className="w-6 h-6 text-red-500" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest">Crear Bloqueo de Agenda</h2>
                </div>

                <form onSubmit={handleCreateBlock} className="space-y-8 relative z-10">
                    {/* 1. Objetivo del Bloqueo */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dash-text-soft">1. Alcance del Cierre</span>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className={`flex-1 border p-4 cursor-pointer transition-all duration-300 ${targetType === 'global' ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-transparent hover:border-white/30'}`}>
                                <input type="radio" name="target" value="global" className="hidden" checked={targetType === 'global'} onChange={() => setTargetType('global')} />
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className={`w-5 h-5 ${targetType === 'global' ? 'text-red-500' : 'text-white/40'}`} />
                                    <div>
                                        <div className={`font-oswald text-lg uppercase tracking-wide ${targetType === 'global' ? 'text-red-500' : 'text-white/60'}`}>Cierre Global</div>
                                        <div className="text-[10px] text-white/40 font-mono mt-1">Toda la barbería cerrada. Nadie puede agendar.</div>
                                    </div>
                                </div>
                            </label>

                            <label className={`flex-1 border p-4 cursor-pointer transition-all duration-300 ${targetType === 'barber' ? 'border-primary bg-primary/10' : 'border-white/10 bg-transparent hover:border-white/30'}`}>
                                <input type="radio" name="target" value="barber" className="hidden" checked={targetType === 'barber'} onChange={() => setTargetType('barber')} />
                                <div className="flex items-center gap-3">
                                    <Lock className={`w-5 h-5 ${targetType === 'barber' ? 'text-primary' : 'text-white/40'}`} />
                                    <div>
                                        <div className={`font-oswald text-lg uppercase tracking-wide ${targetType === 'barber' ? 'text-primary' : 'text-white/60'}`}>Bloqueo Individual</div>
                                        <div className="text-[10px] text-white/40 font-mono mt-1">Ausencia, permiso o almuerzo extra de un barbero.</div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {targetType === 'barber' && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                <select 
                                    required 
                                    value={selectedBarberId} 
                                    onChange={e => setSelectedBarberId(e.target.value)}
                                    className="w-full bg-black/60 border border-white/20 p-4 text-white font-oswald text-lg tracking-wide uppercase outline-none focus:border-primary transition-colors appearance-none"
                                >
                                    <option value="" disabled>Seleccione Profesional...</option>
                                    {barbers.map(b => (
                                        <option key={b.id} value={b.id}>{b.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 2. Fechas y Horas */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dash-text-soft">2. Rango de Tiempo</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-white/40 uppercase">Fecha Exacta</label>
                                <input 
                                    type="date" 
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-white/20 px-0 py-3 text-white font-oswald text-xl uppercase tracking-wider outline-none focus:border-red-500 transition-colors"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-white/40 uppercase">Tipo de Bloqueo</label>
                                <div className="flex gap-2 h-full">
                                    <button 
                                        type="button"
                                        onClick={() => setBlockType('full_day')}
                                        className={`flex-1 border-b-2 font-oswald uppercase tracking-widest transition-all ${blockType === 'full_day' ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                                    >
                                        Todo el Día
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setBlockType('range')}
                                        className={`flex-1 border-b-2 font-oswald uppercase tracking-widest transition-all ${blockType === 'range' ? 'border-primary text-primary bg-primary/5' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                                    >
                                        Rango de Horas
                                    </button>
                                </div>
                            </div>
                        </div>

                        {blockType === 'range' && (
                            <div className="grid grid-cols-2 gap-6 animate-in fade-in pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-white/40 uppercase">Desde (Hora)</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-white/20 px-0 py-3 text-white font-mono text-xl outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-white/40 uppercase">Hasta (Hora)</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-white/20 px-0 py-3 text-white font-mono text-xl outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Justificación y Guardado */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dash-text-soft">3. Justificación Interna</span>
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="w-full md:flex-1">
                                <input 
                                    type="text" 
                                    placeholder="Ej: Día Festivo, Permiso Médico, Calibración..."
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-white/20 px-0 py-3 text-white font-jakarta text-sm outline-none focus:border-white transition-colors placeholder:text-white/20"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full md:w-auto shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest px-10 py-4 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Aplicando...' : 'Aplicar Restricción'}
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            {/* Tabla de Bloqueos Activos */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <CalendarX2 className="w-6 h-6 text-dash-text" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest">Restricciones Activas</h2>
                </div>

                <div className="overflow-x-auto border border-dash-border bg-black/40 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    <table className="w-full text-left font-jakarta text-sm">
                        <thead>
                            <tr className="border-b border-dash-border bg-dash-bg">
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted">Fecha</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted">Alcance</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted">Razón</th>
                                <th className="p-4 font-bold uppercase tracking-[0.2em] text-[10px] text-dash-text-muted text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {existingBlocks.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-white/30 font-mono text-[10px] uppercase tracking-[0.2em]">
                                        No hay restricciones configuradas en el sistema.
                                    </td>
                                </tr>
                            ) : existingBlocks.map(block => {
                                const startDate = new Date(block.start_time)
                                const endDate = new Date(block.end_time)
                                const isFullDay = startDate.getHours() === 0 && endDate.getHours() === 23
                                
                                return (
                                    <tr key={block.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="font-oswald text-lg text-white uppercase tracking-wide">
                                                {format(startDate, "dd MMM yyyy", { locale: es })}
                                            </div>
                                            <div className="font-mono text-[10px] text-dash-text-soft mt-1">
                                                {isFullDay ? 'TODO EL DÍA' : `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {block.is_global ? (
                                                <span className="inline-block bg-red-500/10 border border-red-500/50 text-red-500 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em]">
                                                    CIERRE GLOBAL (TIENDA)
                                                </span>
                                            ) : (
                                                <span className="inline-block bg-primary/10 border border-primary/50 text-primary px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em]">
                                                    BLOQUEO: {block.profiles?.full_name?.split(' ')[0] || 'BARBERO'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-[11px] text-white/50 max-w-[200px] truncate">
                                            {block.reason || 'S/N'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(block.id)}
                                                className="inline-flex items-center gap-2 text-white/30 hover:text-red-500 transition-colors px-3 py-2 border border-transparent hover:border-red-500/30 bg-transparent hover:bg-red-500/10"
                                            >
                                                <Unlock className="w-4 h-4" />
                                                <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Desbloquear</span>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
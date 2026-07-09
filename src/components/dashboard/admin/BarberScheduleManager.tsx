"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { updateBarberProfile } from "@/app/actions/admin"

// Types for Schedule Settings JSONB
export interface ScheduleSettings {
    workDays: number[] // 0 = Domingo, 1 = Lunes...
    disabledSlots?: Record<number, string[]> | string[]
    startHour?: string | number
    endHour?: string | number
}

const DEFAULT_SCHEDULE: ScheduleSettings = {
    workDays: [1, 2, 3, 4, 5, 6],
    disabledSlots: {},
    startHour: "09:00",
    endHour: "19:00"
}

const DAYS = [
    { id: 1, label: 'Lunes' }, { id: 2, label: 'Martes' }, { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' }, { id: 5, label: 'Viernes' }, { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' }
]

function formatTimeInput(val?: string | number): string {
    if (!val) return "00:00";
    if (typeof val === 'string') return val;
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function parseTimeSetting(val?: string | number): { hours: number, minutes: number } {
    if (!val) return { hours: 0, minutes: 0 };
    if (typeof val === 'number') {
        const hours = Math.floor(val);
        const minutes = Math.round((val - hours) * 60);
        return { hours, minutes };
    }
    const [h, m] = val.split(':').map(Number);
    return { hours: h || 0, minutes: m || 0 };
}

export function BarberScheduleManager({ barberId, initialSettings }: { barberId: string, initialSettings: any }) {
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<number>(1) // Empieza en lunes
    
    // Parse the jsonb, fallback to default if missing or invalid
    const [settings, setSettings] = useState<ScheduleSettings>(() => {
        let parsed = { ...DEFAULT_SCHEDULE }
        if (initialSettings && typeof initialSettings === 'object' && Array.isArray(initialSettings.workDays)) {
            parsed = { ...DEFAULT_SCHEDULE, ...initialSettings }
            
            // Backward compatibility for disabledSlots
            if (Array.isArray(initialSettings.disabledSlots)) {
                // If it was the array we just deployed, convert to object for all working days
                const newDisabled: Record<number, string[]> = {}
                parsed.workDays.forEach((d: number) => {
                    newDisabled[d] = [...initialSettings.disabledSlots]
                })
                parsed.disabledSlots = newDisabled
            } else if (!parsed.disabledSlots) {
                parsed.disabledSlots = {}
            }
        }
        return parsed
    })

    const isWorkingDay = settings.workDays.includes(activeTab)

    const toggleWorkDay = () => {
        setSettings(prev => ({
            ...prev,
            workDays: prev.workDays.includes(activeTab) 
                ? prev.workDays.filter(d => d !== activeTab)
                : [...prev.workDays, activeTab].sort()
        }))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setSettings(prev => ({ ...prev, [name]: value }))
    }

    const toggleSlot = (slot: string) => {
        setSettings(prev => {
            const currentDisabled = (prev.disabledSlots as Record<number, string[]>)?.[activeTab] || [];
            const newDisabledSlots = { ...(prev.disabledSlots as Record<number, string[]>) }
            
            if (currentDisabled.includes(slot)) {
                newDisabledSlots[activeTab] = currentDisabled.filter(s => s !== slot)
            } else {
                newDisabledSlots[activeTab] = [...currentDisabled, slot]
            }
            
            return { ...prev, disabledSlots: newDisabledSlots }
        })
    }

    const handleSave = async () => {
        setSaving(true)
        
        const dataToSave = {
            workDays: settings.workDays,
            disabledSlots: settings.disabledSlots,
            startHour: settings.startHour,
            endHour: settings.endHour
        }
        
        const result = await updateBarberProfile(barberId, { schedule_settings: dataToSave })

        if (result.error) {
            toast.error("Error al guardar horario", { description: result.error })
        } else {
            toast.success("Horario del barbero actualizado")
        }
        setSaving(false)
    }

    // Generar los slots basados en el startHour y endHour generales
    const start = parseTimeSetting(settings.startHour)
    const end = parseTimeSetting(settings.endHour)
    
    const current = new Date()
    current.setHours(start.hours, start.minutes, 0, 0)
    const endTime = new Date()
    endTime.setHours(end.hours, end.minutes, 59, 999)

    const daySlots: string[] = []
    if (start.hours <= end.hours) {
        while (current <= endTime) {
            daySlots.push(`${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`)
            current.setMinutes(current.getMinutes() + 5)
        }
    }

    const currentDayDisabledSlots = (settings.disabledSlots as Record<number, string[]>)?.[activeTab] || []

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Hora Inicio General</label>
                    <input type="time" name="startHour" value={formatTimeInput(settings.startHour)} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Hora Fin General</label>
                    <input type="time" name="endHour" value={formatTimeInput(settings.endHour)} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary" />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Seleccionar Día</label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {DAYS.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setActiveTab(day.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === day.id ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--color-primary),0.3)]' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/10'}`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">¿Trabaja este día?</span>
                    <button 
                        onClick={toggleWorkDay}
                        className={`w-12 h-6 rounded-full transition-all relative ${isWorkingDay ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${isWorkingDay ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {isWorkingDay ? (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 flex items-center justify-between">
                            <span>Inhabilitar Horas Específicas</span>
                            <span className="text-white/30 text-[10px] normal-case font-normal">Verde = Disponible</span>
                        </label>
                        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {daySlots.map(slot => {
                                    const isEnabled = !currentDayDisabledSlots.includes(slot);
                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => toggleSlot(slot)}
                                            className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                isEnabled 
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/20 hover:bg-green-500/30' 
                                                    : 'bg-white/5 text-white/30 border border-white/10 line-through opacity-50 hover:opacity-100 hover:bg-white/10'
                                            }`}
                                        >
                                            {slot}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pt-4 border-t border-white/10 text-center py-8 text-white/30 text-sm">
                        El barbero no trabaja este día.
                    </div>
                )}
            </div>

            <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-50 mt-4"
            >
                {saving ? <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Horarios
            </button>
        </div>
    )
}

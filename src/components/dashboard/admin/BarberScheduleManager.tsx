"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { updateBarberProfile } from "@/app/actions/admin"

// Types for Schedule Settings JSONB
export interface ScheduleSettings {
    workDays: number[] // 0 = Domingo, 1 = Lunes...
    disabledSlots: string[]
    // Keeping optional fields for backward compatibility
    startHour?: string | number
    endHour?: string | number
    lunchStart?: string | number
    lunchEnd?: string | number
}

const DEFAULT_SCHEDULE: ScheduleSettings = {
    workDays: [1, 2, 3, 4, 5, 6],
    disabledSlots: [],
}

const DAYS = [
    { id: 1, label: 'Lun' }, { id: 2, label: 'Mar' }, { id: 3, label: 'Mié' },
    { id: 4, label: 'Jue' }, { id: 5, label: 'Vie' }, { id: 6, label: 'Sáb' },
    { id: 0, label: 'Dom' }
]

// Generar todos los intervalos de 15 minutos para las 24 horas
const ALL_SLOTS: string[] = []
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
        ALL_SLOTS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
}

export function BarberScheduleManager({ barberId, initialSettings }: { barberId: string, initialSettings: any }) {
    const [saving, setSaving] = useState(false)
    
    // Parse the jsonb, fallback to default if missing or invalid
    const [settings, setSettings] = useState<ScheduleSettings>(() => {
        if (initialSettings && typeof initialSettings === 'object' && Array.isArray(initialSettings.workDays)) {
            return {
                ...DEFAULT_SCHEDULE,
                ...initialSettings,
                disabledSlots: initialSettings.disabledSlots || []
            } as ScheduleSettings
        }
        return DEFAULT_SCHEDULE
    })

    const toggleDay = (dayId: number) => {
        setSettings(prev => ({
            ...prev,
            workDays: prev.workDays.includes(dayId) 
                ? prev.workDays.filter(d => d !== dayId)
                : [...prev.workDays, dayId].sort()
        }))
    }

    const toggleSlot = (slot: string) => {
        setSettings(prev => {
            const disabledSlots = prev.disabledSlots || [];
            return {
                ...prev,
                disabledSlots: disabledSlots.includes(slot)
                    ? disabledSlots.filter(s => s !== slot)
                    : [...disabledSlots, slot]
            }
        })
    }

    const handleSave = async () => {
        setSaving(true)
        
        // Remove legacy fields if we don't want them, but let's just keep them or omit them
        const dataToSave = {
            workDays: settings.workDays,
            disabledSlots: settings.disabledSlots
        }
        
        const result = await updateBarberProfile(barberId, { schedule_settings: dataToSave })

        if (result.error) {
            toast.error("Error al guardar horario", { description: result.error })
        } else {
            toast.success("Horario del barbero actualizado")
        }
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Días Laborales</label>
                <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => {
                        const isWorking = settings.workDays.includes(day.id)
                        return (
                            <button
                                key={day.id}
                                onClick={() => toggleDay(day.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isWorking ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--color-primary),0.3)]' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/10'}`}
                            >
                                {day.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 flex items-center justify-between">
                    <span>Horas Disponibles (15 min)</span>
                    <span className="text-white/30 text-[10px] normal-case font-normal">Click para inhabilitar</span>
                </label>
                <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {ALL_SLOTS.map(slot => {
                            const isEnabled = !(settings.disabledSlots || []).includes(slot);
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

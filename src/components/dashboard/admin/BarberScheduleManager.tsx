"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { updateBarberProfile } from "@/app/actions/admin"

import { formatTimeInput } from "@/lib/availability"

// Types for Schedule Settings JSONB
export interface ScheduleSettings {
    workDays: number[] // 0 = Domingo, 1 = Lunes...
    startHour: string | number
    endHour: string | number
    lunchStart: string | number
    lunchEnd: string | number
}

const DEFAULT_SCHEDULE: ScheduleSettings = {
    workDays: [1, 2, 3, 4, 5, 6],
    startHour: "09:00",
    endHour: "19:00",
    lunchStart: "13:00",
    lunchEnd: "14:00"
}

const DAYS = [
    { id: 1, label: 'Lun' }, { id: 2, label: 'Mar' }, { id: 3, label: 'Mié' },
    { id: 4, label: 'Jue' }, { id: 5, label: 'Vie' }, { id: 6, label: 'Sáb' },
    { id: 0, label: 'Dom' }
]

export function BarberScheduleManager({ barberId, initialSettings }: { barberId: string, initialSettings: any }) {
    const [saving, setSaving] = useState(false)
    
    // Parse the jsonb, fallback to default if missing or invalid
    const [settings, setSettings] = useState<ScheduleSettings>(() => {
        if (initialSettings && typeof initialSettings === 'object' && Array.isArray(initialSettings.workDays)) {
            return initialSettings as ScheduleSettings
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setSettings(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setSaving(true)
        
        const result = await updateBarberProfile(barberId, { schedule_settings: settings })

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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Hora Inicio</label>
                    <input type="time" name="startHour" value={formatTimeInput(settings.startHour)} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Hora Fin</label>
                    <input type="time" name="endHour" value={formatTimeInput(settings.endHour)} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 text-orange-400">Inicio Almuerzo</label>
                    <input type="time" name="lunchStart" value={formatTimeInput(settings.lunchStart)} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 text-orange-400">Fin Almuerzo</label>
                    <input type="time" name="lunchEnd" value={formatTimeInput(settings.lunchEnd)} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-primary" />
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

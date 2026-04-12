"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { ScheduleSettings } from "@/lib/availability"

const DAYS = [
    { id: 1, label: "Lunes", short: "Lun" },
    { id: 2, label: "Martes", short: "Mar" },
    { id: 3, label: "Miércoles", short: "Mié" },
    { id: 4, label: "Jueves", short: "Jue" },
    { id: 5, label: "Viernes", short: "Vie" },
    { id: 6, label: "Sábado", short: "Sáb" },
    { id: 0, label: "Domingo", short: "Dom" },
]

export default function SchedulePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [schedule, setSchedule] = useState<ScheduleSettings>({
        startHour: 9,
        endHour: 19,
        lunchStart: 13,
        lunchEnd: 14,
        workDays: [1, 2, 3, 4, 5, 6]
    })

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)
                const { data, error } = await supabase
                    .from('profiles')
                    .select('schedule_settings')
                    .eq('id', user.id)
                    .single()

                if (data && data.schedule_settings) {
                    setSchedule(data.schedule_settings as ScheduleSettings)
                }
            } else {
                // Si no hay usuario autenticado (modo dev), se queda con los valores por defecto
                console.log("No user session. Using default schedule.")
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    const toggleDay = (dayId: number) => {
        setSchedule(prev => {
            const isSelected = prev.workDays.includes(dayId)
            const newDays = isSelected
                ? prev.workDays.filter(d => d !== dayId)
                : [...prev.workDays, dayId].sort()
            return { ...prev, workDays: newDays }
        })
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target
        setSchedule(prev => ({
            ...prev,
            [name]: parseInt(value, 10)
        }))
    }

    const handleSave = async () => {
        if (!userId) {
            alert("Atención: Modo demo, configuración no guardada en base de datos.")
            return
        }

        setSaving(true)
        const { error } = await supabase
            .from('profiles')
            .update({ schedule_settings: schedule })
            .eq('id', userId)

        if (error) {
            alert("Error guardando horario: " + error.message)
        } else {
            alert("¡Horario guardado exitosamente!")
        }
        setSaving(false)
    }

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground">Cargando horario...</div>
    }

    // Helper para generar opciones de Select de 0 a 23
    const hourOptions = Array.from({ length: 24 }, (_, i) => (
        <option key={i} value={i}>
            {i.toString().padStart(2, '0')}:00
        </option>
    ))

    return (
        <div className="max-w-3xl space-y-8">
            <header>
                <h1 className="text-2xl font-bold">Disponibilidad y Horarios</h1>
                <p className="text-muted-foreground">Configura los días que trabajas y tu hora de almuerzo.</p>
            </header>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-8">

                {/* Días Laborables */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b border-border pb-2">Días Laborables</h2>
                    <p className="text-sm text-muted-foreground">Selecciona los días en los que atiendes clientes.</p>
                    <div className="flex flex-wrap gap-3">
                        {DAYS.map(day => {
                            const active = schedule.workDays.includes(day.id)
                            return (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${active
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-surface border-border border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Horario de Atención */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b border-border pb-2">Horario General</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold block">Hora de Apertura</label>
                            <select
                                name="startHour"
                                value={schedule.startHour}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                            >
                                {hourOptions}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold block">Hora de Cierre</label>
                            <select
                                name="endHour"
                                value={schedule.endHour}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                            >
                                {hourOptions}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Horario de Almuerzo */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b border-border pb-2">Descanso / Almuerzo</h2>
                    <p className="text-sm text-muted-foreground">Durante este periodo no se permitirán reservas.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold block">Inicio del Descanso</label>
                            <select
                                name="lunchStart"
                                value={schedule.lunchStart}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                            >
                                {hourOptions}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold block">Fin del Descanso</label>
                            <select
                                name="lunchEnd"
                                value={schedule.lunchEnd}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                            >
                                {hourOptions}
                            </select>
                        </div>
                    </div>
                </section>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin text-xl">⚪</span>
                                Guardando...
                            </>
                        ) : (
                            "Guardar Horario"
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}

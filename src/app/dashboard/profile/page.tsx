"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { toast } from "sonner"
import { Camera, Save, Clock, CalendarDays, Phone } from "lucide-react"

type ScheduleSettings = {
    workDays: number[];
    startHour: number;
    endHour: number;
    lunchStart: number;
    lunchEnd: number;
}

const DEFAULT_SCHEDULE: ScheduleSettings = {
    workDays: [1, 2, 3, 4, 5, 6],
    startHour: 9,
    endHour: 19,
    lunchStart: 13,
    lunchEnd: 14
}

const DAYS_MAP = [
    { label: "Domingo", value: 0 },
    { label: "Lunes", value: 1 },
    { label: "Martes", value: 2 },
    { label: "Miércoles", value: 3 },
    { label: "Jueves", value: 4 },
    { label: "Viernes", value: 5 },
    { label: "Sábado", value: 6 },
]

export default function ProfilePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const [profile, setProfile] = useState({
        full_name: "",
        bio: "",
        phone: "",
        avatar_url: ""
    })

    const [schedule, setSchedule] = useState<ScheduleSettings>(DEFAULT_SCHEDULE)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, bio, phone, avatar_url, schedule_settings')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile({
                        full_name: data.full_name || "",
                        bio: data.bio || "",
                        phone: data.phone || "",
                        avatar_url: data.avatar_url || ""
                    })

                    if (data.schedule_settings) {
                        setSchedule(data.schedule_settings as ScheduleSettings)
                    }
                }
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setProfile(prev => ({ ...prev, [name]: value }))
    }

    const toggleWorkDay = (dayValue: number) => {
        setSchedule(prev => {
            const isSelected = prev.workDays.includes(dayValue)
            const newDays = isSelected
                ? prev.workDays.filter(d => d !== dayValue)
                : [...prev.workDays, dayValue]
            return { ...prev, workDays: newDays }
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        if (!userId) {
            toast.error("Debes iniciar sesión primero.")
            return
        }

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Math.random()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        setUploading(true)

        try {
            // Nota: Debemos tener un bucket public "avatars" configurado en Supabase
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const publicUrl = data.publicUrl
            setProfile(prev => ({ ...prev, avatar_url: publicUrl }))

            await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId)

            toast.success("Foto de perfil actualizada correctamente")
        } catch (error: any) {
            toast.error("Error al subir foto", { description: error.message })
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!userId) return

        setSaving(true)
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: profile.full_name,
                bio: profile.bio,
                phone: profile.phone,
                schedule_settings: schedule as any // Supabase inferred TS expects valid json
            })
            .eq('id', userId)

        if (error) {
            toast.error("Error al guardar", { description: error.message })
        } else {
            toast.success("Perfil y configuración guardados existosamente")
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="p-8 text-center animate-pulse flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/10" />
                <span className="text-white/50">Cargando la vitrina de tu perfil...</span>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Configuración de Perfil
                </h1>
                <p className="text-muted-foreground font-medium">
                    Personaliza cómo te verán tus clientes y cuáles son tus franjas laborales.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Visual Settings - Left Column */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
                        <div className="relative w-40 h-40 rounded-full overflow-hidden bg-black/50 border-4 border-white/5 shadow-2xl">
                            {profile.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-5xl">
                                    🧑‍🎤
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                    <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-white">Tu Fotografía</h3>
                            <p className="text-xs text-white/50 px-2 leading-relaxed">
                                Un avatar profesional aumenta tus ventas al dar confianza.
                            </p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-full transition-all border border-white/10 w-full justify-center"
                        >
                            <Camera className="w-4 h-4" /> {uploading ? "Cargando..." : "Cambiar Foto"}
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-extrabold px-6 py-4 rounded-2xl hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(var(--color-primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-primary),0.5)]"
                    >
                        {saving ? (
                            <span className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        ) : (
                            <><Save className="w-5 h-5" /> Guardar Todos los Cambios</>
                        )}
                    </button>
                </div>

                {/* Form Settings - Right Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Public Data */}
                    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-6 shadow-xl">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">1</span>
                            Información Pública
                        </h2>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 block">Alias o Nombre de Artista</label>
                            <input
                                type="text"
                                name="full_name"
                                value={profile.full_name}
                                onChange={handleTextChange}
                                placeholder="Ej: Heider - Maestro de Fades"
                                className="w-full p-3.5 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder:text-white/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 flex items-center gap-1 block">
                                <Phone className="w-3.5 h-3.5" /> Número de Contacto
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleTextChange}
                                placeholder="+57 300 000 0000"
                                className="w-full p-3.5 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none transition-all text-white placeholder:text-white/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 block">Biografía y Trayectoria</label>
                            <textarea
                                name="bio"
                                value={profile.bio}
                                onChange={handleTextChange}
                                rows={3}
                                placeholder="Escribe un resumen de tu estilo, años de experiencia y qué te apasiona..."
                                className="w-full p-3.5 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none transition-all text-white placeholder:text-white/20 resize-y"
                            />
                        </div>
                    </div>

                    {/* Schedule Engine JSONB */}
                    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-8 shadow-xl">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"><Clock className="w-4 h-4" /></span>
                            Horarios de Atención
                        </h2>

                        {/* Work Days Picker */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1 block flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" /> Días Laborables
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_MAP.map(day => {
                                    const isSelected = schedule.workDays.includes(day.value)
                                    return (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleWorkDay(day.value)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)]'
                                                    : 'bg-black/50 text-white/50 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Hours grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            {/* General Shift */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white/80 border-l-2 border-primary pl-2">Jornada General</h4>

                                <div className="space-y-1">
                                    <label className="text-xs text-white/50">Apertura (Hora Militar)</label>
                                    <input
                                        type="number" min="0" max="23"
                                        value={schedule.startHour}
                                        onChange={(e) => setSchedule(p => ({ ...p, startHour: parseInt(e.target.value) || 0 }))}
                                        className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/50">Cierre (Hora Militar)</label>
                                    <input
                                        type="number" min="0" max="23"
                                        value={schedule.endHour}
                                        onChange={(e) => setSchedule(p => ({ ...p, endHour: parseInt(e.target.value) || 0 }))}
                                        className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono"
                                    />
                                </div>
                            </div>

                            {/* Lunch Break */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white/80 border-l-2 border-orange-500 pl-2">Descanso / Almuerzo</h4>

                                <div className="space-y-1">
                                    <label className="text-xs text-white/50">Inicio (Hora Militar)</label>
                                    <input
                                        type="number" min="0" max="23"
                                        value={schedule.lunchStart}
                                        onChange={(e) => setSchedule(p => ({ ...p, lunchStart: parseInt(e.target.value) || 0 }))}
                                        className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/50">Fin (Hora Militar)</label>
                                    <input
                                        type="number" min="0" max="23"
                                        value={schedule.lunchEnd}
                                        onChange={(e) => setSchedule(p => ({ ...p, lunchEnd: parseInt(e.target.value) || 0 }))}
                                        className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

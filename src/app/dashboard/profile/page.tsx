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
                phone: profile.phone
                // Nota: schedule_settings eliminado porque solo el Admin puede actualizar horarios
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
            <header className="flex flex-col gap-2 border-b border-zinc-800 pb-8">
                <h1 className="font-oswald text-4xl md:text-5xl font-medium tracking-tight text-white uppercase">
                    Configuración de Perfil
                </h1>
                <p className="text-zinc-500 font-jakarta text-sm uppercase tracking-widest font-bold">
                    Personaliza cómo te verán tus clientes y cuáles son tus franjas laborales.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Visual Settings - Left Column */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-black border border-zinc-800 p-8 flex flex-col items-center text-center space-y-6">
                        <div className="relative w-40 h-40 overflow-hidden bg-zinc-900 border border-zinc-700">
                            {profile.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    fill
                                    className="object-cover grayscale"
                                    unoptimized
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-5xl grayscale opacity-50">
                                    🧑‍🎤
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                    <span className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-oswald text-xl uppercase tracking-wide text-white">Tu Fotografía</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-relaxed px-2">
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
                            className="flex items-center gap-2 bg-transparent hover:bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-bold px-5 py-3 transition-all border border-zinc-700 w-full justify-center"
                        >
                            <Camera className="w-4 h-4" /> {uploading ? "Cargando..." : "Cambiar Foto"}
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-bold px-6 py-4 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] text-xs uppercase tracking-widest"
                    >
                        {saving ? (
                            <span className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-black animate-spin" />
                        ) : (
                            <><Save className="w-4 h-4" /> Guardar Todos los Cambios</>
                        )}
                    </button>
                </div>

                {/* Form Settings - Right Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Public Data */}
                    <div className="bg-black border border-zinc-800 p-8 space-y-8">
                        <h2 className="font-oswald text-2xl uppercase tracking-wide flex items-center gap-3 text-white border-b border-zinc-800 pb-4">
                            <span className="w-8 h-8 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm">1</span>
                            Información Pública
                        </h2>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Alias o Nombre de Artista</label>
                            <input
                                type="text"
                                name="full_name"
                                value={profile.full_name}
                                onChange={handleTextChange}
                                placeholder="Ej: Heider - Maestro de Fades"
                                className="w-full p-4 bg-zinc-950 border border-zinc-800 focus:border-white focus:ring-0 outline-none transition-all text-white placeholder:text-zinc-700 text-sm font-jakarta"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 block">
                                <Phone className="w-3.5 h-3.5" /> Número de Contacto
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleTextChange}
                                placeholder="+57 300 000 0000"
                                className="w-full p-4 bg-zinc-950 border border-zinc-800 focus:border-white focus:ring-0 outline-none transition-all text-white placeholder:text-zinc-700 text-sm font-jakarta"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Biografía y Trayectoria</label>
                            <textarea
                                name="bio"
                                value={profile.bio}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="Escribe un resumen de tu estilo, años de experiencia y qué te apasiona..."
                                className="w-full p-4 bg-zinc-950 border border-zinc-800 focus:border-white focus:ring-0 outline-none transition-all text-white placeholder:text-zinc-700 text-sm font-jakarta resize-none"
                            />
                        </div>
                    </div>

                    {/* Schedule Engine JSONB (Solo Lectura) */}
                    <div className="bg-black border border-zinc-800 p-8 space-y-8 opacity-60">
                        <h2 className="font-oswald text-2xl uppercase tracking-wide flex items-center gap-3 text-white border-b border-zinc-800 pb-4">
                            <span className="w-8 h-8 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm"><Clock className="w-4 h-4" /></span>
                            Horarios (Solo Lectura)
                        </h2>

                        {/* Work Days Picker */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 block">
                                <CalendarDays className="w-4 h-4" /> Días Laborables
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_MAP.map(day => {
                                    const isSelected = schedule.workDays.includes(day.value)
                                    return (
                                        <div
                                            key={day.value}
                                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-default ${isSelected
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-black text-zinc-600 border-zinc-800'
                                                }`}
                                        >
                                            {day.label}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Hours grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-800">
                            {/* General Shift */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 border-l-2 border-white pl-3">Jornada General</h4>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Apertura (Hora Militar)</label>
                                    <input
                                        type="number" readOnly
                                        value={schedule.startHour}
                                        className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-500 font-oswald text-lg cursor-not-allowed outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Cierre (Hora Militar)</label>
                                    <input
                                        type="number" readOnly
                                        value={schedule.endHour}
                                        className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-500 font-oswald text-lg cursor-not-allowed outline-none"
                                    />
                                </div>
                            </div>

                            {/* Lunch Break */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 border-l-2 border-zinc-600 pl-3">Descanso / Almuerzo</h4>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Inicio (Hora Militar)</label>
                                    <input
                                        type="number" readOnly
                                        value={schedule.lunchStart}
                                        className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-500 font-oswald text-lg cursor-not-allowed outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Fin (Hora Militar)</label>
                                    <input
                                        type="number" readOnly
                                        value={schedule.lunchEnd}
                                        className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-500 font-oswald text-lg cursor-not-allowed outline-none"
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

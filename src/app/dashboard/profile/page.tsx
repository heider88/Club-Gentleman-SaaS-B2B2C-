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

    const [role, setRole] = useState<'admin' | 'barber'>('barber')
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
                    .select('full_name, bio, phone, avatar_url, schedule_settings, role')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setRole(data.role || 'barber')
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
        
        const updateData: any = {
            full_name: profile.full_name,
            bio: profile.bio,
            phone: profile.phone
        }

        if (role === 'admin') {
            updateData.schedule_settings = schedule
        }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
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
                <div className="w-16 h-16 rounded-full bg-dash-text/10" />
                <span className="text-dash-text/50">Cargando la vitrina de tu perfil...</span>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="flex flex-col gap-2 border-b border-dash-border pb-8">
                <h1 className="font-oswald text-4xl md:text-5xl font-medium tracking-tight text-dash-text uppercase">
                    Configuración de Perfil
                </h1>
                <p className="text-dash-text-muted font-jakarta text-sm uppercase tracking-widest font-bold">
                    Personaliza cómo te verán tus clientes y cuáles son tus franjas laborales.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Visual Settings - Left Column */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-dash-panel border border-dash-border p-8 flex flex-col items-center text-center space-y-6">
                        <div className="relative w-40 h-40 overflow-hidden bg-dash-panel-alt border border-dash-border-alt">
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
                                <div className="absolute inset-0 bg-dash-panel/80 flex items-center justify-center">
                                    <span className="w-8 h-8 rounded-full border-2 border-dash-border-alt border-t-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-oswald text-xl uppercase tracking-wide text-dash-text">Tu Fotografía</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-dash-text-muted leading-relaxed px-2">
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
                            className="flex items-center gap-2 bg-transparent hover:bg-dash-panel-alt text-dash-text text-[10px] uppercase tracking-widest font-bold px-5 py-3 transition-all border border-dash-border-alt w-full justify-center"
                        >
                            <Camera className="w-4 h-4" /> {uploading ? "Cargando..." : "Cambiar Foto"}
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-dash-text text-dash-bg hover:opacity-80 font-bold px-6 py-4 transition-all shadow-xl text-xs uppercase tracking-widest"
                    >
                        {saving ? (
                            <span className="w-5 h-5 rounded-full border-2 border-dash-border-alt border-t-dash-bg animate-spin" />
                        ) : (
                            <><Save className="w-4 h-4" /> Guardar Todos los Cambios</>
                        )}
                    </button>
                </div>

                {/* Form Settings - Right Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Public Data */}
                    <div className="bg-dash-panel border border-dash-border p-8 space-y-8">
                        <h2 className="font-oswald text-2xl uppercase tracking-wide flex items-center gap-3 text-dash-text border-b border-dash-border pb-4">
                            <span className="w-8 h-8 bg-dash-panel-alt border border-dash-border-alt flex items-center justify-center text-sm">1</span>
                            Información Pública
                        </h2>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-dash-text-muted uppercase tracking-widest block">Alias o Nombre de Artista</label>
                            <input
                                type="text"
                                name="full_name"
                                value={profile.full_name}
                                onChange={handleTextChange}
                                placeholder="Ej: Heider - Maestro de Fades"
                                className="w-full p-4 bg-dash-bg border border-dash-border focus:border-dash-border-alt focus:ring-0 outline-none transition-all text-dash-text placeholder:text-dash-text-soft text-sm font-jakarta"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-dash-text-muted uppercase tracking-widest flex items-center gap-2 block">
                                <Phone className="w-3.5 h-3.5" /> Número de Contacto
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleTextChange}
                                placeholder="+57 300 000 0000"
                                className="w-full p-4 bg-dash-bg border border-dash-border focus:border-dash-border-alt focus:ring-0 outline-none transition-all text-dash-text placeholder:text-dash-text-soft text-sm font-jakarta"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-dash-text-muted uppercase tracking-widest block">Biografía y Trayectoria</label>
                            <textarea
                                name="bio"
                                value={profile.bio}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="Escribe un resumen de tu estilo, años de experiencia y qué te apasiona..."
                                className="w-full p-4 bg-dash-bg border border-dash-border focus:border-dash-border-alt focus:ring-0 outline-none transition-all text-dash-text placeholder:text-dash-text-soft text-sm font-jakarta resize-none"
                            />
                        </div>
                    </div>

                    {/* Schedule Engine JSONB (Solo Admin) */}
                    {role === 'admin' && (
                        <div className="bg-dash-panel border border-dash-border p-8 space-y-8 relative overflow-hidden group hover:border-dash-border-alt transition-colors">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-dash-text/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            
                            <h2 className="font-oswald text-2xl uppercase tracking-wide flex items-center gap-3 text-dash-text border-b border-dash-border pb-4">
                                <span className="w-8 h-8 bg-dash-panel-alt border border-dash-border-alt flex items-center justify-center text-sm"><Clock className="w-4 h-4" /></span>
                                Horarios Generales de la Tienda
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-dash-text-soft leading-relaxed">
                                Estos horarios se aplicarán a toda la barbería y determinarán qué días y a qué horas los clientes pueden reservar citas con los colaboradores.
                            </p>

                            {/* Work Days Picker */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-dash-text-muted uppercase tracking-widest flex items-center gap-2 block">
                                    <CalendarDays className="w-4 h-4" /> Días de Operación
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_MAP.map(day => {
                                        const isSelected = schedule.workDays.includes(day.value)
                                        return (
                                            <button
                                                key={day.value}
                                                onClick={() => toggleWorkDay(day.value)}
                                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${isSelected
                                                        ? 'bg-dash-text text-dash-bg border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                                        : 'bg-dash-panel text-dash-text-muted border-dash-border hover:border-dash-border-alt hover:text-dash-text-soft'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Hours grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-dash-border">
                                {/* General Shift */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-dash-text-soft border-l-2 border-white pl-3">Jornada General</h4>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-dash-text-muted uppercase tracking-widest font-bold">Apertura (Hora Militar)</label>
                                        <input
                                            type="number" 
                                            min="0" max="23"
                                            value={schedule.startHour}
                                            onChange={e => setSchedule(s => ({ ...s, startHour: parseInt(e.target.value) || 0 }))}
                                            className="w-full p-3 bg-dash-bg border border-dash-border text-dash-text font-oswald text-lg outline-none focus:border-white/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-dash-text-muted uppercase tracking-widest font-bold">Cierre (Hora Militar)</label>
                                        <input
                                            type="number"
                                            min="1" max="24"
                                            value={schedule.endHour}
                                            onChange={e => setSchedule(s => ({ ...s, endHour: parseInt(e.target.value) || 0 }))}
                                            className="w-full p-3 bg-dash-bg border border-dash-border text-dash-text font-oswald text-lg outline-none focus:border-white/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Lunch Break */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 border-l-2 border-red-500/50 pl-3">Descanso de Barberos</h4>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-dash-text-muted uppercase tracking-widest font-bold">Inicio Almuerzo (Hora)</label>
                                        <input
                                            type="number"
                                            min="0" max="23"
                                            value={schedule.lunchStart}
                                            onChange={e => setSchedule(s => ({ ...s, lunchStart: parseInt(e.target.value) || 0 }))}
                                            className="w-full p-3 bg-dash-bg border border-dash-border focus:border-red-500/50 text-dash-text font-oswald text-lg outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-dash-text-muted uppercase tracking-widest font-bold">Fin Almuerzo (Hora)</label>
                                        <input
                                            type="number"
                                            min="1" max="24"
                                            value={schedule.lunchEnd}
                                            onChange={e => setSchedule(s => ({ ...s, lunchEnd: parseInt(e.target.value) || 0 }))}
                                            className="w-full p-3 bg-dash-bg border border-dash-border focus:border-red-500/50 text-dash-text font-oswald text-lg outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

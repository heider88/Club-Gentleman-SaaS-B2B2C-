"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { updateBarberProfile } from "@/app/actions/admin"

export function BarberBasicInfoForm({ 
    barberId, 
    initialName, 
    initialBio, 
    initialPhone 
}: { 
    barberId: string, 
    initialName: string | null, 
    initialBio: string | null,
    initialPhone: string | null 
}) {
    const [name, setName] = useState(initialName || "")
    const [bio, setBio] = useState(initialBio || "")
    const [phone, setPhone] = useState(initialPhone || "")
    const [saving, setSaving] = useState(false)

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const result = await updateBarberProfile(barberId, { full_name: name, bio, phone })

        if (result.error) {
            toast.error("Error al actualizar la información", { description: result.error })
        } else {
            toast.success("Información actualizada correctamente")
        }

        setSaving(false)
    }

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Nombre Completo</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none transition-all text-white font-medium"
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Teléfono</label>
                <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none transition-all text-white font-medium"
                    placeholder="Ej. +57 300 000 0000"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Biografía / Especialidad</label>
                <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary outline-none transition-all text-white font-medium resize-y"
                    placeholder="Especialista en degradados y diseño de barba..."
                />
            </div>

            <button 
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-50"
            >
                {saving ? <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Información
            </button>
        </form>
    )
}

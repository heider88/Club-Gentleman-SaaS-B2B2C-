"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { Scissors } from "lucide-react"

export default function BarbersList() {
    const supabase = createClient()
    const [barbers, setBarbers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchBarbers() {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, bio, avatar_url')
                .order('created_at', { ascending: true })

            if (data && data.length > 0) {
                // Remove those who haven't set their full_name, to keep landing page polished.
                // Or you can show all. Let's filter if they have full_name at least.
                const validMembers = data.filter(b => b.full_name && b.full_name.trim().length > 0)
                setBarbers(validMembers.length > 0 ? validMembers : data) // Fallback Si todos son nuevos
            }
            setLoading(false)
        }
        fetchBarbers()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-pulse flex gap-2 items-center text-white/50 font-bold text-sm">
                    <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Buscando Artistas...
                </div>
            </div>
        )
    }

    if (barbers.length === 0) {
        return null
    }

    return (
        <section id="equipo" className="w-full pt-16">
            <div className="flex items-center gap-3 mb-10">
                <Scissors className="w-8 h-8 text-primary drop-shadow-md" />
                <h2 className="text-3xl font-black text-white uppercase tracking-wider">El Equipo</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {barbers.map(barber => (
                    <div key={barber.id} className="bg-black/20 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center group hover:border-primary/40 hover:bg-black/40 transition-all duration-500">
                        {/* Avatar Wrapper with glow effect */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110 group-hover:bg-primary/40 transition-all duration-500"></div>
                            <div className="relative w-36 h-36 rounded-full overflow-hidden border-[4px] border-black shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10 group-hover:scale-105 group-hover:border-primary/50 transition-all duration-500">
                                {barber.avatar_url ? (
                                    <Image
                                        src={barber.avatar_url}
                                        alt={barber.full_name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-stone-800 to-stone-600 flex items-center justify-center text-5xl">
                                        🧑‍🎤
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-primary transition-colors">
                            {barber.full_name}
                        </h3>

                        <p className="text-sm text-white/60 leading-relaxed font-medium">
                            {barber.bio || "Artista residente en el club, listo para elevar tu estilo al máximo nivel. Reserva con este experto hoy mismo."}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}

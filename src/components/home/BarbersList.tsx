"use client"

import Image from "next/image"
import { Scissors } from "lucide-react"

interface BarbersListProps {
    barbers: any[]
}

export default function BarbersList({ barbers }: BarbersListProps) {
    const validMembers = barbers.filter(b => b.full_name && b.full_name.trim().length > 0)
    const displayBarbers = validMembers.length > 0 ? validMembers : barbers;

    if (displayBarbers.length === 0) {
        return null
    }

    return (
        <section id="equipo" className="w-full pt-16">
            <div className="flex items-center gap-3 mb-10">
                <Scissors className="w-8 h-8 text-primary drop-shadow-md" />
                <h2 className="text-3xl font-black text-white uppercase tracking-wider">El Equipo</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayBarbers.map(barber => (
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

                        <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-primary transition-colors">
                            {barber.full_name}
                        </h3>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
                            {barber.specialty || "Barbero"}
                        </p>

                        <p className="text-sm text-white/60 leading-relaxed font-medium">
                            {barber.bio || "Artista residente en el club, listo para elevar tu estilo al máximo nivel. Reserva con este experto hoy mismo."}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}

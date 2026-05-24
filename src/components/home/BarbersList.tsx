"use client"

import Image from "next/image"

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
        <section id="equipo" className="w-full pt-20 relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="mb-16 relative">
                <span className="absolute -top-16 -left-10 text-[140px] text-white/[0.03] font-oswald select-none pointer-events-none tracking-tighter hidden md:block">TEAM</span>
                <h2 className="text-3xl md:text-5xl font-black text-white/90 uppercase tracking-widest relative z-10">El Equipo</h2>
                <div className="w-20 h-1 bg-[#6D3294] mt-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {displayBarbers.map((barber, index) => (
                    <div 
                        key={barber.id} 
                        className="group relative overflow-hidden bg-black/60 border border-white/[0.05] border-t-white/[0.1] h-[500px] flex flex-col justify-end p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-white/20 animate-in fade-in slide-in-from-bottom-12"
                        style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                    >
                        {/* Background Image (Grayscale to Color) */}
                        <div className="absolute inset-0 z-0">
                            {barber.avatar_url ? (
                                <Image
                                    src={barber.avatar_url}
                                    alt={barber.full_name}
                                    fill
                                    className="object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-stone-900 to-stone-800 flex items-center justify-center text-8xl opacity-50">
                                    🧑‍🎤
                                </div>
                            )}
                            {/* Overlay Gradient for Text Legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                            <p className="text-pink-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                                {barber.specialty || "Especialista"}
                            </p>
                            <h3 className="text-4xl font-oswald font-black text-white uppercase tracking-wide leading-none mb-4 group-hover:text-white transition-colors">
                                {barber.full_name}
                            </h3>

                            <div className="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                                <p className="text-sm text-white/70 leading-relaxed font-medium mt-2 border-l-2 border-[#6D3294] pl-4">
                                    {barber.bio || "Artista residente en el club, listo para elevar tu estilo al máximo nivel. Reserva con este experto hoy mismo."}
                                </p>
                            </div>
                        </div>
                        
                        {/* Abstract numbering */}
                        <div className="absolute top-6 right-6 font-oswald font-black text-white/20 text-4xl group-hover:text-white/40 transition-colors z-10 select-none">
                            {(index + 1).toString().padStart(2, '0')}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

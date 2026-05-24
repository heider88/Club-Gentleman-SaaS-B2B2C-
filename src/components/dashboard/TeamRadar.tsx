"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Clock, CheckCircle2 } from "lucide-react"

type BarberMember = {
    id: string;
    name: string;
    avatarUrl: string | null;
    isAvailable: boolean;
    statusText: string;
}

export function TeamRadar({ currentUserId }: { currentUserId: string }) {
    const supabase = createClient()
    const [team, setTeam] = useState<BarberMember[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTeamRadar() {
            setLoading(true)
            const now = new Date()
            
            // 1. Obtener todos los barberos (excluyendo al actual para no verse a sí mismo)
            const { data: barbers } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('role', 'barber')
                .neq('id', currentUserId)

            if (!barbers) {
                setLoading(false)
                return
            }

            // 2. Obtener las citas de hoy de esos barberos para ver si están ocupados
            const todayStart = new Date(now.setHours(0,0,0,0)).toISOString()
            const todayEnd = new Date(now.setHours(23,59,59,999)).toISOString()
            const currentTime = new Date()

            const { data: appointments } = await supabase
                .from('appointments')
                .select('barber_id, start_time, end_time')
                .gte('start_time', todayStart)
                .lte('start_time', todayEnd)
                .in('status', ['pending', 'confirmed'])

            // 3. Mapear estado
            const mappedTeam = barbers.map(barber => {
                // Filtrar citas del barbero que pasen por la hora actual
                const barberAppts = appointments?.filter(a => a.barber_id === barber.id) || []
                
                let isAvailable = true
                let statusText = "Disponible ahora"

                const currentAppt = barberAppts.find(a => {
                    const start = new Date(a.start_time)
                    const end = new Date(a.end_time)
                    return currentTime >= start && currentTime < end
                })

                if (currentAppt) {
                    isAvailable = false
                    const endTime = new Date(currentAppt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    statusText = `Ocupado hasta ${endTime}`
                } else {
                    // Buscar la próxima cita
                    const nextAppt = barberAppts
                        .filter(a => new Date(a.start_time) > currentTime)
                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

                    if (nextAppt) {
                        const startTime = new Date(nextAppt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        statusText = `Libre hasta ${startTime}`
                    }
                }

                return {
                    id: barber.id,
                    name: barber.full_name?.split(' ')[0] || 'Barbero',
                    avatarUrl: barber.avatar_url,
                    isAvailable,
                    statusText
                }
            })

            setTeam(mappedTeam)
            setLoading(false)
        }

        fetchTeamRadar()
        
        // Refresh every 5 minutes
        const interval = setInterval(fetchTeamRadar, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [currentUserId, supabase])

    if (loading || team.length === 0) return null

    return (
        <section className="mb-8 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-4 bg-zinc-600"></div>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Radar del Equipo</h2>
            </div>
            
            {/* Scroll Horizontal para móviles */}
            <div className="flex overflow-x-auto pb-2 gap-4 scrollbar-hide snap-x">
                {team.map(member => (
                    <div key={member.id} className="snap-start min-w-[200px] bg-black border border-zinc-800 p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl relative shrink-0 overflow-hidden">
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover grayscale" />
                            ) : (
                                <span className="grayscale opacity-50">🧔🏻‍♂️</span>
                            )}
                            {/* Indicador de estado flotante */}
                            <span className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-black ${member.isAvailable ? 'bg-white' : 'bg-zinc-600'}`} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold font-oswald uppercase tracking-widest text-zinc-200 truncate">{member.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`text-[10px] uppercase font-bold tracking-wider truncate ${member.isAvailable ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                    {member.statusText}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
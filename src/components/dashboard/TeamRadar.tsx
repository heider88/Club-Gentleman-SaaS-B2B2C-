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
                .in('status', ['pending', 'in_progress'])

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
        <section className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">Radar del Equipo</h2>
            </div>
            
            {/* Scroll Horizontal para móviles */}
            <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide snap-x">
                {team.map(member => (
                    <div key={member.id} className="snap-start min-w-[220px] bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl p-3 flex items-center gap-3 shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl relative shrink-0 overflow-hidden">
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>🧔🏻‍♂️</span>
                            )}
                            {/* Indicador de estado flotante */}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${member.isAvailable ? 'bg-green-500' : 'bg-orange-500'}`} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate">{member.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                {member.isAvailable ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Clock className="w-3 h-3 text-orange-400" />}
                                <span className={`text-xs truncate ${member.isAvailable ? 'text-green-400/80' : 'text-orange-400/80'}`}>
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
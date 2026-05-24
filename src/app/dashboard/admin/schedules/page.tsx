import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CalendarClock } from "lucide-react"
import { ScheduleManager } from "@/components/dashboard/admin/ScheduleManager"

export default async function SchedulesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect("/dashboard")
    }

    // Fetch active barbers
    const { data: barbers } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'barber')
        .order('full_name', { ascending: true })

    // Fetch future availability blocks
    const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('id, barber_id, start_time, end_time, reason, is_global, profiles(full_name)')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })

    return (
        <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-2 border-dash-text pb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-dash-text/10 border border-dash-text/30 text-dash-text text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase flex items-center gap-2">
                            <CalendarClock className="w-3 h-3" /> Master Control
                        </span>
                    </div>
                    <h1 className="font-oswald text-5xl md:text-6xl font-black text-dash-text uppercase tracking-tighter leading-none">
                        Control de<br/><span className="text-dash-text-muted">Horarios</span>
                    </h1>
                </div>
            </header>

            <ScheduleManager barbers={barbers || []} existingBlocks={blocks || []} />
        </div>
    )
}

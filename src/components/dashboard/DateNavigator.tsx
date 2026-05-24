"use client"

import { format, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function DateNavigator({ currentDate }: { currentDate: Date }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handlePrevDay = () => {
        const newDate = subDays(currentDate, 1)
        navigateToDate(newDate)
    }

    const handleNextDay = () => {
        const newDate = addDays(currentDate, 1)
        navigateToDate(newDate)
    }

    const handleToday = () => {
        navigateToDate(new Date())
    }

    const navigateToDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', dateStr)
        router.push(`/dashboard?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2 bg-dash-panel border border-dash-border rounded-xl p-1 shadow-sm">
            <button 
                onClick={handlePrevDay}
                className="p-2 text-dash-text-soft hover:text-dash-text hover:bg-white/5 rounded-lg transition-colors"
                title="Día Anterior"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
                onClick={handleToday}
                className="px-4 py-2 text-sm font-bold uppercase tracking-widest text-dash-text hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
            >
                <CalendarIcon className="w-4 h-4 text-dash-text-muted" />
                Hoy
            </button>
            <button 
                onClick={handleNextDay}
                className="p-2 text-dash-text-soft hover:text-dash-text hover:bg-white/5 rounded-lg transition-colors"
                title="Día Siguiente"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    )
}

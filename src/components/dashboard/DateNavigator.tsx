"use client"

import { format, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"

export function DateNavigator({ currentDate }: { currentDate: Date }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const handlePrevDay = () => {
        const newDate = subDays(currentDate, 1)
        navigateToDate(newDate)
    }

    const handleNextDay = () => {
        const newDate = addDays(currentDate, 1)
        navigateToDate(newDate)
    }

    const navigateToDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', dateStr)
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    return (
        <div className="flex items-center bg-dash-panel border border-dash-border rounded-xl p-1 shadow-sm w-fit">
            <button 
                onClick={handlePrevDay}
                disabled={isPending}
                className="p-2 text-dash-text-soft hover:text-dash-text hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                title="Día Anterior"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className={`px-4 py-2 flex items-center justify-center gap-2 min-w-[240px] transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                {isPending ? (
                    <Loader2 className="w-4 h-4 text-dash-text animate-spin" />
                ) : (
                    <CalendarDays className="w-4 h-4 text-dash-text-muted" />
                )}
                <span className="text-sm font-bold uppercase tracking-widest text-dash-text">
                    {format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </span>
            </div>

            <button 
                onClick={handleNextDay}
                disabled={isPending}
                className="p-2 text-dash-text-soft hover:text-dash-text hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                title="Día Siguiente"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    )
}

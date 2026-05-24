"use client"

import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"

export function DateNavigator({ currentDateStr }: { currentDateStr: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    
    const view = searchParams.get('view') || 'daily'

    // Usar la fecha del string ajustando el offset local para evitar desfasajes de zona horaria
    const [year, month, day] = currentDateStr.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);

    const handlePrevDay = () => {
        let newDate = currentDate;
        if (view === 'weekly') newDate = subWeeks(currentDate, 1)
        else if (view === 'monthly') newDate = subMonths(currentDate, 1)
        else newDate = subDays(currentDate, 1)
        navigateToDate(newDate)
    }

    const handleNextDay = () => {
        let newDate = currentDate;
        if (view === 'weekly') newDate = addWeeks(currentDate, 1)
        else if (view === 'monthly') newDate = addMonths(currentDate, 1)
        else newDate = addDays(currentDate, 1)
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

    // Calcular el label a mostrar
    let displayLabel = format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
    if (view === 'weekly') {
        const d = new Date(currentDate);
        const dayNum = d.getDay();
        const diff = d.getDate() - dayNum + (dayNum === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        if (monday.getMonth() === sunday.getMonth()) {
            displayLabel = `${format(monday, 'd')} - ${format(sunday, "d 'de' MMMM yyyy", { locale: es })}`;
        } else {
            displayLabel = `${format(monday, "d 'de' MMM", { locale: es })} - ${format(sunday, "d 'de' MMM yyyy", { locale: es })}`;
        }
    } else if (view === 'monthly') {
        displayLabel = format(currentDate, "MMMM yyyy", { locale: es });
    }

    return (
        <div className="flex items-center bg-dash-panel border border-dash-border rounded-xl p-1 shadow-sm w-fit">
            <button 
                onClick={handlePrevDay}
                disabled={isPending}
                className="p-2 text-dash-text-soft hover:text-dash-text hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                title="Atrás"
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
                    {displayLabel}
                </span>
            </div>

            <button 
                onClick={handleNextDay}
                disabled={isPending}
                className="p-2 text-dash-text-soft hover:text-dash-text hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                title="Adelante"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    )
}

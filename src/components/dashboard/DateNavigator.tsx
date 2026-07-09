"use client"

import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition, useRef } from "react"

export function DateNavigator({ currentDateStr }: { currentDateStr: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const dateInputRef = useRef<HTMLInputElement>(null)
    
    const view = searchParams.get('view') || 'daily'

    // Usar la fecha del string ajustando el offset local para evitar desfasajes de zona horaria
    const [year, month, day] = currentDateStr.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);

    const handlePrevDay = () => {
        let newDate = currentDate;
        if (view === 'weekly') {
            // Ir exactamente 7 días atrás para mantener la consistencia de la semana
            newDate = subDays(currentDate, 7);
        } else if (view === 'monthly') {
            // Ir exactamente al primer día del mes anterior para evitar saltos raros
            newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        } else {
            newDate = subDays(currentDate, 1);
        }
        navigateToDate(newDate)
    }

    const handleNextDay = () => {
        let newDate = currentDate;
        if (view === 'weekly') {
            // Ir exactamente 7 días adelante
            newDate = addDays(currentDate, 7);
        } else if (view === 'monthly') {
            // Ir exactamente al primer día del siguiente mes
            newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        } else {
            newDate = addDays(currentDate, 1);
        }
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

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const [y, m, d] = e.target.value.split('-').map(Number);
        navigateToDate(new Date(y, m - 1, d));
    }

    return (
        <div className="flex items-center bg-dash-panel border border-dash-border rounded-xl p-1 shadow-sm w-fit relative">
            <button 
                onClick={handlePrevDay}
                disabled={isPending}
                className="p-2 text-dash-text-soft hover:text-dash-text hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                title="Atrás"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button 
                onClick={() => {
                    if (dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
                        try { dateInputRef.current.showPicker(); } catch (e) {}
                    }
                }}
                disabled={isPending}
                className={`relative px-4 py-2 flex items-center justify-center gap-2 min-w-[240px] transition-opacity cursor-pointer hover:bg-white/5 rounded-lg group ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
            >
                {/* Input de tipo fecha (nativo) invisible superpuesto */}
                <input 
                    ref={dateInputRef}
                    type="date" 
                    value={currentDateStr}
                    onChange={handleDateChange}
                    className="absolute w-0 h-0 opacity-0 overflow-hidden"
                    style={{ border: 'none', padding: 0, margin: 0 }}
                />
                
                {isPending ? (
                    <Loader2 className="w-4 h-4 text-dash-text animate-spin" />
                ) : (
                    <CalendarDays className="w-4 h-4 text-dash-text-muted group-hover:text-primary transition-colors" />
                )}
                <span className="text-sm font-bold uppercase tracking-widest text-dash-text group-hover:text-primary transition-colors">
                    {displayLabel}
                </span>
            </button>

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

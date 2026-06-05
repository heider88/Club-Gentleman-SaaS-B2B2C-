"use client"

type Barber = {
    id: string;
    name: string;
    color: string;
}

export const CompactHeader = ({ 
    allBarbers, 
    selectedBarbers, 
    toggleBarber, 
    view, 
    setView 
}: {
    allBarbers: Barber[];
    selectedBarbers: string[];
    toggleBarber: (id: string) => void;
    view: string;
    setView: (v: string) => void;
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-dash-panel border-b border-dash-border p-3 sticky top-0 z-40">
            {/* Selector de vista */}
            <div className="flex w-full sm:w-auto bg-black/40 border border-dash-border/50 rounded-lg overflow-hidden shrink-0">
                {['daily', 'weekly'].map(v => (
                    <button 
                        key={v} 
                        onClick={() => setView(v)} 
                        className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-[10px] md:text-xs font-bold uppercase transition-colors ${view === v ? 'bg-dash-text text-black' : 'text-dash-text-soft hover:bg-white/5'}`}
                    >
                        {v === 'daily' ? 'Día' : 'Semana'}
                    </button>
                ))}
            </div>

            {/* Filtros de Equipo (Radio o Checkbox visual según la vista) */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 py-1 items-center justify-start sm:justify-end w-full">
                {allBarbers.map(barber => {
                    const isSelected = selectedBarbers.includes(barber.id);
                    return (
                        <button 
                            key={barber.id} 
                            onClick={() => toggleBarber(barber.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shrink-0 ${isSelected ? 'bg-white/10 border-dash-text text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]' : 'bg-transparent border-dash-border text-dash-text-muted hover:border-dash-border-alt'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${barber.color} ${isSelected ? 'shadow-[0_0_8px_currentColor]' : 'opacity-50'}`} />
                            <span className="text-xs font-medium tracking-wide">{barber.name.split(' ')[0]}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

"use client"

type Barber = {
    id: string;
    name: string;
    color: string;
}

export const CompactHeader = ({ 
    totalAppointments, 
    pendingCount, 
    allBarbers, 
    selectedBarbers, 
    toggleBarber, 
    view, 
    setView 
}: {
    totalAppointments: number;
    pendingCount: number;
    allBarbers: Barber[];
    selectedBarbers: string[];
    toggleBarber: (id: string) => void;
    view: string;
    setView: (v: string) => void;
}) => {
    return (
        <div className="flex flex-col gap-3 bg-dash-panel border-b border-dash-border p-3 sticky top-0 z-40">
            {/* Fila 1: Título, Contadores y Selector de Vista */}
            <div className="flex justify-between items-center">
                <div className="flex items-baseline gap-3">
                    <h2 className="font-oswald text-lg md:text-xl text-dash-text uppercase tracking-tight leading-none">Agenda</h2>
                    <div className="flex gap-2">
                        <span className="text-[10px] font-mono text-dash-text-muted">{totalAppointments} Total</span>
                        {pendingCount > 0 && <span className="text-[10px] font-mono text-green-500">{pendingCount} Pts</span>}
                    </div>
                </div>

                {/* Selector de vista minimizado */}
                <div className="flex bg-black/40 border border-dash-border/50 rounded-lg overflow-hidden shrink-0">
                    {['daily', 'weekly', 'monthly'].map(v => (
                        <button 
                            key={v} 
                            onClick={() => setView(v)} 
                            className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold uppercase transition-colors ${view === v ? 'bg-dash-text text-black' : 'text-dash-text-soft hover:bg-white/5'}`}
                        >
                            {v === 'daily' ? 'Día' : v === 'weekly' ? 'Sem' : 'Mes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fila 2: Filtros de Equipo (Scroll Horizontal, sin fotos) */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                {allBarbers.map(barber => {
                    const isSelected = selectedBarbers.includes(barber.id);
                    return (
                        <button 
                            key={barber.id} 
                            onClick={() => toggleBarber(barber.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shrink-0 ${isSelected ? 'bg-white/10 border-dash-text text-white' : 'bg-transparent border-dash-border text-dash-text-muted'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${barber.color}`} />
                            <span className="text-xs font-medium tracking-wide">{barber.name.split(' ')[0]}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

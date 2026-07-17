"use client"
import { useState, useEffect } from "react"
import { Search, Phone, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Customer = {
    phone: string;
    name: string;
    totalCuts: number;
    lastVisit: string;
}

export function CustomersList({ barberId, isAdmin = false }: { barberId?: string, isAdmin?: boolean }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchCustomers() {
            setLoading(true)
            
            let query = supabase
                .from('appointments')
                .select('customer_name, customer_phone, start_time')
                .eq('status', 'completed')
                .order('start_time', { ascending: false });
                
            if (!isAdmin && barberId) {
                query = query.eq('barber_id', barberId);
            }

            const { data, error } = await query;

            if (!error && data) {
                // Agrupar por teléfono o nombre
                const map = new Map<string, Customer>()
                
                data.forEach(appt => {
                    const key = appt.customer_phone && appt.customer_phone !== "N/A" 
                        ? appt.customer_phone 
                        : appt.customer_name

                    if (!map.has(key)) {
                        map.set(key, {
                            phone: appt.customer_phone || "N/A",
                            name: appt.customer_name,
                            totalCuts: 1,
                            lastVisit: new Date(appt.start_time).toLocaleDateString()
                        })
                    } else {
                        const existing = map.get(key)!
                        existing.totalCuts += 1
                        map.set(key, existing)
                    }
                })

                setCustomers(Array.from(map.values()))
            }
            setLoading(false)
        }
        
        fetchCustomers()
    }, [barberId, isAdmin, supabase])

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm)
    )

    return (
        <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
            {/* Header Industrial Editorial */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-2 border-dash-text pb-6">
                <div className="flex-1">
                    <h1 className="font-oswald text-6xl md:text-7xl font-black text-dash-text uppercase tracking-tighter leading-none">
                        {isAdmin ? 'Directorio' : 'Dossier'}<br/><span className="text-dash-text-muted">Clientes</span>
                    </h1>
                </div>
                
                {/* Search Bar Minimalista/Afilada */}
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-dash-text-muted group-focus-within:text-dash-text transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o celular..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-dash-border-alt text-sm font-jakarta font-medium text-dash-text placeholder:text-dash-text-muted focus:outline-none focus:border-dash-text transition-all"
                    />
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="w-16 h-16 bg-dash-text animate-pulse relative">
                        <div className="absolute inset-0 bg-dash-bg mix-blend-difference animate-ping"></div>
                    </div>
                    <span className="font-oswald text-dash-text-muted uppercase tracking-[0.3em] text-xs font-bold">Recopilando Datos</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="relative overflow-hidden flex flex-col items-center justify-center py-32 bg-dash-panel border border-dash-border group">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] md:text-[300px] font-black font-oswald text-dash-bg/50 select-none pointer-events-none transition-transform group-hover:scale-105 duration-700">00</span>
                    <h3 className="font-oswald text-3xl md:text-4xl text-dash-text uppercase tracking-widest relative z-10">Base de Datos Vacía</h3>
                    <p className="text-dash-text-soft font-jakarta mt-2 relative z-10 text-center max-w-sm">No se encontraron registros de clientes completados en tu historial.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-0 md:gap-2 w-full max-w-[100vw] overflow-hidden">
                    {/* Encabezado de la lista (Desktop) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b-2 border-dash-border text-[10px] font-bold uppercase tracking-[0.2em] text-dash-text-muted">
                        <div className="col-span-4">Cliente</div>
                        <div className="col-span-3">Contacto</div>
                        <div className="col-span-2 text-center">Última Visita</div>
                        <div className="col-span-1 text-center">Cortes</div>
                        <div className="col-span-2 text-right">Acciones</div>
                    </div>

                    {filtered.map((customer, i) => (
                        <div 
                            key={i} 
                            className="group relative bg-transparent border-b border-dash-border/50 hover:bg-dash-panel/30 transition-all duration-300 p-5 md:px-6 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-4 items-start md:items-center transform-gpu will-change-transform animate-in fade-in slide-in-from-bottom-2 md:slide-in-from-bottom-4 overflow-hidden w-full"
                            style={{ 
                                animationDelay: `${Math.min(i * 20, 300)}ms`, // Cap delay to avoid excessive waiting on long lists
                                animationFillMode: 'both' 
                            }}
                        >
                            {/* Hover accent line (Solo Desktop) */}
                            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                            {/* Watermark Numérica */}
                            <span className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-[100px] md:text-[80px] font-oswald font-black text-dash-text/[0.03] group-hover:text-dash-text/[0.05] leading-none select-none pointer-events-none transition-colors duration-500 z-0">
                                {customer.totalCuts.toString().padStart(2, '0')}
                            </span>

                            {/* Fila superior Móvil / Columna Cliente Desktop */}
                            <div className="md:col-span-4 w-full relative z-10 flex justify-between items-start md:block">
                                <div>
                                    <span className="md:hidden text-[8px] uppercase font-bold tracking-[0.2em] text-dash-text-muted block mb-0.5">Cliente</span>
                                    <h3 className="font-oswald text-xl md:text-2xl font-medium text-dash-text tracking-wide uppercase leading-tight group-hover:text-primary transition-colors">
                                        {customer.name}
                                    </h3>
                                </div>
                                {/* Cortes Totales Móvil */}
                                <div className="md:hidden text-right">
                                    <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-dash-text-muted block mb-0.5">Cortes</span>
                                    <span className="font-oswald text-xl text-dash-text leading-none">{customer.totalCuts}</span>
                                </div>
                            </div>

                            {/* Contacto & Última Visita Móvil agrupados / Columnas Desktop */}
                            <div className="w-full flex md:contents gap-4 relative z-10">
                                {/* Contacto */}
                                <div className="md:col-span-3 flex-1 md:w-full">
                                    <span className="md:hidden text-[8px] uppercase font-bold tracking-[0.2em] text-dash-text-muted block mb-0.5">Contacto</span>
                                    {customer.phone !== "N/A" ? (
                                        <div className="font-mono text-sm md:text-sm text-dash-text font-medium tracking-wide">
                                            {customer.phone}
                                        </div>
                                    ) : (
                                        <span className="font-jakarta text-xs text-dash-text-muted italic">No registrado</span>
                                    )}
                                </div>

                                {/* Última Visita */}
                                <div className="md:col-span-2 flex-1 md:w-full md:text-center text-right md:text-left">
                                    <span className="md:hidden text-[8px] uppercase font-bold tracking-[0.2em] text-dash-text-muted block mb-0.5">Última Visita</span>
                                    <span className="font-mono text-xs text-dash-text-soft">
                                        {customer.lastVisit}
                                    </span>
                                </div>
                            </div>

                            {/* Cortes Totales Desktop */}
                            <div className="hidden md:block md:col-span-1 w-full md:text-center relative z-10">
                                <span className="font-oswald text-2xl text-dash-text leading-none group-hover:text-primary transition-colors">
                                    {customer.totalCuts}
                                </span>
                            </div>

                            {/* Acciones */}
                            <div className="md:col-span-2 w-full md:text-right relative z-10 mt-2 md:mt-0">
                                {customer.phone !== "N/A" ? (
                                    <div className="flex gap-2 md:justify-end w-full">
                                        <a href={`https://wa.me/${customer.phone.replace('+', '')}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-0 px-4 py-3 md:w-10 md:h-10 md:p-0 bg-dash-panel-alt hover:bg-dash-text hover:text-black text-dash-text transition-colors rounded-sm text-[10px] font-bold uppercase tracking-widest active:scale-95 transform-gpu" title="WhatsApp">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> <span className="md:hidden">WhatsApp</span>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="md:text-right w-full">
                                        <span className="inline-block w-full md:w-auto text-center border border-dash-border-alt bg-dash-panel/50 px-4 py-2.5 md:py-1 text-[9px] font-bold uppercase tracking-widest text-dash-text-muted">Contacto Inaccesible</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

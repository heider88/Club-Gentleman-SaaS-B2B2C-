"use client"
import { useState, useEffect } from "react"
import { Search, Phone, MessageCircle, Scissors, Users } from "lucide-react"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-dash-border border border-dash-border">
                    {filtered.map((customer, i) => (
                        <div 
                            key={i} 
                            className="group relative bg-dash-bg hover:bg-dash-panel transition-all duration-500 overflow-hidden p-6 md:p-8 flex flex-col min-h-[240px] animate-in fade-in slide-in-from-bottom-8"
                            style={{ 
                                animationDelay: `${i * 50}ms`,
                                animationFillMode: 'both' 
                            }}
                        >
                            {/* Watermark Gigante */}
                            <span className="absolute -bottom-6 -right-6 text-[160px] font-oswald font-black text-dash-text/[0.02] group-hover:text-dash-text/[0.05] leading-none select-none pointer-events-none transition-colors duration-500 z-0">
                                {customer.totalCuts.toString().padStart(2, '0')}
                            </span>
                            
                            {/* Top info */}
                            <div className="flex justify-between items-start relative z-10 mb-8">
                                <div className="pr-4">
                                    <h3 className="font-oswald text-2xl md:text-3xl font-medium text-dash-text tracking-wide uppercase leading-tight group-hover:text-primary transition-colors">
                                        {customer.name}
                                    </h3>
                                    <p className="font-jakarta text-xs text-dash-text-soft mt-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-dash-text-muted/50 group-hover:bg-primary transition-colors"></span>
                                        Última Visita: <span className="text-dash-text font-medium">{customer.lastVisit}</span>
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-dash-text-muted block mb-1">Cortes</span>
                                    <span className="font-oswald text-3xl text-dash-text leading-none group-hover:text-primary transition-colors">{customer.totalCuts}</span>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="relative z-10 mt-auto pt-4 border-t border-dash-border/30 flex items-center justify-between">
                                {customer.phone !== "N/A" ? (
                                    <>
                                        <div className="font-jakarta text-sm text-dash-text font-medium tracking-wide">
                                            {customer.phone}
                                        </div>
                                        <div className="flex gap-1 md:opacity-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            <a href={`https://wa.me/${customer.phone.replace('+', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-dash-panel-alt hover:bg-dash-text hover:text-dash-bg text-dash-text transition-colors rounded-sm" title="WhatsApp">
                                                <MessageCircle className="w-4 h-4" />
                                            </a>
                                            <a href={`tel:${customer.phone}`} className="w-10 h-10 flex items-center justify-center bg-dash-panel-alt hover:bg-dash-text hover:text-dash-bg text-dash-text transition-colors rounded-sm" title="Llamar">
                                                <Phone className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <span className="font-jakarta text-sm text-dash-text-muted italic">Sin teléfono registrado</span>
                                )}
                            </div>
                            
                            {/* Acento lateral brutalista */}
                            <div className="absolute top-0 left-0 w-1 h-0 bg-primary group-hover:h-full transition-all duration-500 ease-out z-20"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

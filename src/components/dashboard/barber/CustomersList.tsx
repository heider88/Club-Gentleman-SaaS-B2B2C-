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

export function CustomersList({ barberId }: { barberId: string }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchCustomers() {
            setLoading(true)
            
            // Traemos todas las citas completadas de este barbero
            const { data, error } = await supabase
                .from('appointments')
                .select('customer_name, customer_phone, start_time')
                .eq('barber_id', barberId)
                .eq('status', 'completed')
                .order('start_time', { ascending: false })

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
    }, [barberId, supabase])

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm)
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-dash-border pb-8">
                <div>
                    <h1 className="font-oswald text-4xl md:text-5xl font-medium tracking-tight text-dash-text uppercase flex items-center gap-3">
                        <Users className="w-8 h-8 text-dash-text-muted" /> Mis Clientes
                    </h1>
                    <p className="text-dash-text-muted font-jakarta text-sm uppercase tracking-widest font-bold mt-3">Directorio y estadísticas de los clientes que has atendido.</p>
                </div>
                
                {/* Search Bar Luxury Industrial */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-muted" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o celular..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-dash-panel border border-dash-border-alt rounded-none text-xs font-bold uppercase tracking-widest text-dash-text placeholder:text-dash-text-muted focus:outline-none focus:border-white transition-all"
                    />
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-dash-text-muted text-xs font-bold uppercase tracking-widest">
                    <span className="w-4 h-4 border-2 border-dash-border border-t-white rounded-full animate-spin mr-3" />
                    Cargando directorio...
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-dash-panel border border-dash-border p-6">
                    <Users className="w-12 h-12 text-dash-border mx-auto mb-4" />
                    <h3 className="font-oswald text-2xl text-dash-text-muted uppercase">No se encontraron clientes</h3>
                    <p className="text-dash-text-soft text-xs font-bold uppercase tracking-widest mt-2">Cuando completes servicios, tus clientes aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((customer, i) => (
                        <div key={i} className="bg-dash-panel border border-dash-border p-6 flex flex-col gap-6 group hover:border-dash-border-alt transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-oswald text-2xl font-medium text-dash-text tracking-wide uppercase">{customer.name}</h3>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-dash-text-muted mt-1 block">Última visita: {customer.lastVisit}</span>
                                </div>
                                <div className="bg-dash-panel-alt border border-dash-border-alt text-dash-text-soft px-3 py-1 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest">
                                    <Scissors className="w-3 h-3" /> {customer.totalCuts}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-dash-border">
                                {customer.phone !== "N/A" ? (
                                    <>
                                        <a href={`https://wa.me/${customer.phone.replace('+', '')}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 bg-transparent hover:bg-dash-panel-alt border border-dash-border-alt py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all text-dash-text">
                                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                        </a>
                                        <a href={`tel:${customer.phone}`} className="flex justify-center items-center px-4 py-2.5 bg-transparent hover:bg-dash-panel-alt border border-dash-border-alt transition-all text-dash-text-soft hover:text-dash-text">
                                            <Phone className="w-3.5 h-3.5" />
                                        </a>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-dash-text-muted text-center w-full py-2.5 uppercase font-bold tracking-widest">Sin teléfono</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
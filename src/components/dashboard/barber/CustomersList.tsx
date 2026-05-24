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
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" /> Mis Clientes
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2">Directorio y estadísticas de los clientes que has atendido.</p>
                </div>
                
                {/* Search Bar Glassmorphism */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o celular..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                    />
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-white/50">
                    <span className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mr-3" />
                    Cargando directorio...
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-black/20 rounded-3xl border border-white/5">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white/70">No se encontraron clientes</h3>
                    <p className="text-white/40 text-sm mt-1">Cuando completes servicios, tus clientes aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((customer, i) => (
                        <div key={i} className="bg-card border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors backdrop-blur-sm shadow-lg flex flex-col gap-4 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{customer.name}</h3>
                                    <span className="text-xs text-white/40">Última visita: {customer.lastVisit}</span>
                                </div>
                                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-primary/20">
                                    <Scissors className="w-3 h-3" /> {customer.totalCuts} cortes
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                                {customer.phone !== "N/A" ? (
                                    <>
                                        <a href={`https://wa.me/${customer.phone.replace('+', '')}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-xl text-sm font-semibold transition-all border border-green-500/20">
                                            <MessageCircle className="w-4 h-4" /> WhatsApp
                                        </a>
                                        <a href={`tel:${customer.phone}`} className="flex justify-center items-center p-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition-all border border-white/10">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    </>
                                ) : (
                                    <span className="text-xs text-white/30 text-center w-full py-2 italic">Sin teléfono registrado</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
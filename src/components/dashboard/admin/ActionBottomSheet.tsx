"use client"

import { format, differenceInMinutes, addMinutes, parse } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2, UserX, Edit, X, CalendarClock, ChevronLeft, MessageCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CalendarView } from "@/components/booking/CalendarView"
import { rescheduleAppointment } from "@/app/actions/appointments"
import { createClient } from "@/lib/supabase/client"

type AppointmentWithService = {
    id: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    barber_id: string;
    service_id?: string;
    services: {
        id?: string;
        name: string;
        price: number;
        duration_minutes?: number;
    } | null;
}

export const ActionBottomSheet = ({ appt, onClose, onAction, barbers = [], isAdmin = false }: { appt: AppointmentWithService | null, onClose: () => void, onAction: (action: string, id: string) => Promise<void>, barbers?: { id: string, name: string, color: string }[], isAdmin?: boolean }) => {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [view, setView] = useState<'menu' | 'reschedule' | 'edit'>('menu');
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
    const [isExtraordinary, setIsExtraordinary] = useState(false);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);
    
    // Default values for edit form (prevent undefined on initial render if appt is somehow null even with the check)
    const [editForm, setEditForm] = useState({ 
        name: appt?.customer_name || '', 
        phone: appt?.customer_phone || '',
        service_id: appt?.service_id || appt?.services?.id || ''
    });

    if (!appt) return null;

    const currentBarberId = selectedBarberId || appt.barber_id;

    // Fetch services specifically for editing
    const loadServices = async () => {
        setLoadingServices(true);
        const supabase = createClient();
        const { data } = await supabase.from('services').select('id, name, price, duration_minutes').eq('barber_id', currentBarberId);
        if (data) setAvailableServices(data);
        setLoadingServices(false);
    };

    const handleAction = async (action: string) => {
        setLoadingAction(action);
        try {
            await onAction(action, appt.id);
            onClose();
        } catch (error) {
            toast.error("Error al ejecutar la acción");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleReschedule = async (timeStr: string, date: Date) => {
        setLoadingAction('reschedule');
        try {
            const duration = appt.services?.duration_minutes || differenceInMinutes(new Date(appt.end_time), new Date(appt.start_time));
            
            const newStart = parse(timeStr, 'h:mm a', new Date(date));
            const newEnd = addMinutes(newStart, duration);

            const result = await rescheduleAppointment(appt.id, newStart.toISOString(), newEnd.toISOString(), currentBarberId, isExtraordinary);
            if (result?.success) {
                toast.success("Cita reagendada exitosamente");
                await onAction('reschedule', appt.id); // Para refrescar
                onClose();
            } else {
                toast.error(result?.error || "Error al reagendar");
            }
        } catch (error) {
            toast.error("Error inesperado al reagendar");
        } finally {
            setLoadingAction(null);
        }
    }

        const handleSaveDetails = async () => {
        if (!editForm.name.trim()) return toast.error("El nombre es requerido");
        if (!editForm.service_id) return toast.error("El servicio es requerido");
        
        setLoadingAction('edit');
        try {
            const supabase = createClient();

            const { error } = await supabase
                .from('appointments')
                .update({ 
                    customer_name: editForm.name.trim(),
                    customer_phone: editForm.phone.trim(),
                    service_id: editForm.service_id
                })
                .eq('id', appt.id);
                
            if (error) throw error;
            
            toast.success("Detalles actualizados exitosamente");
            await onAction('edit', appt.id);
            onClose();
        } catch (error) {
            toast.error("Error al actualizar los detalles");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="w-full sm:max-w-sm bg-dash-panel border-t sm:border border-dash-border rounded-t-2xl sm:rounded-2xl p-5 pb-8 animate-in slide-in-from-bottom-full duration-300 relative max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Indicador de arrastre (UI móvil) */}
                <div className="w-12 h-1.5 bg-dash-border rounded-full mx-auto mb-5 sm:hidden" />

                <button onClick={onClose} className="absolute top-4 right-4 text-dash-text-soft hover:text-dash-text bg-dash-panel-alt p-1 rounded-full hidden sm:block">
                    <X className="w-5 h-5" />
                </button>

                {view === 'menu' ? (
                    <>
                        <div className="mb-6">
                            <h3 className="text-xl font-oswald text-dash-text capitalize">{appt.customer_name.toLowerCase()}</h3>
                            <p className="text-sm text-dash-text-soft capitalize">{appt.services?.name?.toLowerCase() || 'Servicio General'}</p>
                            <p className="text-xs font-mono text-dash-text-muted mt-2">
                                {format(new Date(appt.start_time), 'h:mm a')} - {format(new Date(appt.end_time), 'h:mm a')}
                            </p>
                            {appt.customer_phone && appt.customer_phone !== "N/A" && (
                                <a 
                                    href={`https://wa.me/${appt.customer_phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(appt.customer_name.split(' ')[0])},%20te%20escribimos%20de%20Club%20Gentleman`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold text-xs uppercase tracking-widest rounded-md border border-[#25D366]/30 active:scale-95 transition-all flex justify-center items-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                                </a>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            {appt.status !== 'completed' && (
                                <button 
                                    onClick={() => handleAction('complete')} 
                                    disabled={!!loadingAction}
                                    className="w-full py-3.5 bg-green-500 text-black font-bold text-xs uppercase tracking-widest rounded-md flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                                >
                                    {loadingAction === 'complete' ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                                    Marcar como Terminada
                                </button>
                            )}
                            
                            <button 
                                onClick={() => setView('reschedule')} 
                                disabled={!!loadingAction}
                                className="w-full py-3.5 bg-blue-500/10 text-blue-400 font-bold text-xs uppercase tracking-widest rounded-md border border-blue-500/20 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <CalendarClock className="w-4 h-4" /> Reagendar Cita
                            </button>

                            <button 
                                onClick={() => {
                                    setView('edit');
                                    if (availableServices.length === 0) {
                                        loadServices();
                                    }
                                }} 
                                className="w-full py-3.5 bg-white/5 text-dash-text font-bold text-xs uppercase tracking-widest rounded-md border border-dash-border active:scale-95 transition-transform flex justify-center items-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Editar Detalles
                            </button>
                            
                            <button 
                                onClick={() => handleAction('cancel')} 
                                disabled={!!loadingAction}
                                className="w-full py-3.5 bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-widest rounded-md border border-red-500/20 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {loadingAction === 'cancel' ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/> : <UserX className="w-4 h-4" />}
                                Cancelar Cita
                            </button>
                        </div>
                    </>
                ) : view === 'reschedule' ? (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <button 
                                onClick={() => setView('menu')}
                                className="p-2 bg-dash-panel-alt rounded-lg hover:bg-white/10 text-dash-text transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h3 className="text-lg font-oswald text-dash-text">Reagendar Cita</h3>
                                <p className="text-xs text-dash-text-soft">Selecciona nueva fecha y hora</p>
                            </div>
                        </div>

                        {isAdmin && barbers.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-xs text-dash-text-soft uppercase tracking-wider mb-2">Asignar a:</label>
                                <select 
                                    value={currentBarberId} 
                                    onChange={(e) => setSelectedBarberId(e.target.value)}
                                    className="w-full bg-dash-panel-alt border border-dash-border text-dash-text text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                >
                                    {barbers.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="-mx-5 sm:mx-0 px-5 sm:px-0">
                            {loadingAction === 'reschedule' ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                                    <p className="text-sm font-bold text-dash-text animate-pulse">Reagendando...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {isAdmin && (
                                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                                    🔥 Horario Extraordinario
                                                </span>
                                                <span className="text-[10px] text-white/50">Ignorar límites y bloqueos</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={isExtraordinary} onChange={e => setIsExtraordinary(e.target.checked)} />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                            </label>
                                        </div>
                                    )}
                                    <CalendarView 
                                        barberId={currentBarberId} 
                                        date={new Date(appt.start_time)}
                                        durationMinutes={appt.services?.duration_minutes || differenceInMinutes(new Date(appt.end_time), new Date(appt.start_time))}
                                        onSelect={handleReschedule}
                                        ignoreScheduleLimits={isExtraordinary}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                ) : view === 'edit' ? (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <button 
                                onClick={() => setView('menu')}
                                className="p-2 bg-dash-panel-alt rounded-lg hover:bg-white/10 text-dash-text transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h3 className="text-lg font-oswald text-dash-text">Editar Detalles</h3>
                                <p className="text-xs text-dash-text-soft">Modifica la información del cliente</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="block text-xs text-dash-text-soft uppercase tracking-wider mb-2">Nombre del Cliente</label>
                                <input 
                                    type="text" 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    className="w-full bg-dash-panel-alt border border-dash-border text-dash-text text-sm rounded-lg p-3.5 outline-none focus:border-primary transition-colors"
                                    placeholder="Nombre completo"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-dash-text-soft uppercase tracking-wider mb-2">Teléfono</label>
                                <input 
                                    type="text" 
                                    value={editForm.phone} 
                                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                    className="w-full bg-dash-panel-alt border border-dash-border text-dash-text text-sm rounded-lg p-3.5 outline-none focus:border-primary transition-colors"
                                    placeholder="Número de teléfono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-dash-text-soft uppercase tracking-wider mb-2">Servicio</label>
                                <select 
                                    value={editForm.service_id} 
                                    onChange={e => setEditForm({...editForm, service_id: e.target.value})}
                                    disabled={loadingServices}
                                    className="w-full bg-dash-panel-alt border border-dash-border text-dash-text text-sm rounded-lg p-3.5 outline-none focus:border-primary transition-colors appearance-none disabled:opacity-50"
                                >
                                    <option value="" disabled>{loadingServices ? "Cargando servicios..." : "Selecciona un servicio"}</option>
                                    {availableServices.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <button 
                                onClick={handleSaveDetails}
                                disabled={!!loadingAction}
                                className="w-full mt-2 py-4 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-md flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {loadingAction === 'edit' ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                                Guardar Cambios
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    )
}

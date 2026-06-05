"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { sendBookingNotifications } from "@/app/actions/notifications"
import { createAppointmentAction } from "@/app/actions/appointments"

const formSchema = z.object({
    name: z.string().trim().min(2, "El nombre completo es requerido"),
    email: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
    phone: z.string().trim().min(8, "Número de teléfono inválido").transform(v => v.replace(/[\s-()]/g, ''))
})

type ContactFormData = z.infer<typeof formSchema>

interface ContactFormProps {
    bookingData: {
        barberId: string;
        serviceId: string;
        serviceName: string;
        barberName: string;
        date: Date | null;
        time: string;
        serviceDuration: number;
    };
    onSuccess: () => void;
    onError: (msg: string) => void;
}

export function ContactForm({ bookingData, onSuccess, onError }: ContactFormProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormData>({
        resolver: zodResolver(formSchema)
    })

    const processSubmit = async (data: ContactFormData) => {
        if (!bookingData.barberId || !bookingData.serviceId || !bookingData.date || !bookingData.time) {
            onError("Faltan datos en la reserva. Por favor reinicia el proceso.");
            return;
        }

        let startTime: Date;
        let endTime: Date;

        try {
            // Prepare Start and End time safely preserving local timezone (using parse for 12h format)
            const { parse } = require('date-fns');
            startTime = parse(bookingData.time, 'h:mm a', bookingData.date);
            endTime = new Date(startTime.getTime() + bookingData.serviceDuration * 60000);
            
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                onError("El formato de fecha es inválido en este dispositivo. Reinicia la reserva.");
                return;
            }
        } catch (e) {
            onError("Error al procesar la fecha. Por favor inténtalo de nuevo.");
            return;
        }

        try {
            const result = await createAppointmentAction({
                barberId: bookingData.barberId,
                serviceId: bookingData.serviceId,
                customerName: data.name,
                customerEmail: data.email,
                customerPhone: data.phone,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

            if (!result?.success) {
                onError(result?.error || "No se pudo procesar la reserva.");
                return;
            }

            console.log('--- ENVIANDO ACCIÓN DESDE EL CLIENTE (Sin Bloquear UI) ---');
            // Fire and forget: No hacemos await para no bloquear al usuario si el correo/whatsapp tarda
            sendBookingNotifications({
                customerName: data.name,
                email: data.email,
                phone: data.phone,
                serviceName: bookingData.serviceName || "Servicio VIP",
                barberName: bookingData.barberName || "Profesional",
                date: bookingData.date.toISOString().split('T')[0],
                time: bookingData.time
            }).catch(console.error);

            onSuccess();
        }  
    catch (err: unknown) {
            console.error("Network/Action call error:", err);
            onError("Error de conexión. Verifica tu internet y vuelve a intentarlo.");
        }
    }

    return (
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 bg-black/60 bg-[#0a0a0a] sm:bg-black/60 sm:backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-white/90">Nombre Completo</label>
                <input
                    {...register("name")}
                    className="w-full text-base min-h-[44px] p-3.5 rounded-xl bg-black/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder:text-white/30"
                    placeholder="Ej: Heider Navarro"
                />
                {errors.name && <p className="text-destructive font-semibold text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-white/90">Teléfono Móvil (WhatsApp)</label>
                <div className="flex gap-2">
                    <select className="p-3.5 text-base min-h-[44px] rounded-xl bg-black/60 border border-white/10 text-white outline-none w-[90px] text-center font-medium">
                        <option>+57</option>
                        <option>+52</option>
                        <option>+1</option>
                        <option>+34</option>
                    </select>
                    <input
                        {...register("phone")}
                        type="tel"
                        className="flex-1 w-full text-base min-h-[44px] p-3.5 rounded-xl bg-black/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder:text-white/30"
                        placeholder="300 123 4567"
                    />
                </div>
                {errors.phone && <p className="text-destructive font-semibold text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-white/90">Correo Electrónico</label>
                <input
                    {...register("email")}
                    type="email"
                    className="w-full text-base min-h-[44px] p-3.5 rounded-xl bg-black/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder:text-white/30"
                    placeholder="ejemplo@correo.com"
                />
                {errors.email && <p className="text-destructive font-semibold text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="pt-4 mt-2 border-t border-white/10">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:shadow-[0_0_20px_rgba(var(--color-primary),0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isSubmitting ? "Enviando tu reserva segura..." : "Confirmar Reserva"}
                </button>
            </div>
        </form>
    )
}

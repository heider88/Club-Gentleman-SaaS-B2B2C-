"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"

const formSchema = z.object({
    name: z.string().min(2, "El nombre completo es requerido"),
    email: z.string().email("Correo electrónico inválido"),
    phone: z.string().min(8, "Número de teléfono inválido")
})

type ContactFormData = z.infer<typeof formSchema>

interface ContactFormProps {
    bookingData: {
        barberId: string;
        serviceId: string;
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

        const supabase = createClient();

        // Prepare Start and End time
        const startStr = `${bookingData.date.toISOString().split('T')[0]}T${bookingData.time}:00`;
        const startTime = new Date(startStr);
        const endTime = new Date(startTime.getTime() + bookingData.serviceDuration * 60000);

        try {
            const { error } = await supabase.from('appointments').insert({
                barber_id: bookingData.barberId,
                service_id: bookingData.serviceId,
                customer_name: data.name,
                customer_email: data.email,
                customer_phone: data.phone,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'pending' // Por defecto pendiente, se podría confirmar directamente
            })

            if (error) {
                console.error("DB Error:", error);
                onError("No se pudo guardar la reserva. Verifica conexión o disponibilidad.");
                return;
            }

            onSuccess();
        } catch (err: any) {
            console.error(err);
            onError("Ha ocurrido un error inesperado al contactar con el servidor.");
        }
    }

    return (
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
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

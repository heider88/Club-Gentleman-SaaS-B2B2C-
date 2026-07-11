"use server"

import { createAdminClient } from "@/lib/auth/adminClient";
import { getUserRole } from "@/lib/auth/rbac";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { sendRescheduleNotifications, sendBookingNotifications } from "./notifications";

// Inicializa Redis y RateLimiter para proteger la DB contra spam
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"), // Max 3 citas por hora por IP
        analytics: true,
    });
}

const createAppointmentSchema = z.object({
    barberId: z.string().uuid("ID de barbero inválido"),
    serviceId: z.string().uuid("ID de servicio inválido"),
    customerName: z.string().trim().min(2, "El nombre es muy corto"),
    customerEmail: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
    customerPhone: z.string().trim().min(8, "Teléfono inválido").transform(v => v.replace(/[^\d+]/g, '')),
    startTime: z.string().trim().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida" }),
    endTime: z.string().trim().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida" }),
    isExtraordinary: z.boolean().optional()
});

export async function createAppointmentAction(payload: z.infer<typeof createAppointmentSchema>) {
    try {
        // 1. Verificación Anti-Spam (Rate Limiting)
        if (ratelimit) {
            const headersList = await headers();
            const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
            const { success } = await ratelimit.limit(`booking_${ip}`);
            if (!success) {
                return { success: false, error: "Has realizado demasiados intentos de reserva. Por favor intenta más tarde." };
            }
        }

        const validated = createAppointmentSchema.safeParse(payload);
        if (!validated.success) return { success: false, error: "Datos de reserva inválidos o corruptos." };

        const adminClient = createAdminClient();

        // 2. Validación de Horario Laboral del Barbero
        const { data: barberProfile, error: profileError } = await adminClient
            .from('profiles')
            .select('schedule_settings')
            .eq('id', validated.data.barberId)
            .single();

        if (profileError || !barberProfile) return { success: false, error: "Profesional no encontrado." };

        const schedule = barberProfile.schedule_settings as {
            workDays: number[], 
            startHour?: string|number, 
            endHour?: string|number, 
            lunchStart?: string|number, 
            lunchEnd?: string|number,
            disabledSlots?: Record<number, string[]> | string[]
        };

        const startDateUTC = new Date(validated.data.startTime);
        if (isNaN(startDateUTC.getTime())) {
            return { success: false, error: "La fecha recibida está corrupta." };
        }

        // Convertir explícitamente a la zona horaria de Bogotá para validar correctamente
        const bogotaFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        });
        
        // Parseamos la fecha local de bogotá
        const bogotaParts = bogotaFormatter.formatToParts(startDateUTC);
        const b = {} as any;
        bogotaParts.forEach(p => b[p.type] = parseInt(p.value));
        
        // Creamos una fecha "Local" ficticia en el servidor solo para extraer el dia y la hora correctos
        const bogotaDate = new Date(b.year, b.month - 1, b.day, b.hour, b.minute, b.second);

        const dayOfWeek = bogotaDate.getDay();
        const startHourNum = bogotaDate.getHours() + (bogotaDate.getMinutes() / 60);

        const parseToNum = (val?: string | number) => {
            if (val === undefined || val === null) return null;
            if (typeof val === 'number') return val;
            const [h, m] = val.split(':').map(Number);
            return (h || 0) + (m || 0)/60;
        }

        const sStart = parseToNum(schedule.startHour) ?? 0;
        const sEnd = parseToNum(schedule.endHour) ?? 24;
        const lStart = parseToNum(schedule.lunchStart);
        const lEnd = parseToNum(schedule.lunchEnd);

        // Seguridad: Verificar si la cita es extraordinaria y el usuario tiene permisos
        let isForceMode = false;
        if (validated.data.isExtraordinary) {
            try {
                const { createClient } = await import("@/lib/supabase/server");
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                    if (profile?.role === 'admin') {
                        isForceMode = true;
                    }
                }
            } catch (e) {
                console.error("Error validando permisos extraordinarios:", e);
            }
            if (!isForceMode) {
                return { success: false, error: "ACCESO DENEGADO: No tienes permiso de administrador para forzar un horario extraordinario." };
            }
        }

        if (!isForceMode) {
            // ¿Es día laboral?
            if (!schedule.workDays.includes(dayOfWeek)) {
                return { success: false, error: "El profesional no trabaja en este día de la semana." };
            }

            // ¿Está dentro del horario y fuera del almuerzo?
            if (startHourNum < sStart || startHourNum >= sEnd) {
                return { success: false, error: "El horario seleccionado está fuera del horario laboral." };
            }
            if (lStart !== null && lEnd !== null && startHourNum >= lStart && startHourNum < lEnd) {
                return { success: false, error: "El horario seleccionado interfiere con el receso del profesional." };
            }

            // Validación de disabledSlots granular (revisando cada 5 mins de la duración del servicio)
            if (schedule.disabledSlots) {
                let disabledForDay: string[] = [];
                if (Array.isArray(schedule.disabledSlots)) {
                    disabledForDay = schedule.disabledSlots;
                } else {
                    disabledForDay = (schedule.disabledSlots as Record<number, string[]>)[dayOfWeek] || [];
                }
                
                if (disabledForDay.length > 0) {
                    const endDateUTC = new Date(validated.data.endTime);
                    // Usar un puntero temporal para iterar desde el inicio hasta el fin de la cita
                    const checkDate = new Date(startDateUTC);
                    
                    while (checkDate < endDateUTC) {
                        const bogotaCheckParts = bogotaFormatter.formatToParts(checkDate);
                        const bCheck = {} as any;
                        bogotaCheckParts.forEach(p => bCheck[p.type] = parseInt(p.value));
                        const timeString = `${bCheck.hour.toString().padStart(2, '0')}:${bCheck.minute.toString().padStart(2, '0')}`;
                        
                        if (disabledForDay.includes(timeString)) {
                            return { success: false, error: "El horario seleccionado (o parte de su duración) está deshabilitado manualmente por el profesional." };
                        }
                        // Avanzar 5 minutos
                        checkDate.setMinutes(checkDate.getMinutes() + 5);
                    }
                }
            }

            // Validación de Availability Blocks
            const { data: overlappingBlocks, error: blocksError } = await adminClient
                .from('availability_blocks')
                .select('id')
                .or(`barber_id.eq.${validated.data.barberId},barber_id.is.null`)
                .lt('start_time', validated.data.endTime)
                .gt('end_time', validated.data.startTime);

            if (blocksError) {
                return { success: false, error: "Error al validar la disponibilidad." };
            }
            if (overlappingBlocks && overlappingBlocks.length > 0) {
                return { success: false, error: "El horario seleccionado está bloqueado por el administrador." };
            }
        }

        // 3. Inserción Segura
        const { error } = await adminClient.from('appointments').insert({
            barber_id: validated.data.barberId,
            service_id: validated.data.serviceId,
            customer_name: validated.data.customerName,
            customer_email: validated.data.customerEmail,
            customer_phone: validated.data.customerPhone,
            start_time: validated.data.startTime,
            end_time: validated.data.endTime,
            status: 'pending'
        });

        if (error) {
            if (error.code === '23P01') {
                return { success: false, error: "El horario seleccionado ya no está disponible (Cita duplicada)." };
            }
            console.error("Insert error:", error);
            return { success: false, error: "Error interno al procesar la cita." };
        }

        // 4. Send Confirmation Email (Non-blocking)
        try {
            // Get Barber Name
            const { data: barberProfile } = await adminClient.from('profiles').select('full_name').eq('id', validated.data.barberId).single();
            const barberName = barberProfile?.full_name || "Tu Barbero";

            // Get Service Name
            const { data: serviceObj } = await adminClient.from('services').select('name').eq('id', validated.data.serviceId).single();
            const serviceName = serviceObj?.name || "Servicio General";

            // Format Dates
            const dateObj = new Date(validated.data.startTime);
            const bogotaFormatterDate = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: 'long', day: 'numeric' });
            const bogotaFormatterTime = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: 'numeric', hour12: true });

            await sendBookingNotifications({
                customerName: validated.data.customerName,
                email: validated.data.customerEmail,
                phone: validated.data.customerPhone,
                serviceName: serviceName,
                barberName: barberName,
                date: bogotaFormatterDate.format(dateObj),
                time: bogotaFormatterTime.format(dateObj)
            });
        } catch (emailError) {
            console.error("Error dispatching booking confirmation email:", emailError);
            // We don't fail the booking if email fails
        }
        
        return { success: true };
    }  
    catch (error: unknown) {
        console.error("Action Error:", error);
        return { success: false, error: "Error inesperado en el servidor." };
    }
}

export async function updateAppointmentStatus(appointmentId: string, newStatus: 'completed' | 'cancelled') {
    try {
        const { userId, role } = await getUserRole();
        const adminClient = createAdminClient();

        if (role === 'admin') {
            // Admin can update any appointment
            const { error } = await adminClient
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', appointmentId);
            if (error) return { success: false, error: error.message };
            return { success: true };
        } else {
            // Barber can only update their OWN appointments, and CANNOT cancel them
            if (newStatus === 'cancelled') {
                return { success: false, error: "Acceso Denegado: Solo el Administrador puede cancelar citas." };
            }

            // Let's verify ownership first using admin client
            const { data: appt, error: fetchError } = await adminClient
                .from('appointments')
                .select('barber_id')
                .eq('id', appointmentId)
                .single();
                
            if (fetchError || !appt) return { success: false, error: "Cita no encontrada." };
            if (appt.barber_id !== userId) return { success: false, error: "No tienes permiso para modificar esta cita." };

            const { error } = await adminClient
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', appointmentId);
            if (error) return { success: false, error: error.message };
            return { success: true };
        }
    }  
    catch (err: unknown) {
        console.error("Action Error in updateAppointmentStatus:", err);
        return { success: false, error: "Error inesperado al intentar actualizar la cita." };
    }
}

export async function getBarberAvailabilityData(barberId: string, startRangeStr: string, endRangeStr: string) {
    try {
        const adminClient = createAdminClient();
        const [barberProfileRes, appointmentsRes, blocksRes] = await Promise.all([
            adminClient.from('profiles').select('schedule_settings').eq('id', barberId).single(),
            adminClient.from('appointments').select('start_time, end_time, status').eq('barber_id', barberId).gte('start_time', startRangeStr).lte('start_time', endRangeStr),
            adminClient.from('availability_blocks').select('start_time, end_time').or(`barber_id.eq.${barberId},barber_id.is.null`).gte('start_time', startRangeStr).lte('start_time', endRangeStr)
        ]);

        return {
            success: true,
            schedule_settings: barberProfileRes.data?.schedule_settings || null,
            appointments: appointmentsRes.data || [],
            blocks: blocksRes.data || []
        };
    } catch (error) {
        console.error("Error fetching availability data:", error);
        return { success: false, error: "Error fetching availability" };
    }
}

export async function rescheduleAppointment(appointmentId: string, newStartTime: string, newEndTime: string, newBarberId?: string, isExtraordinary?: boolean) {
    try {
        const { userId, role } = await getUserRole();
        const adminClient = createAdminClient();

        // 1. Fetch current appointment
        const { data: appt, error: fetchError } = await adminClient
            .from('appointments')
            .select(`
                barber_id, 
                status,
                customer_name,
                customer_email,
                customer_phone,
                services(name)
            `)
            .eq('id', appointmentId)
            .single();

        if (fetchError || !appt) return { success: false, error: "Cita no encontrada." };
        if (appt.status === 'completed' || appt.status === 'cancelled') {
            return { success: false, error: "No se puede reagendar una cita ya completada o cancelada." };
        }

        // Only Admin or the assigned Barber can reschedule
        if (role !== 'admin' && appt.barber_id !== userId) {
            return { success: false, error: "No tienes permiso para reagendar esta cita." };
        }
        
        const updateData: any = { 
            start_time: newStartTime, 
            end_time: newEndTime,
            status: 'pending' // Optional: reset status to pending when rescheduled
        };
        
        // Security check: Only admins can reassign barbers
        if (newBarberId && newBarberId !== appt.barber_id) {
            if (role === 'admin') {
                updateData.barber_id = newBarberId;
            } else {
                return { success: false, error: "No tienes permiso para reasignar esta cita a otro barbero." };
            }
        }

        const finalBarberId = updateData.barber_id || appt.barber_id;
        const isForceMode = isExtraordinary && role === 'admin';

        if (!isForceMode) {
            // Validación de Availability Blocks
            const { data: overlappingBlocks, error: blocksError } = await adminClient
                .from('availability_blocks')
                .select('id')
                .or(`barber_id.eq.${finalBarberId},barber_id.is.null`)
                .lt('start_time', newEndTime)
                .gt('end_time', newStartTime);

            if (blocksError) {
                return { success: false, error: "Error al validar la disponibilidad del nuevo horario." };
            }
            if (overlappingBlocks && overlappingBlocks.length > 0) {
                return { success: false, error: "El nuevo horario entra en conflicto con un bloque de inactividad." };
            }
        }

        // 2. Perform reschedule update
        const { error } = await adminClient
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId);

        if (error) {
            if (error.code === '23P01') {
                return { success: false, error: "El nuevo horario entra en conflicto con otra cita (Cita duplicada)." };
            }
            return { success: false, error: error.message };
        }

        // Fetch the barber name for the email
        const targetBarberId = newBarberId || appt.barber_id;
        let barberName = "Tu Barbero";
        const { data: barberProfile } = await adminClient
            .from('profiles')
            .select('full_name')
            .eq('id', targetBarberId)
            .single();
            
        if (barberProfile && barberProfile.full_name) {
            barberName = barberProfile.full_name;
        }

        // Format dates for the email (assuming Bogota timezone or let the email template handle it. The DB saves UTC. Let's format locally)
        const dateObj = new Date(newStartTime);
        const bogotaFormatterDate = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: 'long', day: 'numeric',
        });
        const bogotaFormatterTime = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota',
            hour: 'numeric', minute: 'numeric',
            hour12: true
        });

        // Send Email
        if (appt.customer_email) {
            try {
                // Se debe usar await para que Next.js no mate el proceso antes de enviar el correo
                await sendRescheduleNotifications({
                    customerName: appt.customer_name,
                    email: appt.customer_email,
                    phone: appt.customer_phone || "",
                    serviceName: (appt.services as any)?.name || "Servicio General",
                    barberName: barberName,
                    date: bogotaFormatterDate.format(dateObj),
                    time: bogotaFormatterTime.format(dateObj)
                });
            } catch (emailError) {
                console.error("Error enviando notificaciones de reagendamiento:", emailError);
            }
        }

        return { success: true };
    } catch (err: unknown) {
        console.error("Action Error in rescheduleAppointment:", err);
        return { success: false, error: "Error inesperado al intentar reagendar la cita." };
    }
}

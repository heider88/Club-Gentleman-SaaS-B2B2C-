"use server"

import { createAdminClient } from "@/lib/auth/adminClient";
import { getUserRole } from "@/lib/auth/rbac";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

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
    barberId: z.string().uuid(),
    serviceId: z.string().uuid(),
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(8),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
});

export async function createAppointmentAction(payload: z.infer<typeof createAppointmentSchema>) {
    // 1. Verificación Anti-Spam (Rate Limiting)
    if (ratelimit) {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
        const { success } = await ratelimit.limit(`booking_${ip}`);
        if (!success) {
            throw new Error("Has realizado demasiados intentos de reserva. Por favor intenta más tarde.");
        }
    }

    const validated = createAppointmentSchema.safeParse(payload);
    if (!validated.success) throw new Error("Datos de reserva inválidos");

    const adminClient = createAdminClient();

    // 2. Validación de Horario Laboral del Barbero
    const { data: barberProfile, error: profileError } = await adminClient
        .from('profiles')
        .select('schedule_settings')
        .eq('id', validated.data.barberId)
        .single();

    if (profileError || !barberProfile) throw new Error("Barbero no encontrado.");

    const schedule = barberProfile.schedule_settings as {
        workDays: number[], startHour: number, endHour: number, lunchStart: number, lunchEnd: number
    };

    const startDate = new Date(validated.data.startTime);
    const dayOfWeek = startDate.getDay();
    const startHourNum = startDate.getHours() + (startDate.getMinutes() / 60);

    // ¿Es día laboral?
    if (!schedule.workDays.includes(dayOfWeek)) {
        throw new Error("El profesional no trabaja en este día de la semana.");
    }

    // ¿Está dentro del horario y fuera del almuerzo?
    if (startHourNum < schedule.startHour || startHourNum >= schedule.endHour) {
        throw new Error("El horario seleccionado está fuera del horario laboral.");
    }
    if (startHourNum >= schedule.lunchStart && startHourNum < schedule.lunchEnd) {
        throw new Error("El horario seleccionado interfiere con el receso del profesional.");
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
            throw new Error("El horario seleccionado ya no está disponible (Cita duplicada).");
        }
        throw new Error(error.message);
    }
    
    return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, newStatus: 'completed' | 'cancelled') {
    const { userId, role } = await getUserRole();
    const adminClient = createAdminClient();

    if (role === 'admin') {
        // Admin can update any appointment
        const { error } = await adminClient
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', appointmentId);
        if (error) throw new Error(error.message);
        return { success: true };
    } else {
        // Barber can only update their OWN appointments, and CANNOT cancel them
        if (newStatus === 'cancelled') {
            throw new Error("Acceso Denegado: Solo el Administrador puede cancelar citas.");
        }

        // Let's verify ownership first using admin client
        const { data: appt, error: fetchError } = await adminClient
            .from('appointments')
            .select('barber_id')
            .eq('id', appointmentId)
            .single();
            
        if (fetchError || !appt) throw new Error("Cita no encontrada.");
        if (appt.barber_id !== userId) throw new Error("No tienes permiso para modificar esta cita.");

        const { error } = await adminClient
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', appointmentId);
        if (error) throw new Error(error.message);
        return { success: true };
    }
}

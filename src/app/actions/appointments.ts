"use server"

import { createAdminClient } from "@/lib/auth/adminClient";
import { getUserRole } from "@/lib/auth/rbac";
import { z } from "zod";

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
    const validated = createAppointmentSchema.safeParse(payload);
    if (!validated.success) throw new Error("Datos de reserva inválidos");

    const adminClient = createAdminClient();
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

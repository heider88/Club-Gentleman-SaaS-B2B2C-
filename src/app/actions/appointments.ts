"use server"

import { createAdminClient } from "@/lib/auth/adminClient";
import { getUserRole } from "@/lib/auth/rbac";

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
        // Barber can only update their OWN appointments
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

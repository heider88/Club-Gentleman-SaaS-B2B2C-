"use server"

import { createAdminClient } from "@/lib/auth/adminClient";
import { requireAdmin } from "@/lib/auth/rbac";

export async function cancelAppointment(appointmentId: string) {
    // 1. BLINDAJE: Si no es admin, esta función lanza un error y detiene la ejecución inmediatamente.
    await requireAdmin(); 

    // 2. Usar cliente de administrador (Service Role) para sobrepasar el RLS que restringe a los barberos
    const adminClient = createAdminClient();
    
    const { error } = await adminClient
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

    if (error) throw new Error(error.message);
    
    return { success: true };
}
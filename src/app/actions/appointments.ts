"use server"

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/rbac";

export async function cancelAppointment(appointmentId: string) {
    // 1. BLINDAJE: Si no es admin, esta función lanza un error y detiene la ejecución inmediatamente.
    await requireAdmin(); 

    const supabase = await createClient();
    
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

    if (error) throw new Error(error.message);
    
    return { success: true };
}
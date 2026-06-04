"use server";

import { createAdminClient } from "@/lib/auth/adminClient";
import { requireAdmin } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";

export async function createEmployee(formData: FormData) {
    // 0. BLINDAJE: Solo admins pueden ejecutar esto
    await requireAdmin();

    console.log("Iniciando creación de empleado por Administrador...");
    
    // 1. Extraer datos del formulario seguro
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    
    if (!email || !password || !fullName) {
        return { error: "Faltan datos obligatorios para crear el empleado." };
    }

    try {
        // 2. Instanciar el cliente con privilegios supremos
        const adminAuthClient = createAdminClient();

        // 3. Crear el usuario en el sistema de Auth de Supabase (saltando RLS)
        const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto confirmamos el correo para que puedan entrar directo
        });

        if (authError) {
            console.error("Fallo Auth Supabase Admin:", authError);
            return { error: `No se pudo crear la cuenta: ${authError.message}` };
        }

        const newUserId = authData.user.id;
        console.log(`Empleado Auth creado con ID: ${newUserId}`);

        // 4. (Opcional) El trigger en Supabase_trigger.sql suele crear el profile automáticamente,
        // pero por seguridad, forzamos una actualización con el nombre del empleado
        const { error: profileError } = await adminAuthClient
            .from('profiles')
            .update({
                full_name: fullName,
                role: 'barber' // Garantizamos que nazca como barbero
            })
            .eq('id', newUserId);
            
        if (profileError) {
            console.error("Fallo al actualizar el nombre del Perfil del Empleado:", profileError);
            // No bloqueamos porque la cuenta auth sí se creó, pero lanzamos warning.
        }

        // 5. Refrescar la caché de Next.js para que el nuevo empleado aparezca en la lista inmediatamente
        revalidatePath('/dashboard/admin');
        
        return { success: true, message: "Empleado creado con éxito." };
        
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Fallo crítico en Server Action Admin:", err);
        return { error: "Ocurrió un error inesperado al intentar procesar la solicitud." };
    }
}

export async function deleteEmployee(userId: string) {
    // 1. BLINDAJE: Solo administradores pueden eliminar usuarios
    await requireAdmin();

    try {
        const adminAuthClient = createAdminClient();
        
        // 2. Eliminar el usuario desde la capa Auth. 
        // Gracias a ON DELETE CASCADE en la BD, se eliminará también 
        // su perfil, servicios y citas vinculadas automáticamente.
        const { error } = await adminAuthClient.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Fallo Auth Supabase Admin al eliminar:", error);
            return { error: `No se pudo eliminar el usuario: ${error.message}` };
        }

        console.log(`Empleado eliminado con éxito ID: ${userId}`);
        
        // 3. Refrescar la caché
        revalidatePath('/dashboard/admin');
        
        return { success: true };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Fallo crítico en eliminación de empleado:", err);
        return { error: "Error inesperado al intentar eliminar el empleado." };
    }
}

// -- NUEVO: Gestión de Bloqueos de Agenda y Horario de Tienda --

export async function createAvailabilityBlock(payload: { barber_id: string | null, start_time: string, end_time: string, reason: string | null, is_global: boolean }) {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();
        
        // Validación básica de fechas
        const startDate = new Date(payload.start_time);
        const endDate = new Date(payload.end_time);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return { error: "Formato de fecha u hora inválido." };
        }
        
        const { data, error } = await adminClient.from('availability_blocks').insert([payload]).select().single();
        
        if (error) return { error: error.message };
        revalidatePath('/dashboard/admin/schedules');
        return { success: true, data };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Action Error in createAvailabilityBlock:", err);
        return { error: "Ocurrió un error inesperado al procesar la solicitud." };
    }
}

export async function deleteAvailabilityBlock(blockId: string) {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();
        
        const { error } = await adminClient.from('availability_blocks').delete().eq('id', blockId);
        
        if (error) return { error: error.message };
        revalidatePath('/dashboard/admin/schedules');
        return { success: true };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Action Error in deleteAvailabilityBlock:", err);
        return { error: "Ocurrió un error inesperado al procesar la solicitud." };
    }
}

export async function manageBarberService(action: 'add' | 'delete' | 'update', payload: any) {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();
        
        if (action === 'add') {
            const { data, error } = await adminClient.from('services').insert(payload).select().single();
            if (error) return { error: error.message };
            return { success: true, data };
        }
        
        if (action === 'update') {
            const { id, ...updates } = payload;
            const { data, error } = await adminClient.from('services').update(updates).eq('id', id).select().single();
            if (error) return { error: error.message };
            return { success: true, data };
        }
        
        if (action === 'delete') {
            const { error } = await adminClient.from('services').delete().eq('id', payload.id);
            if (error) return { error: error.message };
            return { success: true };
        }
        
        return { error: "Acción no reconocida." };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Action Error in manageBarberService:", err);
        return { error: "Ocurrió un error inesperado al gestionar el servicio." };
    }
}

export async function importServicesToBarber(barberId: string, servicesToImport: any[]) {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();
        
        if (!Array.isArray(servicesToImport)) {
            return { error: "Los servicios a importar tienen un formato inválido." };
        }

        const newServices = servicesToImport.map(s => ({
            barber_id: barberId,
            name: s.name as string,
            price: s.price as number,
            duration_minutes: s.duration_minutes as number,
            description: s.description as string | null
        }));

        const { data, error } = await adminClient.from('services').insert(newServices).select();
        if (error) return { error: error.message };
        
        return { success: true, data };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Action Error in importServicesToBarber:", err);
        return { error: "Ocurrió un error inesperado al importar servicios." };
    }
}

export async function updateBarberProfile(barberId: string, updates: any) {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();
        
        const { data, error } = await adminClient
            .from('profiles')
            .update(updates)
            .eq('id', barberId)
            .select();
            
        if (error) return { error: error.message };
        
        revalidatePath(`/dashboard/admin/barber/${barberId}`);
        return { success: true, data };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Action Error in updateBarberProfile:", err);
        return { error: "Ocurrió un error inesperado al actualizar el perfil." };
    }
}

export async function updateEmployeePassword(userId: string, newPassword: string) {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();

        if (!newPassword || newPassword.length < 6) {
            return { error: "La contraseña es muy corta o inválida." };
        }

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (error) {
            console.error("Error al actualizar contraseña:", error);
            return { error: `Error: ${error.message}` };
        }

        return { success: true, message: "Contraseña actualizada exitosamente." };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Action Error in updateEmployeePassword:", err);
        return { error: "Ocurrió un error inesperado al procesar la solicitud." };
    }
}

export async function updateEmployeeEmail(userId: string, newEmail: string) {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();

        if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
            return { error: "Formato de correo electrónico inválido." };
        }

        // 1. Actualizar en el sistema de autenticación (auth.users)
        const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
            email: newEmail,
            email_confirm: true // Confirmar automáticamente para evitar bloqueos
        });

        if (authError) {
            console.error("Error al actualizar email en Auth:", authError);
            return { error: `Error Auth: ${authError.message}` };
        }

        // 2. Sincronizar el correo en la tabla pública de profiles
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ email: newEmail })
            .eq('id', userId);

        if (profileError) {
            console.error("Error al sincronizar email en Profiles:", profileError);
            // Retornamos success parcial porque el login sí cambió, pero avisamos.
            return { success: true, message: "Email actualizado en acceso, pero falló sincronización en perfil público." };
        }
        
        revalidatePath(`/dashboard/admin/barber/${userId}`);
        return { success: true, message: "Correo de acceso actualizado exitosamente." };
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: unknown) {
        console.error("Action Error in updateEmployeeEmail:", err);
        return { error: "Ocurrió un error inesperado al procesar la solicitud." };
    }
}


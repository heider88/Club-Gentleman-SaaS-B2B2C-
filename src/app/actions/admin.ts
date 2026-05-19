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
        
    } catch (err: any) {
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
    } catch (err: any) {
        console.error("Fallo crítico en eliminación de empleado:", err);
        return { error: "Error inesperado al intentar eliminar el empleado." };
    }
}

// -- NUEVO: Gestión de Servicios del Barbero saltando RLS --

export async function manageBarberService(action: 'add' | 'delete', payload: any) {
    await requireAdmin();
    const adminClient = createAdminClient();
    
    if (action === 'add') {
        const { data, error } = await adminClient.from('services').insert(payload).select().single();
        if (error) return { error: error.message };
        return { success: true, data };
    }
    
    if (action === 'delete') {
        const { error } = await adminClient.from('services').delete().eq('id', payload.id);
        if (error) return { error: error.message };
        return { success: true };
    }
}

export async function importServicesToBarber(barberId: string, servicesToImport: any[]) {
    await requireAdmin();
    const adminClient = createAdminClient();
    
    const newServices = servicesToImport.map(s => ({
        barber_id: barberId,
        name: s.name,
        price: s.price,
        duration_minutes: s.duration_minutes,
        description: s.description
    }));

    const { data, error } = await adminClient.from('services').insert(newServices).select();
    if (error) return { error: error.message };
    
    return { success: true, data };
}


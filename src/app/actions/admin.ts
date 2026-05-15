"use server";

import { createAdminClient } from "@/lib/auth/adminClient";
import { revalidatePath } from "next/cache";

export async function createEmployee(formData: FormData) {
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

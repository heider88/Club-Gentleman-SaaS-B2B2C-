import { createClient } from '@supabase/supabase-js'

// Este cliente NUNCA debe ser usado en el lado del cliente ("use client").
// Solo debe usarse dentro de "src/app/actions" (Server Actions) y está configurado
// para saltarse las reglas de RLS para tareas de administración.
export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase Service Role Key or URL. Check your environment variables.')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    })
}

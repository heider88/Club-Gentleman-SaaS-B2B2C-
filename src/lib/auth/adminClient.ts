import { createClient } from '@supabase/supabase-js'

// Este cliente NUNCA debe ser usado en el lado del cliente ("use client").
// Solo debe usarse dentro de "src/app/actions" (Server Actions) y está configurado
// para saltarse las reglas de RLS para tareas de administración.
export const createAdminClient = () => {
    // Usamos la variable de entorno, pero dejamos un fallback fuerte por si Vercel pierde el NEXT_PUBLIC en SSR
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fugqlksipjsgqhxxathd.supabase.co"
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Mensajes de error específicos para debug fácil en Vercel
    if (!supabaseUrl) {
        throw new Error('SERVER_ERROR: Missing Supabase URL in environment.')
    }
    if (!serviceRoleKey) {
        throw new Error('SERVER_ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in environment. Check Vercel settings.')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    })
}


"use server"

import { createAdminClient } from "@/lib/auth/adminClient"
import { requireAdmin } from "@/lib/auth/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const siteSettingsSchema = z.object({
    general: z.object({
        name: z.string().min(1, "El nombre es requerido"),
        description: z.string().optional(),
        slogan: z.string().optional(),
    }),
    contact: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        whatsapp: z.string().optional(),
        schedule: z.string().optional(),
    }),
    custom_sections: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        type: z.enum(['text_only', 'with_images']),
    })).default([]),
})

export type SiteSettingsPayload = z.infer<typeof siteSettingsSchema>

export async function getSiteSettings(): Promise<SiteSettingsPayload> {
    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient.from('site_settings').select('*').limit(1).single()
        
        if (error || !data) {
            // Devuelve configuraciones por defecto si la tabla no existe o está vacía
            return {
                general: { name: "CLUB GENTLEMAN FOR MEN", description: "", slogan: "" },
                contact: { facebook: "", instagram: "", whatsapp: "", schedule: "09:00 - 20:00" },
                custom_sections: [],
            }
        }
        
        return {
            general: data.general || { name: "CLUB GENTLEMAN FOR MEN", description: "", slogan: "" },
            contact: data.contact || { facebook: "", instagram: "", whatsapp: "", schedule: "09:00 - 20:00" },
            custom_sections: data.custom_sections || [],
        }
    } catch (err) {
        console.error("Error fetching site settings:", err)
        return {
            general: { name: "CLUB GENTLEMAN FOR MEN", description: "", slogan: "" },
            contact: { facebook: "", instagram: "", whatsapp: "", schedule: "09:00 - 20:00" },
            custom_sections: [],
        }
    }
}

export async function saveSiteSettings(payload: SiteSettingsPayload) {
    try {
        await requireAdmin()
        const adminClient = createAdminClient()
        
        const validated = siteSettingsSchema.safeParse(payload)
        if (!validated.success) {
            return { success: false, error: "Datos de configuración inválidos." }
        }

        // Verifica si ya existe un registro
        const { data: existing } = await adminClient.from('site_settings').select('id').limit(1).single()

        let result;
        if (existing) {
            result = await adminClient.from('site_settings').update({
                general: validated.data.general,
                contact: validated.data.contact,
                custom_sections: validated.data.custom_sections,
                updated_at: new Date().toISOString()
            }).eq('id', existing.id)
        } else {
            result = await adminClient.from('site_settings').insert({
                general: validated.data.general,
                contact: validated.data.contact,
                custom_sections: validated.data.custom_sections,
            })
        }

        if (result.error) {
            console.error("Error al guardar settings:", result.error)
            return { success: false, error: "Error en la base de datos. Verifica que creaste la tabla 'site_settings'." }
        }

        revalidatePath('/')
        revalidatePath('/dashboard/admin/settings')
        
        return { success: true }
    } catch (err: any) {
        console.error("Action Error in saveSiteSettings:", err)
        return { success: false, error: "Error inesperado al guardar la configuración." }
    }
}

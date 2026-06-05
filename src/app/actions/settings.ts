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
        logo_url: z.string().optional(),
        rating: z.string().optional(),
        reviews_count: z.string().optional(),
        established_year: z.string().optional(),
        about_features: z.array(z.string()).optional(),
        about_features_title: z.string().optional(),
        location_image_url: z.string().optional(),
    }),
    contact: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        whatsapp: z.string().optional(),
        schedule: z.string().optional(),
        address: z.string().optional(),
        map_url: z.string().optional(),
    }),
    custom_sections: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        type: z.enum(['text_only', 'with_images']),
        images: z.array(z.string()).optional(),
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
                general: { name: "CLUB GENTLEMAN FOR MEN", description: "", slogan: "", logo_url: "", rating: "5.0", reviews_count: "341", established_year: "2018", about_features: ["Productos de cuidado masculino", "Camisetas, gorras, relojes y joyas", "Ceras, aceites, fragancias exclusivas"], about_features_title: "Descubrí nuestra selección:", location_image_url: "" },
                contact: { facebook: "", instagram: "", whatsapp: "", schedule: "09:00 - 20:00", address: "Cll 72 sur #14-80 Bogotá", map_url: "https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7" },
                custom_sections: [],
            }
        }
        
        return {
            general: data.general || {
                general: { name: "CLUB GENTLEMAN FOR MEN", description: "", slogan: "", logo_url: "", rating: "5.0", reviews_count: "341", established_year: "2018", about_features: ["Productos de cuidado masculino", "Camisetas, gorras, relojes y joyas", "Ceras, aceites, fragancias exclusivas"], about_features_title: "Descubrí nuestra selección:", location_image_url: "" },
                contact: { facebook: "", instagram: "", whatsapp: "", schedule: "09:00 - 20:00", address: "Cll 72 sur #14-80 Bogotá", map_url: "https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7" },
                custom_sections: [],
            }.general,
            contact: data.contact || {
                general: { name: "CLUB GENTLEMAN FOR MEN", description: "", slogan: "", logo_url: "", rating: "5.0", reviews_count: "341", established_year: "2018", about_features: ["Productos de cuidado masculino", "Camisetas, gorras, relojes y joyas", "Ceras, aceites, fragancias exclusivas"], about_features_title: "Descubrí nuestra selección:", location_image_url: "" },
                contact: { facebook: "", instagram: "", whatsapp: "", schedule: "09:00 - 20:00", address: "Cll 72 sur #14-80 Bogotá", map_url: "https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7" },
                custom_sections: [],
            }.contact,
            custom_sections: data.custom_sections || [],
        }
    } catch (err) {
        console.error("Error fetching site settings:", err)
        return {
                general: { name: "CLUB GENTLEMAN FOR MEN", description: "", slogan: "", logo_url: "", rating: "5.0", reviews_count: "341", established_year: "2018", about_features: ["Productos de cuidado masculino", "Camisetas, gorras, relojes y joyas", "Ceras, aceites, fragancias exclusivas"], about_features_title: "Descubrí nuestra selección:", location_image_url: "" },
                contact: { facebook: "", instagram: "", whatsapp: "", schedule: "09:00 - 20:00", address: "Cll 72 sur #14-80 Bogotá", map_url: "https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7" },
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
    }  
    catch (err: unknown) {
        console.error("Action Error in saveSiteSettings:", err)
        return { success: false, error: "Error inesperado al guardar la configuración." }
    }
}

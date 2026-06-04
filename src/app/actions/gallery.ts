"use server"

import { requireAdmin } from "@/lib/auth/rbac"
import { createAdminClient } from "@/lib/auth/adminClient"
import { revalidatePath } from "next/cache"
import sharp from "sharp"

export async function addGalleryImage(imageUrl: string, caption?: string) {
    await requireAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('gallery_images')
        .insert([{ image_url: imageUrl, caption }])

    if (error) return { error: error.message }
    
    // Al cambiar la galería, forzamos a Next.js a regenerar el HTML estático de la página de inicio
    revalidatePath('/')
    revalidatePath('/dashboard/admin/settings')
    return { success: true }
}

export async function uploadGalleryImageDirect(formData: FormData) {
    await requireAdmin()
    const adminClient = createAdminClient()

    const file = formData.get('file') as File;
    if (!file) return { error: "No se proporcionó un archivo." };

    // Convert file to buffer for server-side Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)

    // Estandarizar imagen: Redimensionar y recortar a cuadrado 1080x1080, comprimir JPEG
    const buffer = await sharp(originalBuffer)
        .resize({
            width: 1080,
            height: 1080,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        .jpeg({ quality: 80 })
        .toBuffer()

    // Cambiar la extensión a jpg ya que la estandarizamos
    const fileExt = "jpg"
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `public/${fileName}`

    // Usamos adminClient para saltar el RLS de Storage (ya que verificamos requireAdmin arriba)
    const { error: uploadError } = await adminClient.storage
        .from('gallery')
        .upload(filePath, buffer, {
            contentType: 'image/jpeg',
            upsert: false
        })

    if (uploadError) return { error: `Fallo en Storage: ${uploadError.message}` };

    const { data: { publicUrl } } = adminClient.storage
        .from('gallery')
        .getPublicUrl(filePath)

    // Insertar en la base de datos
    const { error: dbError } = await adminClient
        .from('gallery_images')
        .insert([{ image_url: publicUrl }])

    if (dbError) return { error: dbError.message }

    revalidatePath('/')
    revalidatePath('/dashboard/admin/settings')
    return { success: true }
}

export async function deleteGalleryImage(id: string, imageUrl?: string) {
    await requireAdmin()
    const adminClient = createAdminClient()

    // Si la imagen es de Supabase Storage, intentamos borrarla del Bucket
    if (imageUrl && imageUrl.includes('supabase.co')) {
        const path = imageUrl.split('/').pop()
        if (path) {
            await adminClient.storage.from('gallery').remove([`public/${path}`])
        }
    }

    const { error } = await adminClient
        .from('gallery_images')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath('/')
    revalidatePath('/dashboard/admin/settings')
    return { success: true }
}

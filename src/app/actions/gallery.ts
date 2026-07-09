"use server"

import { requireAdmin } from "@/lib/auth/rbac"
import { createAdminClient } from "@/lib/auth/adminClient"
import { revalidatePath } from "next/cache"

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
    const buffer = Buffer.from(arrayBuffer)

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    // Upload direct to Supabase (Already compressed and optimized on client side)
    const { error: uploadError } = await adminClient.storage
        .from('gallery')
        .upload(filePath, buffer, {
            contentType: file.type || 'image/jpeg',
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

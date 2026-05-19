import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImageIcon } from "lucide-react"
import { GalleryManager } from "@/components/dashboard/admin/GalleryManager"

export default async function AdminGalleryPage() {
    const supabase = await createClient()

    // 1. Verificación de seguridad
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') redirect("/dashboard")

    // 2. Traer imágenes iniciales
    const { data: initialImages } = await supabase
        .from('gallery_images')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    Configuración Web <ImageIcon className="w-8 h-8 text-primary" />
                </h1>
                <p className="text-muted-foreground font-medium">
                    Gestiona las fotografías que aparecen en la sección "Nuestro Trabajo" de la página principal.
                </p>
            </header>

            <GalleryManager initialImages={initialImages || []} />
        </div>
    )
}

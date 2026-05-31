import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"
import { BusinessSettingsTabs } from "@/components/dashboard/admin/BusinessSettingsTabs"
import { getSiteSettings } from "@/app/actions/settings"

export default async function AdminSettingsPage() {
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

    // 2. Traer imágenes de la galería (para la pestaña Galería)
    const { data: initialImages } = await supabase
        .from('gallery_images')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

    // 3. Traer la configuración del negocio
    const siteSettings = await getSiteSettings()

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <header className="flex flex-col gap-2 pb-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-dash-text flex items-center gap-3">
                    Mi negocio <Settings className="w-8 h-8 text-primary" />
                </h1>
                <p className="text-muted-foreground font-medium">
                    Gestiona la información de tu negocio para que tus clientes puedan encontrarte fácilmente.
                </p>
            </header>

            <BusinessSettingsTabs 
                initialSettings={siteSettings} 
                initialImages={initialImages || []} 
            />
        </div>
    )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardThemeProvider } from "@/components/dashboard/DashboardThemeProvider"
import { Oswald, Plus_Jakarta_Sans } from "next/font/google"

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" })
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })

// Desactiva la revalidación dinámica forzada en el layout
// Permite que Next.js mantenga la cáscara (el Sidebar) en caché en el cliente
export const revalidate = 0;

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Obtener sesión desde el servidor (esto se cachea automáticamente por segmento en Next 14+)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Fallback rápido sin esperar más a la base de datos si ya sabemos que no hay sesión
    if (authError || !user) {
        redirect("/login")
    }

    // 2. Obtener el rol del usuario de forma segura
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'barber'

    return (
        <DashboardThemeProvider>
            <div className={`min-h-screen bg-dash-bg text-dash-text flex flex-col md:flex-row relative ${oswald.variable} ${jakarta.variable} font-jakarta`}>
                {/* Noise texture overlay for Luxury Industrial feel */}
                <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] dark:opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                {/* Pasamos el rol evaluado en el servidor hacia nuestro componente cliente */}
                <div className="z-10 flex flex-col md:flex-row w-full h-full relative">
                    <DashboardSidebar role={role} />

                    {/* Main Content */}
                    <main className="flex-1 pb-20 md:pb-0 p-4 md:p-8 overflow-y-auto w-full max-w-full">
                        {children}
                    </main>
                </div>
            </div>
        </DashboardThemeProvider>
    )
}

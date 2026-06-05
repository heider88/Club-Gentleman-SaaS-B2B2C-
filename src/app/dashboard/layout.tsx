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
            <div className={`min-h-screen text-dash-text flex flex-col md:flex-row relative ${oswald.variable} ${jakarta.variable} font-jakarta overflow-hidden`}>
                
                {/* Purple Gradient Background matches customer view */}
                <div className="fixed inset-0 bg-gradient-to-r from-black to-[#6D3294] -z-20 pointer-events-none transform-gpu" />
                
                {/* Texture Overlay matches customer view */}
                <div className="fixed inset-0 opacity-[0.04] -z-10 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABXRSTlMNDxESFjk7Z3EAAAA/SURBVDjLpc0xDQAwDMOg0i69r1gJtN1o8wI4y8y+tO99n/mQ14e8PuT1Ia8PeX3I60NeH/L6kNeHvD7k9aG3DyHwBf3zT0nLAAAAAElFTkSuQmCC')] bg-repeat transform-gpu" />
                
                {/* Center Glow matches customer view */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#6D3294]/5 hidden sm:block sm:blur-[120px] pointer-events-none -z-10 transform-gpu" />

                {/* Pasamos el rol evaluado en el servidor hacia nuestro componente cliente */}
                <div className="z-10 flex flex-col md:flex-row w-full h-full relative">
                    <DashboardSidebar role={role} />

                    {/* Main Content */}
                    <main className="flex-1 pb-20 md:pb-0 p-4 md:p-8 overflow-y-auto w-full max-w-full relative z-10">
                        {children}
                    </main>
                </div>
            </div>
        </DashboardThemeProvider>
    )
}

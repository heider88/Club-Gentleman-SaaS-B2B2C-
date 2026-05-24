import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CustomersList } from "@/components/dashboard/barber/CustomersList"

export default async function CustomersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Solo barberos (o admin que atienda) ven esta lista
    if (!profile) {
        redirect("/dashboard")
    }

    return <CustomersList barberId={user.id} />
}
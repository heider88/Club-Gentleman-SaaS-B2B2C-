import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = 'admin' | 'barber';

export async function getUserRole(): Promise<{ userId: string, role: UserRole }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return { 
        userId: user.id, 
        role: (profile?.role as UserRole) || 'barber' 
    };
}

export async function requireAdmin() {
    const { role } = await getUserRole();
    if (role !== 'admin') {
        throw new Error("ACCESO DENEGADO: Se requieren privilegios de Administrador.");
    }
}
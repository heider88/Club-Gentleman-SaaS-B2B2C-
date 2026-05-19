"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { deleteEmployee } from "@/app/actions/admin";

export function DeleteEmployeeButton({ userId, userName }: { userId: string, userName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        const confirmMsg = `¿Estás completamente seguro de ELIMINAR al barbero "${userName}"?\n\nESTA ACCIÓN NO SE PUEDE DESHACER.\nSe borrará su cuenta, sus servicios y las citas vinculadas a él.`;
        
        if (!window.confirm(confirmMsg)) return;

        setIsDeleting(true);
        const toastId = toast.loading("Eliminando cuenta...");

        try {
            const res = await deleteEmployee(userId);
            
            if (res?.error) {
                toast.error(res.error, { id: toastId });
            } else {
                toast.success(`Empleado ${userName} eliminado con éxito`, { id: toastId });
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al eliminar.", { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 hover:border-destructive/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            title={`Eliminar a ${userName}`}
        >
            {isDeleting ? (
                <span className="w-4 h-4 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin inline-block" />
            ) : (
                <UserMinus className="w-4 h-4" />
            )}
        </button>
    );
}

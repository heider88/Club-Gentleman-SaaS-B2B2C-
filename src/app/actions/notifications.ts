"use server";

import { resend } from "@/lib/resend";
import { BookingConfirmation } from "@/components/emails/BookingConfirmation";
import React from "react";
import { render } from "@react-email/render";

export interface BookingEmailPayload {
    customerName: string;
    customerEmail: string;
    serviceName: string;
    barberName: string;
    date: string;
    time: string;
}

export async function sendBookingEmail(payload: BookingEmailPayload) {
    console.log('--- ACTION TRIGGERED ---', payload.customerEmail);

    try {
        console.log("Renderizando email HTML manualmente...");
        const emailHtml = await render(React.createElement(BookingConfirmation, {
            customerName: payload.customerName,
            serviceName: payload.serviceName,
            barberName: payload.barberName,
            date: payload.date,
            time: payload.time
        }));
        console.log("Renderizado de email exitoso.");

        const { error } = await resend.emails.send({
            // NOTA: Usa 'onboarding@resend.dev' en Sandbox. 
            // El 'to' (payload.customerEmail) DEBE SER el correo registrado en Resend.
            from: "onboarding@resend.dev",
            to: payload.customerEmail,
            subject: `Confirmación de cita - ${payload.serviceName}`,
            html: emailHtml,
        });

        if (error) {
            console.error('ERROR DETALLADO EN ACCIÓN:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: unknown) {
        console.error('ERROR DETALLADO EN ACCIÓN:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Error interno del servidor al enviar correo"
        };
    }
}

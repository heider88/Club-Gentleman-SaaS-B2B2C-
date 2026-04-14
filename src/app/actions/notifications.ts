"use server";

import { resend } from "@/lib/resend";
import { twilioClient } from "@/lib/twilio";
import { BookingConfirmation } from "@/components/emails/BookingConfirmation";
import React from "react";
import { render } from "@react-email/render";

export interface BookingNotificationPayload {
    customerName: string;
    email: string;
    phone: string;
    serviceName: string;
    barberName: string;
    date: string;
    time: string;
}

export async function sendBookingNotifications(payload: BookingNotificationPayload) {
    console.log('--- NOTIFICATIONS ACTION TRIGGERED --- / Destinos:', payload.email, payload.phone);

    // ---- 1. PREPARACIÓN DEL CORREO ELECTRÓNICO ----
    const emailPromise = (async () => {
        try {
            console.log("Renderizando email HTML manualmente...");
            const emailHtml = await render(
                React.createElement(BookingConfirmation, {
                    customerName: payload.customerName,
                    serviceName: payload.serviceName,
                    barberName: payload.barberName,
                    date: payload.date,
                    time: payload.time
                })
            );

            console.log("Despachando correo a Resend...");
            const { error } = await resend.emails.send({
                from: "onboarding@resend.dev",
                to: payload.email,
                subject: `Confirmación de cita - ${payload.serviceName}`,
                html: emailHtml,
            });

            if (error) {
                console.error("Resend disparó un fallo:", error);
                throw error;
            }
            return true;
        } catch (err) {
            console.error("Fallo interno en promesa de Correo:", err);
            throw err;
        }
    })();

    // ---- 2. PREPARACIÓN DEL WHATSAPP (TWILIO) ----
    const whatsappPromise = (async () => {
        try {
            console.log("Preparando trama de WhatsApp...");
            const messageBody = `¡Hola ${payload.customerName}! 💈 Tu cita en Club Gentleman para ${payload.serviceName} ha sido confirmada para el ${payload.date} a las ${payload.time}. Dirección: Calle 72 sur # 14-80. ¡Te esperamos!`;

            // Asumimos un remitente genérico de pruebas o el default de Twilio si no fue provisto
            // Nota: En producción necesitas configurar `TWILIO_WHATSAPP_NUMBER` con algo tipo 'whatsapp:+14155238886'
            const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

            // Asegurar prefijo de Colombia a menos que ya venga en el input del front form
            // Si en el form ya envían +57... no queremos doblarlo a +57+57...
            let sanitizedPhone = payload.phone;
            if (sanitizedPhone.startsWith('+')) {
                sanitizedPhone = sanitizedPhone.substring(1); // remover '+' para forzar el nuestro
            }
            // Si no enviaron el "57" al inicio (ej: 300123...), se lo colocamos.
            if (!sanitizedPhone.startsWith('57') && !sanitizedPhone.startsWith('52') && !sanitizedPhone.startsWith('1') && !sanitizedPhone.startsWith('34')) {
                sanitizedPhone = `57${sanitizedPhone}`;
            }

            const targetPhone = `whatsapp:+${sanitizedPhone}`;
            console.log(`Disparando WA Twilio a: ${targetPhone}`);

            const response = await twilioClient.messages.create({
                body: messageBody,
                from: fromNumber,
                to: targetPhone,
            });

            console.log("WhatsApp enviado. SID:", response.sid);
            return true;
        } catch (err) {
            console.error("Fallo interno en promesa de WhatsApp:", err);
            throw err;
        }
    })();

    // ---- 3. EJECUCIÓN OMNICANAL EN PARALELO ----
    const results = await Promise.allSettled([emailPromise, whatsappPromise]);

    const emailSent = results[0].status === 'fulfilled';
    const whatsappSent = results[1].status === 'fulfilled';

    console.log(`[REPORTE OMNICANAL] -> Email: ${emailSent ? 'OK' : 'FAIL'} | WhatsApp: ${whatsappSent ? 'OK' : 'FAIL'}`);

    return {
        emailSent,
        whatsappSent
    };
}

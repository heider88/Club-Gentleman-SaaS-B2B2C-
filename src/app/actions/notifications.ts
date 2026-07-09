"use server";

import { mailClient, EMAIL_FROM } from "@/lib/mail";
import { BookingConfirmation } from "@/components/emails/BookingConfirmation";
import React from "react";
import { render } from "@react-email/render";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Inicializa Redis y RateLimiter SOLO si las variables de entorno existen
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        analytics: true,
    });
}

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
    console.log('--- NOTIFICATIONS ACTION TRIGGERED --- / Email:', payload.email);

    // ---- 0. VERIFICACIÓN DE RATE LIMIT (SEGURIDAD) ----
    if (ratelimit) {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
        
        const { success } = await ratelimit.limit(`ratelimit_notifications_${ip}`);
        
        if (!success) {
            console.error(`[SEGURIDAD] Rate limit excedido para IP: ${ip}. Bloqueando envío de Email.`);
            return {
                emailSent: false,
                error: "Rate limit exceeded"
            };
        }
    }

    // ---- 1. ENVÍO DE CORREO DE CONFIRMACIÓN ----
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

        console.log("Despachando correo...");
        const { error } = await mailClient.sendMail({
            from: EMAIL_FROM,
            to: payload.email,
            subject: `Confirmación de cita - ${payload.serviceName}`,
            html: emailHtml,
        }).then(() => ({ error: null })).catch((err) => ({ error: err }));

        // ---- 2. ENVÍO DE CORREO AL ADMINISTRADOR (BARBERÍA) ----
        console.log("Despachando correo de aviso al administrador...");
        const adminEmail = process.env.ADMIN_EMAIL || "clubgentleman156@gmail.com";
        const { error: adminError } = await mailClient.sendMail({
            from: EMAIL_FROM,
            to: adminEmail,
            subject: `🎉 NUEVA RESERVA: ${payload.customerName} - ${payload.date} ${payload.time}`,
            html: emailHtml,
        }).then(() => ({ error: null })).catch((err) => ({ error: err }));

        if (adminError) {
            console.error("Fallo al enviar correo al administrador:", adminError);
            // No lanzamos el error para no asustar al cliente si su correo sí se envió
        }

        if (error) {
            console.error("Falló el envío del correo:", error);
            throw error;
        }

        console.log(`[REPORTE] -> Email: OK`);
        return { emailSent: true };

    } catch (err) {
        console.error("Fallo interno al enviar correo:", err);
        return { emailSent: false, error: "Failed to send email" };
    }
}

import { BookingReschedule } from "@/components/emails/BookingReschedule";

export async function sendRescheduleNotifications(payload: BookingNotificationPayload) {
    console.log('--- RESCHEDULE NOTIFICATIONS ACTION TRIGGERED --- / Email:', payload.email);

    if (ratelimit) {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
        
        const { success } = await ratelimit.limit(`ratelimit_notifications_${ip}`);
        
        if (!success) {
            console.error(`[SEGURIDAD] Rate limit excedido para IP: ${ip}. Bloqueando envío de Email.`);
            return {
                emailSent: false,
                error: "Rate limit exceeded"
            };
        }
    }

    try {
        console.log("Renderizando email HTML manualmente para reagendamiento...");
        const emailHtml = await render(
            React.createElement(BookingReschedule, {
                customerName: payload.customerName,
                serviceName: payload.serviceName,
                barberName: payload.barberName,
                date: payload.date,
                time: payload.time
            })
        );

        console.log("Despachando correo...");
        const { error } = await mailClient.sendMail({
            from: EMAIL_FROM,
            to: payload.email,
            subject: `Cita Reagendada - ${payload.serviceName}`,
            html: emailHtml,
        }).then(() => ({ error: null })).catch((err) => ({ error: err }));

        console.log("Despachando correo de aviso al administrador...");
        const adminEmail = process.env.ADMIN_EMAIL || "clubgentleman156@gmail.com";
        const { error: adminError } = await mailClient.sendMail({
            from: EMAIL_FROM,
            to: adminEmail,
            subject: `🔄 CITA REAGENDADA: ${payload.customerName} - Nueva fecha: ${payload.date} ${payload.time}`,
            html: emailHtml,
        }).then(() => ({ error: null })).catch((err) => ({ error: err }));

        if (adminError) {
            console.error("Fallo al enviar correo al administrador:", adminError);
        }

        if (error) {
            console.error("Fallo al enviar a cliente:", error);
            throw error;
        }

        console.log(`[REPORTE] -> Reschedule Email: OK`);
        return { emailSent: true };

    } catch (err) {
        console.error("Fallo interno al enviar correo de reagendamiento:", err);
        return { emailSent: false, error: "Failed to send email" };
    }
}

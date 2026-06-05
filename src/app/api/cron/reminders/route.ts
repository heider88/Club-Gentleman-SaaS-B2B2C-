import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/adminClient';
import { resend } from '@/lib/resend';
import { BookingReminder } from '@/components/emails/BookingReminder';
import React from 'react';
import { render } from '@react-email/render';

// Vercel Cron envia un header especial que debemos validar por seguridad
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    
    // Si tienes CRON_SECRET en tus variables de entorno, lo validamos.
    // Esto asegura que alguien no pueda entrar a /api/cron/reminders y hacer spam.
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("CRON JOB INIT: Buscando citas del día de hoy para enviar recordatorios...");
        const adminClient = createAdminClient();
        
        // Ventana de tiempo: Todo el día de hoy (desde este momento hasta la medianoche)
        const now = new Date();
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const { data: appointments, error } = await adminClient
            .from('appointments')
            .select(`
                id,
                start_time,
                customer_name,
                customer_email,
                status,
                services(name),
                profiles(full_name)
            `)
            .eq('status', 'pending')
            .gte('start_time', now.toISOString())
            .lte('start_time', endOfToday.toISOString());

        if (error) throw error;

        console.log(`CRON: Se encontraron ${appointments?.length || 0} citas para hoy.`);

        const emailsSent = [];

        // Por cada cita, enviar el correo de recordatorio
        if (appointments && appointments.length > 0) {
            for (const appt of appointments) {
                // Solo si dejó un correo válido (y no el dummy "local@barberia.app")
                if (appt.customer_email && appt.customer_email.includes('@') && !appt.customer_email.includes('local@')) {
                    // Supabase typed bindings
                    const serviceInfo = appt.services as unknown as { name: string } | { name: string }[] | null;
                    const profileInfo = appt.profiles as unknown as { full_name: string } | { full_name: string }[] | null;
                    
                    const emailHtml = await render(
                        React.createElement(BookingReminder, {
                            customerName: appt.customer_name,
                            serviceName: (Array.isArray(serviceInfo) ? serviceInfo[0]?.name : serviceInfo?.name) || 'Servicio de Barbería',
                            barberName: (Array.isArray(profileInfo) ? profileInfo[0]?.full_name : profileInfo?.full_name) || 'Tu Barbero',
                            time: new Date(appt.start_time).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })
                        })
                    );

                    const { error: resendError } = await resend.emails.send({
                        from: "onboarding@resend.dev", // Cambiar a 'citas@tudominio.com' cuando haya dominio
                        to: appt.customer_email,
                        subject: `⏰ Recordatorio de tu cita para hoy - Club Gentleman`,
                        html: emailHtml,
                    });

                    if (resendError) {
                        console.error(`Fallo enviando recordatorio a ${appt.customer_email}:`, resendError);
                    } else {
                        emailsSent.push(appt.customer_email);
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Cron job completado',
            processedCount: appointments?.length || 0,
            emailsSentCount: emailsSent.length,
            emailsSent
        });

    }  
    catch (err: unknown) {
        console.error("CRON JOB ERROR:", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}

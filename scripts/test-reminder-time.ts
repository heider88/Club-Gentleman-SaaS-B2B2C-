import { BookingReminder } from '../src/components/emails/BookingReminder';
import React from 'react';
import { render } from '@react-email/render';

async function runTest() {
    console.log("=== PRUEBA DE ZONA HORARIA EN RECORDATORIOS ===");

    // Simulamos que el cliente agendó a las 12:00 PM (Medio día) en Colombia.
    // En UTC (la base de datos) eso equivale a las 17:00:00Z.
    const appointmentUTC = "2023-11-15T17:00:00.000Z";
    
    console.log(`Hora guardada en BD (UTC): ${appointmentUTC}`);

    // Aplicamos el formateo EXACTO que pusimos en el cron job
    const formattedTime = new Date(appointmentUTC).toLocaleString('es-CO', { 
        timeZone: 'America/Bogota', 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    console.log(`Hora formateada a Colombia (America/Bogota): ${formattedTime}`);

    // Ahora simulamos el renderizado del correo de React Email
    const emailHtml = await render(
        React.createElement(BookingReminder, {
            customerName: "Juan Pérez",
            serviceName: "Corte de Cabello",
            barberName: "Carlos Barbero",
            time: formattedTime
        })
    );

    // Extraemos la línea del HTML donde se menciona la hora para verificar
    const timeInHtml = emailHtml.match(/Hora:.*?<\/td>[\s\S]*?<td.*?>([^<]+)<\/td>/i) || 
                       emailHtml.match(new RegExp(formattedTime.replace(/\./g, '\\.'), 'i')) || 
                       emailHtml.match(/>(12:00.*?)<\/Text>/) || 
                       emailHtml.match(/>([^<]*12:00[^<]*)<\/p>/) ||
                       ["", "Hora no encontrada fácilmente en regex, pero renderizó: " + formattedTime];

    console.log("\nSimulación de Correo HTML:");
    if (emailHtml.includes(formattedTime)) {
        console.log(`✅ ¡ÉXITO! El HTML final del correo sí contiene el texto: "${formattedTime}"`);
    } else {
        console.log("❌ ERROR: El HTML no contiene la hora formateada.");
    }
}

runTest().catch(console.error);

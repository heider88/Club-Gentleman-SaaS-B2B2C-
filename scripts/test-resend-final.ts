import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    console.log("Probando con la API Key de Resend...");
    const { data, error } = await resend.emails.send({
        from: 'reservas@clubgentlemanformen.com',
        to: 'heidernavarro@yopmail.com', 
        subject: 'Test Notificacion Vercel',
        html: '<p>Este es el HTML de prueba.</p>'
    });

    if (error) {
        console.error("❌ Falló el envío. Error:", error);
    } else {
        console.log("✅ ¡Éxito! Data:", data);
    }
}

test();
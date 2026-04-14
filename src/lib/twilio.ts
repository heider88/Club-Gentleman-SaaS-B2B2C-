import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log('¿Twilio SID cargado?:', !!accountSid);
console.log('¿Twilio Token cargado?:', !!authToken);

if (!accountSid || !authToken) {
    throw new Error('Faltan variables de entorno para inicializar Twilio (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
}

export const twilioClient = twilio(accountSid, authToken);

import { Resend } from "resend";

// Usamos una clave de prueba por defecto para evitar que Vercel rompa la compilación si la variable aún no ha cargado
export const mailClient = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build_step");
export const EMAIL_FROM = process.env.EMAIL_FROM || "reservas@send.clubgentlemanformen.com";




import nodemailer from "nodemailer";

export const mailClient = nodemailer.createTransport({
    host: process.env.ZEPTOMAIL_SMTP_HOST || "smtp.zeptomail.com",
    port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT || "465"),
    secure: true, 
    auth: {
        user: process.env.ZEPTOMAIL_SMTP_USER || "emailapikey",
        pass: process.env.ZEPTOMAIL_SMTP_PASS,
    },
});

export const EMAIL_FROM = process.env.EMAIL_FROM || "reservas@clubgentlemanformen.com";

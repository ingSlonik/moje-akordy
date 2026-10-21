import nodemailer from "nodemailer";
import React from "react";
import { renderToString } from "react-dom/server";

const mailHost = process.env.MAIL_SMTP;
const mailUser = process.env.MAIL_USER;
const mailPort = Number(process.env.MAIL_PORT || 587);
const mailPass = process.env.MAIL_PASSWORD;

const transporter = (mailHost && mailUser && mailPass) ? nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailPort === 465,
    auth: {
        user: mailUser,
        pass: mailPass,
    },
}) : null;

async function sendMail(mailTo: string, subject: string, html: string) {
    if (!transporter) {
        console.warn("\n⚠️  SMTP is not configured. Email was not sent.");
        console.log(`To: ${mailTo}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content HTML preview:\n${html}\n`);
        return true; // Simulate success in dev if not configured
    }

    try {
        const info = await transporter.sendMail({
            from: `"Fílův zpěvník" <${mailUser}>`,
            to: mailTo,
            subject,
            html,
        });

        return info.accepted.includes(mailTo);
    } catch (err) {
        console.error("Error sending email:", err);
        return false;
    }
}

const mailTranslations: Record<string, {
    subject: string;
    title: string;
    instruction: string;
    button: string;
    fallback: string;
    disclaimer: string;
    signoff: string;
}> = {
    cs: {
        subject: "Zapomenuté heslo",
        title: "Zapomenuté heslo",
        instruction: "Pro nastavení nového hesla klikněte na následující tlačítko:",
        button: "Změnit heslo",
        fallback: "Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:",
        disclaimer: "Pokud jste o změnu hesla nežádali, tento e-mail prosím ignorujte.",
        signoff: "S pozdravem,",
    },
    en: {
        subject: "Forgotten Password",
        title: "Forgotten Password",
        instruction: "To set your new password, click the following button:",
        button: "Change password",
        fallback: "If the button does not work, try copying this link into your browser:",
        disclaimer: "If you did not request a password change, please ignore this email.",
        signoff: "Kind regards,",
    },
    es: {
        subject: "Contraseña olvidada",
        title: "Contraseña olvidada",
        instruction: "Para configurar tu nueva contraseña, haz clic en el siguiente botón:",
        button: "Cambiar contraseña",
        fallback: "Si el botón no funciona, prueba copiando este enlace en tu navegador:",
        disclaimer: "Si no solicitaste un cambio de contraseña, ignora este correo electrónico.",
        signoff: "Saludos cordiales,",
    }
};

export async function sendMailForgottenPassword(lang: string, mailTo: string, token: string, origin: string) {
    const link = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    const t = mailTranslations[lang] || mailTranslations.en;

    const isMailSent = await sendMail(mailTo, t.subject, renderToString(
        <div style={{ fontFamily: "sans-serif", padding: 20, color: "#333" }}>
            <div style={{ backgroundColor: "#333", padding: "20px", color: "#fff", fontSize: "24px", fontWeight: "bold", textAlign: "center", borderRadius: "8px 8px 0 0" }}>
                Fílův zpěvník
            </div>
            <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "0 0 8px 8px", backgroundColor: "#fafafa" }}>
                <h2>{t.title}</h2>
                <p>{t.instruction}</p>
                <a href={link} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-block",
                    margin: "16px 0px",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    backgroundColor: "#6366f1",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: "bold",
                }}>
                    {t.button}
                </a>
                <p style={{ fontSize: "12px", color: "#777" }}>{t.fallback}</p>
                <pre style={{ backgroundColor: "#eee", padding: 10, borderRadius: 4, overflowX: "auto", fontSize: "11px" }}>{link}</pre>
                <p style={{ fontSize: "12px", color: "#999", marginTop: 20 }}>{t.disclaimer}</p>
                <p style={{ borderTop: "1px solid #eee", paddingTop: 15, marginTop: 20 }}>
                    {t.signoff}<br />
                    <strong>Fílův zpěvník Team</strong>
                </p>
            </div>
        </div>
    ));

    if (!isMailSent) {
        throw new Error("Failed to send forgotten password email.");
    }
}

import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    ...(process.env.SMTP_SERVICE
        ? { service: process.env.SMTP_SERVICE }
        : {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
        }),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
})

export async function sendVerificationEmail(email, code) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Verify your Streamify email",
        text: `Your Streamify verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Your Streamify verification code is:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 4px">${code}</p><p>This code expires in 10 minutes.</p>`,
    })
}

import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";
import dotenv from "dotenv";

dotenv.config();

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send a verification email to a newly registered patient.
 * Uses Ethereal (fake SMTP) if no SMTP credentials are configured.
 */
export const sendVerificationEmail = async (patient, token) => {
    try {
        const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
        const verifyLink = `${FRONTEND_URL}/hasta/email-dogrula?token=${token}`;

        let mailTransporter = transporter;

        // If no SMTP credentials set, create a one-time Ethereal test account
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            const testAccount = await nodemailer.createTestAccount();
            mailTransporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass },
            });
        }

        const mailOptions = {
            from: `"MediTrack Health" <${process.env.SMTP_FROM || "no-reply@meditrack.com"}>`,
            to: patient.email,
            subject: "MediTrack — E-posta Adresinizi Doğrulayın",
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #fecdd3;">
                    <div style="background: linear-gradient(135deg, #be123c, #e11d48); padding: 32px 24px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: -0.5px;">🏥 MediTrack</h1>
                        <p style="color: #fecdd3; margin: 4px 0 0; font-size: 13px;">Akıllı Sağlık Portalı</p>
                    </div>
                    <div style="padding: 32px 24px; background: #ffffff;">
                        <h2 style="color: #1e293b; margin: 0 0 12px; font-size: 20px;">Hoş Geldiniz, ${patient.name}!</h2>
                        <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
                            Hesabınız başarıyla oluşturuldu. Giriş yapabilmek için lütfen aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın.
                        </p>
                        <div style="text-align: center; margin-bottom: 24px;">
                            <a href="${verifyLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #be123c, #e11d48); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                                ✅ E-postamı Doğrula
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                            Bu bağlantı <strong>1 saat</strong> geçerlidir. Butona tıklayamazsanız aşağıdaki bağlantıyı tarayıcınıza kopyalayın:<br/>
                            <a href="${verifyLink}" style="color: #be123c; word-break: break-all;">${verifyLink}</a>
                        </p>
                    </div>
                    <div style="background: #fef2f2; padding: 16px 24px; text-align: center; border-top: 1px solid #fecdd3;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            Bu mesajı siz talep etmediyseniz güvenle görmezden gelebilirsiniz.
                        </p>
                    </div>
                </div>
            `,
        };

        const info = await mailTransporter.sendMail(mailOptions);
        console.log("\n========================================");
        console.log("[MediTrack] DOĞRULAMA E-POSTASI GÖNDERİLDİ");
        console.log(`Alıcı: ${patient.email}`);
        // Ethereal preview URL (only available for test accounts)
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧 E-posta Önizleme (Ethereal): ${previewUrl}`);
        }
        console.log("========================================\n");
    } catch (err) {
        console.error("Verification Email Error:", err);
    }
};

/**
 * Send a notification to a patient (In-App + Email)
 * @param {Object} params
 * @param {string} params.patientId - The ID of the patient
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message body
 * @param {string} params.type - One of: appointment, labResult, file, message
 * @param {string} params.link - (Optional) Dashboard link
 */
export const sendPatientNotification = async ({ patientId, title, message, type, link }) => {
    try {
        // 1. Save to Database
        const notification = await Notification.create({
            receiverId: patientId,
            receiverModel: "Patient",
            title,
            message,
            type,
            link,
        });

        // 2. Fetch Patient Email
        const patient = await Patient.findById(patientId).select("email name");
        if (patient && patient.email) {
            // 3. Send Email
            const mailOptions = {
                from: `"MediTrack Health" <${process.env.SMTP_FROM || "no-reply@meditrack.com"}>`,
                to: patient.email,
                subject: title,
                text: `${message}\n\nDetaylar için MediTrack panelinize göz atabilirsiniz: ${process.env.FRONTEND_URL || "http://localhost:5173"}${link || ""}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #ef4444;">MediTrack Bildirim</h2>
                        <p>Sayın <b>${patient.name}</b>,</p>
                        <p>${message}</p>
                        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}${link || ""}" 
                           style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">
                           Detayları Gör
                        </a>
                        <p style="font-size: 12px; color: #666; margin-top: 20px;">Bu otomatik bir bilgilendirme mesajıdır.</p>
                    </div>
                `,
            };

            await transporter.sendMail(mailOptions);
            console.log(`Email sent to: ${patient.email}`);
        }

        return notification;
    } catch (err) {
        console.error("Notification Error:", err);
    }
};




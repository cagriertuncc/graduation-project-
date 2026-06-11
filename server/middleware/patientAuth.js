import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";
import SystemSetting from "../models/SystemSetting.js";

const JWT_SECRET = process.env.JWT_SECRET || "gp_secure_secret_key";

const patientAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            // Look up directly in the Patient collection
            req.user = await Patient.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ error: "Hasta hesabı bulunamadı" });
            }

            // Check system settings for lockdown/maintenance (patients always blocked)
            const settings = await SystemSetting.findOne();
            if (settings) {
                if (settings.emergencyLockdown) {
                    return res.status(503).json({ error: "SİSTEM KİLİTLENDİ", message: "Acil durum protokolü nedeniyle sistem geçici olarak kullanıma kapatılmıştır." });
                }
                if (settings.maintenanceMode) {
                    return res.status(503).json({ error: "BAKIM MODU", message: "Sistem bakım modundadır. Lütfen daha sonra tekrar deneyiniz." });
                }
            }

            // To ensure compatibility downstream
            req.user.role = "patient";

            next();
        } catch (err) {
            return res.status(401).json({ error: "Geçersiz hasta yetkilendirmesi (Token Error)" });
        }
    } else {
        return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }
};

export default patientAuth;

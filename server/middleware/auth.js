import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";

const JWT_SECRET = process.env.JWT_SECRET || "meditrack_secret_key_2026";

// JWT token oluştur
export const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
};

// Auth middleware — korumalı route'lar için
const auth = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password").populate("profileId");

            if (!req.user) {
                return res.status(401).json({ error: "Kullanıcı bulunamadı" });
            }

            // Check system settings for lockdown/maintenance (admins and directors bypass)
            const settings = await SystemSetting.findOne();
            if (settings) {
                if (settings.emergencyLockdown && req.user.role !== "admin" && req.user.role !== "director") {
                    return res.status(503).json({ error: "SİSTEM KİLİTLENDİ", message: "Acil durum protokolü nedeniyle sistem geçici olarak kullanıma kapatılmıştır." });
                }
                if (settings.maintenanceMode && req.user.role !== "admin" && req.user.role !== "director") {
                    return res.status(503).json({ error: "BAKIM MODU", message: "Sistem bakım modundadır. Lütfen daha sonra tekrar deneyiniz." });
                }
            }

            next();
        } catch (err) {
            return res.status(401).json({ error: "Geçersiz token" });
        }
    }

    if (!token) {
        return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }
};

// Rol tabanlı erişim kontrolü middleware
export const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Yetkilendirme gerekli" });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
        }
        next();
    };
};

export default auth;

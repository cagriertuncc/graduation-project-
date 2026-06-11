import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import auth, { generateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for avatar uploads
const storage = multer.diskStorage({
    destination: path.join(__dirname, "..", "uploads"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        cb(ext && mime ? null : new Error("Sadece resim dosyaları yüklenebilir"), ext && mime);
    },
});

const router = express.Router();

// POST /api/auth/login — Kullanıcı girişi
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email ve şifre zorunludur" });
        }

        // Şifreyi de dahil ederek kullanıcıyı bul
        const user = await User.findOne({ email }).select("+password").populate("profileId");
        if (!user) {
            return res.status(401).json({ error: "Geçersiz email veya şifre" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Geçersiz email veya şifre" });
        }

        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            isAdmin: user.role === "admin",
            profileId: user.profileId?._id,
            name: user.profileId?.name,
            specialty: user.profileId?.specialty,
            avatar: user.profileId?.avatar,
            token: generateToken(user._id),
            // Legacy support depending on frontend
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/auth/me — Mevcut kullanıcı bilgileri
router.get("/me", auth, async (req, res) => {
    try {
        res.json({
            _id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            isAdmin: req.user.role === "admin",
            profileId: req.user.profileId?._id,
            name: req.user.profileId?.name,
            specialty: req.user.profileId?.specialty,
            avatar: req.user.profileId?.avatar,
            phone: req.user.profileId?.phone,
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/auth/me — Profil güncelle
router.put("/me", auth, async (req, res) => {
    try {
        const { name, specialty, phone, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password").populate("profileId");

        if (user.profileId) {
            if (name) user.profileId.name = name;
            if (phone !== undefined) user.profileId.phone = phone;
            await user.profileId.save();
        }

        // Şifre değiştirme
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: "Mevcut şifre zorunludur" });
            }
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ error: "Mevcut şifre hatalı" });
            }
            user.password = newPassword;
            await user.save(); // Only save user if password changed
        }

        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            isAdmin: user.role === "admin",
            profileId: user.profileId?._id,
            name: user.profileId?.name,
            specialty: user.profileId?.specialty,
            avatar: user.profileId?.avatar,
            phone: user.profileId?.phone,
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/auth/avatar — Avatar yükle
router.post("/avatar", auth, (req, res) => {
    upload.single("avatar")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || "Dosya yüklenemedi" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Dosya seçilmedi" });
        }
        try {
            if (req.user.profileId) {
                req.user.profileId.avatar = `/uploads/${req.file.filename}`;
                await req.user.profileId.save();
            }
            res.json({ avatar: req.user.profileId?.avatar });
        } catch (e) {
            res.status(500).json({ error: "Sunucu hatası", message: e.message });
        }
    });
});

export default router;

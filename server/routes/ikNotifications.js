import express from "express";
import auth, { roleGuard } from "../middleware/auth.js";
import IKNotification from "../models/IKNotification.js";

const router = express.Router();

// GET /api/ik-notifications — İK tüm bildirimlerini, doktor kendi bildirimlerini görür
router.get("/", auth, async (req, res) => {
    try {
        let q;
        if (req.user.role === "hr" || req.user.role === "admin") {
            q = { aliciRol: "hr" };
        } else {
            q = { aliciRol: "doctor", aliciId: req.user._id };
        }
        const notifs = await IKNotification.find(q).sort({ createdAt: -1 }).limit(50);
        res.json(notifs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/ik-notifications/:id/oku — Bildirimi okundu yap
router.patch("/:id/oku", auth, async (req, res) => {
    try {
        const notif = await IKNotification.findByIdAndUpdate(req.params.id, { okundu: true }, { new: true });
        res.json(notif);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/ik-notifications/tumu-oku — Hepsini okundu yap
router.patch("/tumu-oku", auth, async (req, res) => {
    try {
        let q;
        if (req.user.role === "hr" || req.user.role === "admin") {
            q = { aliciRol: "hr" };
        } else {
            q = { aliciRol: "doctor", aliciId: req.user._id };
        }
        await IKNotification.updateMany(q, { okundu: true });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

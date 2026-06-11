import express from "express";
import auth, { roleGuard } from "../middleware/auth.js";
import LeaveRequest from "../models/LeaveRequest.js";
import IKNotification from "../models/IKNotification.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/leave-requests — İK, admin veya müdür tüm talepleri görür
router.get("/", auth, roleGuard("hr", "admin", "director", "staff"), async (req, res) => {
    try {
        const requests = await LeaveRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/leave-requests/check — Genel erişime açık (randevu kontrolü için)
router.get("/check", async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) return res.status(400).json({ error: "Eksik parametre" });

        const checkDate = new Date(date);
        const dayStart = new Date(checkDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);

        const activeLeave = await LeaveRequest.findOne({
            doctorId,
            durum: "Onaylı",
            baslangic: { $lte: dayEnd },
            bitis: { $gte: dayStart },
        });

        if (activeLeave) {
            return res.json({
                izinli: true,
                baslangic: activeLeave.baslangic,
                bitis: activeLeave.bitis
            });
        }

        res.json({ izinli: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/leave-requests/mine — Doktor kendi taleplerini görür
router.get("/mine", auth, async (req, res) => {
    try {
        const myRequests = await LeaveRequest.find({ doctorId: req.user.profileId })
            .sort({ createdAt: -1 });
        res.json(myRequests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/leave-requests — Doktor/staff yeni talep oluşturur
router.post("/", auth, roleGuard("doctor", "staff", "admin"), async (req, res) => {
    try {
        const { tip, baslangic, bitis, aciklama } = req.body;

        if (!tip || !baslangic || !bitis) {
            return res.status(400).json({ error: "Tip, başlangıç ve bitiş tarihi zorunludur." });
        }

        const bas = new Date(baslangic);
        const bit = new Date(bitis);
        const gun = Math.ceil((bit - bas) / (1000 * 60 * 60 * 24)) + 1;

        if (gun < 1) {
            return res.status(400).json({ error: "Bitiş tarihi başlangıçtan önce olamaz." });
        }

        const docName = req.user.profileId?.name || req.user.email;

        const leave = await LeaveRequest.create({
            doctorId: req.user.profileId,
            doctorName: docName,
            doctorUserId: req.user._id,
            tip,
            baslangic: bas,
            bitis: bit,
            gun,
            aciklama: aciklama || "",
        });

        // İK'ya bildirim oluştur
        await IKNotification.create({
            aliciRol: "hr",
            tip: "izin_talebi",
            baslik: "Yeni İzin Talebi",
            mesaj: `${docName} ${gun} günlük ${tip} talebi gönderdi.`,
            kaynakId: leave._id,
        });

        res.status(201).json(leave);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/leave-requests/:id — İK veya müdür onaylar/reddeder
router.patch("/:id", auth, roleGuard("hr", "admin", "director", "staff"), async (req, res) => {
    try {
        const { durum, notlar } = req.body;
        if (!["Onaylı", "Reddedildi"].includes(durum)) {
            return res.status(400).json({ error: "Geçersiz durum." });
        }

        const leave = await LeaveRequest.findByIdAndUpdate(
            req.params.id,
            { durum, notlar: notlar || "", onaylayanId: req.user._id },
            { new: true }
        );

        if (!leave) return res.status(404).json({ error: "Talep bulunamadı." });

        // Doktora bildirim oluştur (doctorUserId kayıtlıysa)
        if (leave.doctorUserId) {
            const onayli = durum === "Onaylı";
            await IKNotification.create({
                aliciRol: "doctor",
                aliciId: leave.doctorUserId,
                tip: onayli ? "izin_onaylandi" : "izin_reddedildi",
                baslik: onayli ? "İzin Talebiniz Onaylandı ✅" : "İzin Talebiniz Reddedildi ❌",
                mesaj: onayli
                    ? `${leave.gun} günlük ${leave.tip} talebiniz İK tarafından onaylandı.`
                    : `${leave.gun} günlük ${leave.tip} talebiniz İK tarafından reddedildi.${notlar ? " Not: " + notlar : ""}`,
                kaynakId: leave._id,
            });
        }

        res.json(leave);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/leave-requests/:id — Doktor beklemedeki talebini silebilir
router.delete("/:id", auth, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Talep bulunamadı." });
        if (leave.durum !== "Beklemede") {
            return res.status(400).json({ error: "Yalnızca beklemedeki talepler silinebilir." });
        }
        await leave.deleteOne();
        res.json({ message: "Talep silindi." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

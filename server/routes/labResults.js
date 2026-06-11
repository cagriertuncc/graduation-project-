import express from "express";
import LabResult from "../models/LabResult.js";
import auth from "../middleware/auth.js";
import { sendPatientNotification } from "../utils/notify.js";

const router = express.Router();
router.use(auth);

// GET /api/lab-results — Doktorun tüm lab sonuçları
router.get("/", async (req, res) => {
    try {
        const query = { doctorId: req.user.profileId._id };
        const results = await LabResult.find(query)
            .populate("patientId", "name age gender bloodType")
            .sort({ date: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/lab-results/patient/:patientId — Hastanın lab sonuçları
router.get("/patient/:patientId", async (req, res) => {
    try {
        const results = await LabResult.find({
            doctorId: req.user.profileId._id,
            patientId: req.params.patientId,
        })
            .populate("patientId", "name age gender")
            .sort({ date: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/lab-results — Yeni lab sonucu ekle
router.post("/", async (req, res) => {
    try {
        const result = await LabResult.create({
            ...req.body,
            doctorId: req.user.profileId._id,
        });
        const populated = await result.populate("patientId", "name age gender bloodType");

        // Send Notification
        await sendPatientNotification({
            patientId: result.patientId,
            title: "Yeni Tahlil Sonucu",
            message: `${result.title} için tahlil sonuçlarınız sisteme eklendi.`,
            type: "labResult",
            link: "/dashboard?tab=lab-results"
        });

        res.status(201).json(populated);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Doğrulama hatası", messages });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/lab-results/:id — Lab sonucu güncelle
router.put("/:id", async (req, res) => {
    try {
        const result = await LabResult.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.profileId._id },
            req.body,
            { new: true, runValidators: true }
        ).populate("patientId", "name age gender bloodType");

        if (!result) return res.status(404).json({ error: "Sonuç bulunamadı" });

        // If status changed to completed, send notification
        if (req.body.status === "tamamlandı") {
            await sendPatientNotification({
                patientId: result.patientId,
                title: "Tahlil Sonucunuz Hazır",
                message: `${result.title} tahliliniz tamamlandı ve onaylandı.`,
                type: "labResult",
                link: "/dashboard?tab=lab-results"
            });
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// DELETE /api/lab-results/:id — Lab sonucu sil
router.delete("/:id", async (req, res) => {
    try {
        const result = await LabResult.findOneAndDelete({
            _id: req.params.id,
            doctorId: req.user.profileId._id,
        });
        if (!result) return res.status(404).json({ error: "Sonuç bulunamadı" });
        res.json({ message: "Lab sonucu silindi" });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

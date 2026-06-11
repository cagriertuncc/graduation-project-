import express from "express";
import Radiology from "../models/Radiology.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// GET /api/radiology — Doktorun tüm radyoloji sonuçları
router.get("/", async (req, res) => {
    try {
        const query = { doctorId: req.user.profileId._id };
        const results = await Radiology.find(query)
            .populate("patientId", "name age gender bloodType")
            .sort({ date: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/radiology/patient/:patientId — Hastanın radyoloji sonuçları
router.get("/patient/:patientId", async (req, res) => {
    try {
        const results = await Radiology.find({
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

// POST /api/radiology — Yeni radyoloji sonucu ekle
router.post("/", async (req, res) => {
    try {
        const result = await Radiology.create({
            ...req.body,
            doctorId: req.user.profileId._id,
        });
        const populated = await result.populate("patientId", "name age gender bloodType");
        res.status(201).json(populated);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Doğrulama hatası", messages });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/radiology/:id — Radyoloji sonucu güncelle
router.put("/:id", async (req, res) => {
    try {
        const result = await Radiology.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.profileId._id },
            req.body,
            { new: true, runValidators: true }
        ).populate("patientId", "name age gender bloodType");

        if (!result) return res.status(404).json({ error: "Sonuç bulunamadı" });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// DELETE /api/radiology/:id — Radyoloji sonucu sil
router.delete("/:id", async (req, res) => {
    try {
        const result = await Radiology.findOneAndDelete({
            _id: req.params.id,
            doctorId: req.user.profileId._id,
        });
        if (!result) return res.status(404).json({ error: "Sonuç bulunamadı" });
        res.json({ message: "Radyoloji sonucu silindi" });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

import express from "express";
import MedicalReport from "../models/MedicalReport.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// GET /api/medical-reports — Doktorun tüm raporları
router.get("/", async (req, res) => {
    try {
        const query = { doctorId: req.user.profileId._id };
        const reports = await MedicalReport.find(query)
            .populate("patientId", "name age gender bloodType")
            .sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/medical-reports/patient/:patientId — Hastanın raporları
router.get("/patient/:patientId", async (req, res) => {
    try {
        const reports = await MedicalReport.find({
            doctorId: req.user.profileId._id,
            patientId: req.params.patientId,
        })
            .populate("patientId", "name age gender")
            .sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/medical-reports — Yeni rapor oluştur
router.post("/", async (req, res) => {
    try {
        const report = await MedicalReport.create({
            ...req.body,
            doctorId: req.user.profileId._id,
        });
        const populated = await report.populate("patientId", "name age gender bloodType");
        res.status(201).json(populated);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Doğrulama hatası", messages });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/medical-reports/:id — Rapor güncelle
router.put("/:id", async (req, res) => {
    try {
        const report = await MedicalReport.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.profileId._id },
            req.body,
            { new: true, runValidators: true }
        ).populate("patientId", "name age gender bloodType");

        if (!report) return res.status(404).json({ error: "Rapor bulunamadı" });
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// DELETE /api/medical-reports/:id — Rapor sil
router.delete("/:id", async (req, res) => {
    try {
        const report = await MedicalReport.findOneAndDelete({
            _id: req.params.id,
            doctorId: req.user.profileId._id,
        });
        if (!report) return res.status(404).json({ error: "Rapor bulunamadı" });
        res.json({ message: "Rapor silindi" });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

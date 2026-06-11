import express from "express";
import Prescription from "../models/Prescription.js";
import auth from "../middleware/auth.js";
import { sendPatientNotification } from "../utils/notify.js";

const router = express.Router();
router.use(auth);

// GET /api/prescriptions — Doktorun tüm reçeteleri
router.get("/", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { doctorId: req.user.profileId._id };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const prescriptions = await Prescription.find(query)
            .populate("patientId", "name age gender bloodType")
            .sort({ date: -1 });

        res.json(prescriptions);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/prescriptions/patient/:patientId — Hastanın reçeteleri
router.get("/patient/:patientId", async (req, res) => {
    try {
        const prescriptions = await Prescription.find({
            doctorId: req.user.profileId._id,
            patientId: req.params.patientId,
        })
            .populate("patientId", "name age gender")
            .sort({ date: -1 });

        res.json(prescriptions);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/prescriptions — Yeni reçete yaz
router.post("/", async (req, res) => {
    try {
        const prescription = await Prescription.create({
            ...req.body,
            doctorId: req.user.profileId._id,
        });

        const populated = await prescription.populate("patientId", "name age gender bloodType");

        // Send Notification
        await sendPatientNotification({
            patientId: prescription.patientId,
            title: "Yeni Reçete Yazıldı",
            message: `Dr. ${req.user.name} tarafından yeni bir reçete yazıldı. Reçete detaylarını panelinizden görebilirsiniz.`,
            type: "message", // Adjusted to 'message' as per model enum, or I should update enum
            link: "/dashboard?tab=prescriptions"
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

export default router;

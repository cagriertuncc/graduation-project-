import express from "express";
import LabResult from "../models/LabResult.js";
import Radiology from "../models/Radiology.js";
import auth, { roleGuard } from "../middleware/auth.js";
import { sendPatientNotification } from "../utils/notify.js";

const router = express.Router();

// Apply authentication and check if role is technician or admin
router.use(auth);
router.use(roleGuard("technician", "admin"));

/**
 * GET /api/technician/lab-results
 * Get all lab results (pending, completed, abnormal) populated with patient and doctor details.
 */
router.get("/lab-results", async (req, res) => {
    try {
        const results = await LabResult.find()
            .populate("patientId", "name age gender bloodType email phone")
            .populate("doctorId", "name specialty")
            .sort({ date: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

/**
 * PUT /api/technician/lab-results/:id
 * Submit findings (results array, labName, notes) and complete a lab test.
 * Set status to 'tamamlandı' or 'anormal'.
 */
router.put("/lab-results/:id", async (req, res) => {
    try {
        const { results, labName, notes, status } = req.body;
        
        // Find existing to verify
        const labResult = await LabResult.findById(req.params.id);
        if (!labResult) {
            return res.status(404).json({ error: "Tahlil isteği bulunamadı" });
        }

        labResult.results = results !== undefined ? results : labResult.results;
        labResult.labName = labName !== undefined ? labName : labResult.labName;
        labResult.notes = notes !== undefined ? notes : labResult.notes;
        labResult.status = status || "tamamlandı";
        
        await labResult.save();
        
        await labResult.populate([
            { path: "patientId", select: "name age gender bloodType email phone" },
            { path: "doctorId", select: "name specialty" }
        ]);

        // Send patient notification
        const abnormalText = status === "anormal" ? " (Anormal Değerler Tespit Edildi)" : "";
        await sendPatientNotification({
            patientId: labResult.patientId,
            title: `Tahlil Sonucunuz Hazır${abnormalText}`,
            message: `"${labResult.testName}" tahliliniz teknisyen tarafından tamamlandı. Detayları görmek için tıklayın.`,
            type: "labResult",
            link: "/dashboard?tab=lab-results"
        });

        res.json(labResult);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Doğrulama hatası", messages });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

/**
 * GET /api/technician/radiology
 * Get all radiology requests populated with patient and doctor details.
 */
router.get("/radiology", async (req, res) => {
    try {
        const results = await Radiology.find()
            .populate("patientId", "name age gender bloodType email phone")
            .populate("doctorId", "name specialty")
            .sort({ date: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

/**
 * PUT /api/technician/radiology/:id
 * Submit findings, impression, notes and complete a radiology test.
 * Set status to 'tamamlandı' or 'anormal'.
 */
router.put("/radiology/:id", async (req, res) => {
    try {
        const { findings, impression, notes, status } = req.body;
        
        const radiology = await Radiology.findById(req.params.id);
        if (!radiology) {
            return res.status(404).json({ error: "Radyoloji isteği bulunamadı" });
        }

        radiology.findings = findings !== undefined ? findings : radiology.findings;
        radiology.impression = impression !== undefined ? impression : radiology.impression;
        radiology.notes = notes !== undefined ? notes : radiology.notes;
        radiology.status = status || "tamamlandı";

        await radiology.save();
        
        await radiology.populate([
            { path: "patientId", select: "name age gender bloodType email phone" },
            { path: "doctorId", select: "name specialty" }
        ]);

        // Send patient notification
        const abnormalText = status === "anormal" ? " (Anormal İzlenim)" : "";
        await sendPatientNotification({
            patientId: radiology.patientId,
            title: `Radyoloji Raporunuz Hazır${abnormalText}`,
            message: `"${radiology.imagingType} - ${radiology.bodyPart}" görüntüleme sonucunuz ve raporunuz teknisyen tarafından tamamlandı.`,
            type: "file",
            link: "/dashboard?tab=radiology"
        });

        res.json(radiology);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Doğrulama hatası", messages });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

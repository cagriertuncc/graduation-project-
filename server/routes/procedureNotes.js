import express from "express";
import ProcedureNote from "../models/ProcedureNote.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// GET /api/procedure-notes — Doktorun tüm işlem notları
router.get("/", async (req, res) => {
    try {
        const query = { doctorId: req.user.profileId._id };
        const notes = await ProcedureNote.find(query)
            .populate("patientId", "name age gender bloodType")
            .sort({ date: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/procedure-notes/patient/:patientId — Hastanın işlem notları
router.get("/patient/:patientId", async (req, res) => {
    try {
        const notes = await ProcedureNote.find({
            doctorId: req.user.profileId._id,
            patientId: req.params.patientId,
        })
            .populate("patientId", "name age gender")
            .sort({ date: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/procedure-notes — Yeni işlem notu ekle
router.post("/", async (req, res) => {
    try {
        const note = await ProcedureNote.create({
            ...req.body,
            doctorId: req.user.profileId._id,
        });
        const populated = await note.populate("patientId", "name age gender bloodType");
        res.status(201).json(populated);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Doğrulama hatası", messages });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/procedure-notes/:id — İşlem notu güncelle
router.put("/:id", async (req, res) => {
    try {
        const note = await ProcedureNote.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.profileId._id },
            req.body,
            { new: true, runValidators: true }
        ).populate("patientId", "name age gender bloodType");

        if (!note) return res.status(404).json({ error: "İşlem notu bulunamadı" });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// DELETE /api/procedure-notes/:id — İşlem notu sil
router.delete("/:id", async (req, res) => {
    try {
        const note = await ProcedureNote.findOneAndDelete({
            _id: req.params.id,
            doctorId: req.user.profileId._id,
        });
        if (!note) return res.status(404).json({ error: "İşlem notu bulunamadı" });
        res.json({ message: "İşlem notu silindi" });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

import express from "express";
import JournalEntry from "../models/JournalEntry.js";
import patientAuth from "../middleware/patientAuth.js";

const router = express.Router();

// ----------------------------------------------------
// GET ALL MY JOURNAL ENTRIES
// ----------------------------------------------------
router.get("/", patientAuth, async (req, res) => {
    try {
        const entries = await JournalEntry.find({ patientId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: "Günlük kayıtları alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// CREATE NEW JOURNAL ENTRY
// ----------------------------------------------------
router.post("/", patientAuth, async (req, res) => {
    try {
        const { title, content, mood, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: "Başlık ve içerik zorunludur." });
        }

        const entry = await JournalEntry.create({
            patientId: req.user.id,
            title: title.trim(),
            content: content.trim(),
            mood: mood || "😊",
            tags: tags || [],
        });

        res.status(201).json({ message: "Günlük kaydı oluşturuldu.", data: entry });
    } catch (err) {
        res.status(500).json({ error: "Günlük kaydı oluşturulamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// UPDATE JOURNAL ENTRY
// ----------------------------------------------------
router.put("/:id", patientAuth, async (req, res) => {
    try {
        const { title, content, mood, tags } = req.body;

        const entry = await JournalEntry.findOneAndUpdate(
            { _id: req.params.id, patientId: req.user.id },
            {
                title: title?.trim(),
                content: content?.trim(),
                mood,
                tags,
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ error: "Kayıt bulunamadı veya yetkiniz yok." });
        }

        res.json({ message: "Günlük kaydı güncellendi.", data: entry });
    } catch (err) {
        res.status(500).json({ error: "Güncelleme başarısız.", message: err.message });
    }
});

// ----------------------------------------------------
// DELETE JOURNAL ENTRY
// ----------------------------------------------------
router.delete("/:id", patientAuth, async (req, res) => {
    try {
        const entry = await JournalEntry.findOneAndDelete({
            _id: req.params.id,
            patientId: req.user.id,
        });

        if (!entry) {
            return res.status(404).json({ error: "Kayıt bulunamadı veya yetkiniz yok." });
        }

        res.json({ message: "Günlük kaydı silindi." });
    } catch (err) {
        res.status(500).json({ error: "Silme işlemi başarısız.", message: err.message });
    }
});

export default router;

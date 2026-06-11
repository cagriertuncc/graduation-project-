import express from "express";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Tüm route'lar auth gerektirir
router.use(auth);

// GET /api/patients — Doktorun tüm hastaları
router.get("/", async (req, res) => {
    try {
        const { search, status, sort } = req.query;

        let query = { isDeleted: { $ne: true } };

        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            const doctorId = req.user.profileId._id;
            const patientIdsWithAppointments = await Appointment.distinct("patientId", { doctorId });
            query.$or = [
                { doctorId: doctorId },
                { _id: { $in: patientIdsWithAppointments } }
            ];
        }

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        let sortObj = { createdAt: -1 };
        if (sort === "name") sortObj = { name: 1 };
        if (sort === "age") sortObj = { age: -1 };
        if (sort === "registeredDate") sortObj = { registeredDate: -1 };

        const patients = await Patient.find(query).populate("doctorId", "name").sort(sortObj);
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/patients/stats — Hasta istatistikleri
router.get("/stats", async (req, res) => {
    try {
        const query = (req.user.role === "admin" || req.user.role === "receptionist") ? { isDeleted: { $ne: true } } : { doctorId: req.user.profileId._id, isDeleted: { $ne: true } };
        const patients = await Patient.find(query);
        const allDiseases = patients.flatMap(p => p.diseases);

        res.json({
            totalPatients: patients.length,
            activePatients: patients.filter(p => p.status === "active").length,
            activeDiseases: allDiseases.filter(d => d.status === "tedavi").length,
            recoveredDiseases: allDiseases.filter(d => d.status === "iyileşti").length,
            seriousCases: allDiseases.filter(d => d.severity === "ciddi" && d.status === "tedavi").length,
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/patients/:id — Hasta detayı
router.get("/:id", async (req, res) => {
    try {
        const patientId = req.params.id;
        let query = { _id: patientId };

        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            const doctorId = req.user.profileId._id;
            const hasAppointment = await Appointment.exists({ patientId: patientId, doctorId: doctorId });

            if (!hasAppointment) {
                query.doctorId = doctorId;
            }
        }

        const patient = await Patient.findOne(query).populate("doctorId", "name");

        if (!patient) {
            return res.status(404).json({ error: "Hasta bulunamadı" });
        }

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/patients — Yeni hasta ekle
router.post("/", async (req, res) => {
    try {
        // If admin or receptionist, they can specify doctorId (or leave empty). If not, force it to doctor's own ID.
        const targetDoctorId = (req.user.role === "admin" || req.user.role === "receptionist") ? (req.body.doctorId || undefined) : req.user.profileId._id;

        const patient = await Patient.create({
            ...req.body,
            doctorId: targetDoctorId,
        });
        res.status(201).json(patient);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Doğrulama hatası", messages });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/patients/:id — Hasta bilgilerini güncelle
router.put("/:id", async (req, res) => {
    try {
        const patientId = req.params.id;
        let query = { _id: patientId };

        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            const doctorId = req.user.profileId._id;
            const hasAppointment = await Appointment.exists({ patientId: patientId, doctorId: doctorId });

            if (!hasAppointment) {
                query.doctorId = doctorId;
            }
        }

        // If admin or receptionist is updating the doctor connection, use req.body.doctorId if provided.
        // Otherwise ignore it because normal doctors can't transfer patients
        const updateData = { ...req.body };
        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            delete updateData.doctorId;
        }

        const patient = await Patient.findOneAndUpdate(
            query,
            updateData,
            { new: true, runValidators: true }
        ).populate("doctorId", "name");

        if (!patient) {
            return res.status(404).json({ error: "Hasta bulunamadı" });
        }

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// DELETE /api/patients/:id — Hasta sil
router.delete("/:id", async (req, res) => {
    try {
        const patientId = req.params.id;
        let query = { _id: patientId };

        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            const doctorId = req.user.profileId._id;
            const hasAppointment = await Appointment.exists({ patientId: patientId, doctorId: doctorId });

            if (!hasAppointment) {
                query.doctorId = doctorId;
            }
        }

        const patient = await Patient.findOneAndDelete(query);

        if (!patient) {
            return res.status(404).json({ error: "Hasta bulunamadı" });
        }

        res.json({ message: "Hasta silindi", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/patients/:id/diseases — Hasta'ya hastalık ekle
router.post("/:id/diseases", async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            query.doctorId = req.user.profileId._id;
        }
        const patient = await Patient.findOne(query);

        if (!patient) {
            return res.status(404).json({ error: "Hasta bulunamadı" });
        }

        patient.diseases.push(req.body);
        await patient.save();

        res.status(201).json(patient);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/patients/:id/diseases/:diseaseId — Hastalık güncelle
router.put("/:id/diseases/:diseaseId", async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            query.doctorId = req.user.profileId._id;
        }
        const patient = await Patient.findOne(query);

        if (!patient) {
            return res.status(404).json({ error: "Hasta bulunamadı" });
        }

        const disease = patient.diseases.id(req.params.diseaseId);
        if (!disease) {
            return res.status(404).json({ error: "Hastalık bulunamadı" });
        }

        Object.assign(disease, req.body);
        await patient.save();

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

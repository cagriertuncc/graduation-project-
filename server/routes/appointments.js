import express from "express";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import LeaveRequest from "../models/LeaveRequest.js";
import auth from "../middleware/auth.js";
import { sendPatientNotification } from "../utils/notify.js";

const router = express.Router();
router.use(auth);

// GET /api/appointments — Doktorun randevuları
router.get("/", async (req, res) => {
    try {
        const { date, startDate, endDate, status, patientId } = req.query;
        const query = (req.user.role === "admin" || req.user.role === "receptionist") ? {} : { doctorId: req.user.profileId._id };

        // Tek gün filtresi
        if (date) {
            const dayStart = new Date(date + "T00:00:00.000Z");
            const dayEnd = new Date(date + "T23:59:59.999Z");
            query.date = { $gte: dayStart, $lte: dayEnd };
        }

        // Tarih aralığı filtresi
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate + "T00:00:00.000Z"),
                $lte: new Date(endDate + "T23:59:59.999Z"),
            };
        }

        if (status) query.status = status;
        if (patientId) query.patientId = patientId;

        const appointments = await Appointment.find(query)
            .populate("patientId", "name age gender bloodType phone")
            .populate("doctorId", "name specialty")
            .sort({ date: 1, time: 1 });

        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/appointments/stats — İstatistikler
router.get("/stats", async (req, res) => {
    try {
        const { period } = req.query; // "day", "week", "month"
        const now = new Date();
        let startDate;

        if (period === "day") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === "week") {
            const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek);
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const query = { date: { $gte: startDate } };
        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            query.doctorId = req.user.profileId._id;
        }

        const appointments = await Appointment.find(query);

        const total = appointments.length;
        const waiting = appointments.filter(a => a.status === "bekliyor").length;
        const completed = appointments.filter(a => a.status === "tamamlandı").length;
        const cancelled = appointments.filter(a => a.status === "iptal").length;

        // Tür dağılımı
        const typeDistribution = {};
        appointments.forEach(a => {
            typeDistribution[a.type] = (typeDistribution[a.type] || 0) + 1;
        });

        // Saatlik dağılım
        const hourlyDistribution = {};
        appointments.forEach(a => {
            const hour = a.time.split(":")[0];
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        });

        res.json({
            total,
            waiting,
            completed,
            cancelled,
            typeDistribution,
            hourlyDistribution,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/appointments/next — Sonraki randevu
router.get("/next", async (req, res) => {
    try {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const query = {
            status: "bekliyor",
            $or: [
                { date: { $gt: new Date(todayStr + "T23:59:59.999Z") } },
                {
                    date: { $gte: new Date(todayStr + "T00:00:00.000Z"), $lte: new Date(todayStr + "T23:59:59.999Z") },
                    time: { $gte: currentTime },
                },
            ],
        };

        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            query.doctorId = req.user.profileId._id;
        }

        const appointment = await Appointment.findOne(query)
            .populate("patientId", "name age gender bloodType")
            .populate("doctorId", "name")
            .sort({ date: 1, time: 1 });

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/appointments — Yeni randevu
router.post("/", async (req, res) => {
    try {
        // Admin or Receptionist can set doctorId, otherwise fallback to doctor's own ID
        const targetDoctorId = (req.user.role === "admin" || req.user.role === "receptionist") && req.body.doctorId ? req.body.doctorId : req.user.profileId._id;

        // Kara liste kontrolü
        if (req.body.patientId) {
            const patient = await Patient.findById(req.body.patientId);
            if (patient && patient.isBlacklisted) {
                return res.status(403).json({ error: "Bu hasta kara listede olduğu için randevu oluşturulamaz." });
            }
        }

        // ── İzin dönemi kontrolü ──────────────────────────────────────
        // Doktorun onaylı izni var mı, randevu tarihi izin aralığına giriyor mu?
        const apptDate = new Date(req.body.date);
        const apptDayStart = new Date(apptDate);
        apptDayStart.setHours(0, 0, 0, 0);
        const apptDayEnd = new Date(apptDate);
        apptDayEnd.setHours(23, 59, 59, 999);

        const activeLeave = await LeaveRequest.findOne({
            doctorId: targetDoctorId,
            durum: "Onaylı",
            baslangic: { $lte: apptDayEnd },
            bitis: { $gte: apptDayStart },
        });

        if (activeLeave) {
            const bas = new Date(activeLeave.baslangic).toLocaleDateString("tr-TR");
            const bit = new Date(activeLeave.bitis).toLocaleDateString("tr-TR");
            return res.status(400).json({
                error: `Bu doktor ${bas} - ${bit} tarihleri arasında izinlidir. Lütfen farklı bir tarih seçin.`
            });
        }
        // ─────────────────────────────────────────────────────────────

        // Aynı saatte çakışma kontrolü
        const existing = await Appointment.findOne({
            doctorId: targetDoctorId,
            date: req.body.date,
            time: req.body.time,
            status: { $ne: "iptal" },
        });

        if (existing) {
            return res.status(400).json({ error: "Bu saatte zaten bir randevu var" });
        }

        const appointment = await Appointment.create({
            ...req.body,
            doctorId: targetDoctorId,
        });

        const populated = await appointment.populate([
            { path: "patientId", select: "name age gender bloodType" },
            { path: "doctorId", select: "name specialty" }
        ]);

        // Send Notification if patientId is present
        if (appointment.patientId) {
            await sendPatientNotification({
                patientId: appointment.patientId,
                title: "Randevunuz Oluşturuldu",
                message: `${new Date(appointment.date).toLocaleDateString('tr-TR')} tarihinde saat ${appointment.time}'da Dr. ${populated.doctorId.name} (${populated.doctorId.specialty}) ile randevunuz oluşturulmuştur.`,
                type: "appointment",
                link: "/dashboard"
            });
        }

        res.status(201).json(populated);
    } catch (err) {
        if (err.name === "ValidationError" || err.message.includes("Pazar") || err.message.includes("Cumartesi")) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});


// PUT /api/appointments/:id — Randevu güncelle
router.put("/:id", async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            query.doctorId = req.user.profileId._id;
        }

        const updateData = { ...req.body };
        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            delete updateData.doctorId;
        }

        const appointment = await Appointment.findOneAndUpdate(
            query,
            updateData,
            { new: true, runValidators: true }
        ).populate("patientId", "name age gender bloodType").populate("doctorId", "name");

        if (!appointment) {
            return res.status(404).json({ error: "Randevu bulunamadı" });
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// DELETE /api/appointments/:id — Randevu sil
router.delete("/:id", async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== "admin" && req.user.role !== "receptionist") {
            query.doctorId = req.user.profileId._id;
        }

        const appointment = await Appointment.findOneAndDelete(query);

        if (!appointment) {
            return res.status(404).json({ error: "Randevu bulunamadı" });
        }

        res.json({ message: "Randevu silindi", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

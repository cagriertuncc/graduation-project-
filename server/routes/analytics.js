import express from "express";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import LabResult from "../models/LabResult.js";
import Radiology from "../models/Radiology.js";
import MedicalReport from "../models/MedicalReport.js";
import ProcedureNote from "../models/ProcedureNote.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// GET /api/analytics/overview — Genel istatistikler
router.get("/overview", async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? {} : { doctorId: req.user.profileId._id };
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            totalPatients,
            totalPrescriptions,
            totalAppointments,
            totalLabResults,
            totalRadiology,
            totalReports,
            totalProcedures,
            thisMonthPatients,
            lastMonthPatients,
            thisMonthAppointments,
            lastMonthAppointments,
        ] = await Promise.all([
            Patient.countDocuments(filter),
            Prescription.countDocuments(filter),
            Appointment.countDocuments(filter),
            LabResult.countDocuments(filter),
            Radiology.countDocuments(filter),
            MedicalReport.countDocuments(filter),
            ProcedureNote.countDocuments(filter),
            Patient.countDocuments({ ...filter, createdAt: { $gte: thisMonth } }),
            Patient.countDocuments({ ...filter, createdAt: { $gte: lastMonth, $lt: thisMonth } }),
            Appointment.countDocuments({ ...filter, date: { $gte: thisMonth } }),
            Appointment.countDocuments({ ...filter, date: { $gte: lastMonth, $lt: thisMonth } }),
        ]);

        res.json({
            totalPatients,
            totalPrescriptions,
            totalAppointments,
            totalLabResults,
            totalRadiology,
            totalReports,
            totalProcedures,
            thisMonthPatients,
            lastMonthPatients,
            thisMonthAppointments,
            lastMonthAppointments,
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/analytics/monthly-patients — 12 aylık hasta trendi
router.get("/monthly-patients", async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? {} : { doctorId: req.user.profileId._id };
        const now = new Date();
        const months = [];

        for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = await Patient.countDocuments({
                ...filter,
                createdAt: { $gte: start, $lt: end },
            });
            months.push({
                month: start.toLocaleDateString("tr-TR", { month: "short", year: "numeric" }),
                count,
            });
        }

        res.json(months);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/analytics/top-diagnoses — En sık konulan tanılar
router.get("/top-diagnoses", async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? {} : { doctorId: req.user.profileId._id };
        const result = await Prescription.aggregate([
            { $match: filter },
            { $group: { _id: "$diagnosis", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { diagnosis: "$_id", count: 1, _id: 0 } },
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/analytics/medication-distribution — İlaç dağılımı
router.get("/medication-distribution", async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? {} : { doctorId: req.user.profileId._id };
        const result = await Prescription.aggregate([
            { $match: filter },
            { $unwind: "$medications" },
            { $group: { _id: "$medications.name", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { medication: "$_id", count: 1, _id: 0 } },
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/analytics/patient-demographics — Hasta demografisi
router.get("/patient-demographics", async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? {} : { doctorId: req.user.profileId._id };

        const genderDist = await Patient.aggregate([
            { $match: filter },
            { $group: { _id: "$gender", count: { $sum: 1 } } },
            { $project: { gender: "$_id", count: 1, _id: 0 } },
        ]);

        const bloodTypeDist = await Patient.aggregate([
            { $match: filter },
            { $group: { _id: "$bloodType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { bloodType: "$_id", count: 1, _id: 0 } },
        ]);

        const ageDist = await Patient.aggregate([
            { $match: filter },
            {
                $bucket: {
                    groupBy: "$age",
                    boundaries: [0, 18, 30, 45, 60, 75, 120],
                    default: "Bilinmeyen",
                    output: { count: { $sum: 1 } },
                },
            },
        ]);

        const ageLabels = { 0: "0-17", 18: "18-29", 30: "30-44", 45: "45-59", 60: "60-74", 75: "75+" };
        const ageDistLabeled = ageDist.map(a => ({
            range: ageLabels[a._id] || a._id,
            count: a.count,
        }));

        res.json({ genderDist, bloodTypeDist, ageDist: ageDistLabeled });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/analytics/revenue — Gelir takibi (muayene + işlem bazlı)
router.get("/revenue", async (req, res) => {
    try {
        if (req.user.role === "admin" && req.user.profileId?.specialty !== "Bilgi İşlem Müdürü") {
            return res.status(403).json({ error: "Erişim engellendi. Bu rapor sadece Bilgi İşlem Müdürü yetkisindedir." });
        }
        const filter = req.user.role === "admin" ? {} : { doctorId: req.user.profileId._id };
        const now = new Date();

        // Fiyat tablosu (TL) — varsayılan birim fiyatlar
        const PRICES = {
            appointment: 500,
            labResult: 250,
            radiology: 400,
            medicalReport: 150,
            procedure: {
                "Ameliyat": 5000,
                "Küçük Cerrahi": 2000,
                "Biyopsi": 1500,
                "Endoskopi": 2500,
                "Enjeksiyon": 300,
                "Pansuman": 200,
                "Diğer": 500,
            },
        };

        // Aylık gelir trendi (son 12 ay)
        const monthlyRevenue = [];
        for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const dateFilter = { $gte: start, $lt: end };

            const [appts, labs, rads, reports, procs] = await Promise.all([
                Appointment.countDocuments({ ...filter, date: dateFilter }),
                LabResult.countDocuments({ ...filter, date: dateFilter }),
                Radiology.countDocuments({ ...filter, date: dateFilter }),
                MedicalReport.countDocuments({ ...filter, createdAt: dateFilter }),
                ProcedureNote.find({ ...filter, date: dateFilter }).select("procedureType").lean(),
            ]);

            const procRevenue = procs.reduce((sum, p) => sum + (PRICES.procedure[p.procedureType] || 500), 0);
            const total = (appts * PRICES.appointment) +
                (labs * PRICES.labResult) +
                (rads * PRICES.radiology) +
                (reports * PRICES.medicalReport) +
                procRevenue;

            monthlyRevenue.push({
                month: start.toLocaleDateString("tr-TR", { month: "short", year: "numeric" }),
                appointments: appts * PRICES.appointment,
                labResults: labs * PRICES.labResult,
                radiology: rads * PRICES.radiology,
                reports: reports * PRICES.medicalReport,
                procedures: procRevenue,
                total,
            });
        }

        // Kategori bazlı toplam
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthFilter = { $gte: thisMonthStart };

        const [totalAppts, totalLabs, totalRads, totalReports, totalProcs] = await Promise.all([
            Appointment.countDocuments({ ...filter, date: thisMonthFilter }),
            LabResult.countDocuments({ ...filter, date: thisMonthFilter }),
            Radiology.countDocuments({ ...filter, date: thisMonthFilter }),
            MedicalReport.countDocuments({ ...filter, createdAt: thisMonthFilter }),
            ProcedureNote.find({ ...filter, date: thisMonthFilter }).select("procedureType").lean(),
        ]);

        const totalProcRevenue = totalProcs.reduce((sum, p) => sum + (PRICES.procedure[p.procedureType] || 500), 0);

        const thisMonthSummary = {
            appointments: { count: totalAppts, revenue: totalAppts * PRICES.appointment },
            labResults: { count: totalLabs, revenue: totalLabs * PRICES.labResult },
            radiology: { count: totalRads, revenue: totalRads * PRICES.radiology },
            reports: { count: totalReports, revenue: totalReports * PRICES.medicalReport },
            procedures: { count: totalProcs.length, revenue: totalProcRevenue },
            total: (totalAppts * PRICES.appointment) + (totalLabs * PRICES.labResult) +
                (totalRads * PRICES.radiology) + (totalReports * PRICES.medicalReport) + totalProcRevenue,
        };

        // İşlem türü bazlı gelir dağılımı
        const allProcs = await ProcedureNote.find(filter).select("procedureType").lean();
        const procByType = {};
        allProcs.forEach(p => {
            const type = p.procedureType || "Diğer";
            if (!procByType[type]) procByType[type] = { count: 0, revenue: 0 };
            procByType[type].count++;
            procByType[type].revenue += PRICES.procedure[type] || 500;
        });

        res.json({ monthlyRevenue, thisMonthSummary, procByType, prices: PRICES });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

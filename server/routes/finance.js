import express from "express";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import LabResult from "../models/LabResult.js";
import Radiology from "../models/Radiology.js";
import MedicalReport from "../models/MedicalReport.js";
import ProcedureNote from "../models/ProcedureNote.js";
import auth, { roleGuard } from "../middleware/auth.js";

const router = express.Router();

// All finance routes require auth + accountant or admin role
router.use(auth);
router.use(roleGuard("accountant", "admin"));

// Birim fiyat tablosu
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

const calcProcRevenue = (procs) =>
    procs.reduce((sum, p) => sum + (PRICES.procedure[p.procedureType] || 500), 0);

// ─── GET /api/finance/summary ─────────────────────────────────────────────────
// Bu ay vs geçen ay karşılaştırmalı özet
router.get("/summary", async (req, res) => {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = thisMonthStart;

        const buildMonthRevenue = async (start, end) => {
            const dateFilter = end
                ? { $gte: start, $lt: end }
                : { $gte: start };
            const [appts, labs, rads, reports, procs] = await Promise.all([
                Appointment.countDocuments({ date: dateFilter }),
                LabResult.countDocuments({ date: dateFilter }),
                Radiology.countDocuments({ date: dateFilter }),
                MedicalReport.countDocuments({ createdAt: dateFilter }),
                ProcedureNote.find({ date: dateFilter }).select("procedureType").lean(),
            ]);
            const procRev = calcProcRevenue(procs);
            return {
                revenue: appts * PRICES.appointment + labs * PRICES.labResult +
                    rads * PRICES.radiology + reports * PRICES.medicalReport + procRev,
                appointments: appts,
                patients: 0, // filled below
            };
        };

        const [thisMonth, lastMonth, totalPatients, totalAppointments] = await Promise.all([
            buildMonthRevenue(thisMonthStart, null),
            buildMonthRevenue(lastMonthStart, lastMonthEnd),
            Patient.countDocuments(),
            Appointment.countDocuments(),
        ]);

        // Patient counts this/last month
        const [thisMonthPatients, lastMonthPatients] = await Promise.all([
            Patient.countDocuments({ createdAt: { $gte: thisMonthStart } }),
            Patient.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } }),
        ]);

        thisMonth.patients = thisMonthPatients;
        lastMonth.patients = lastMonthPatients;

        const revenueGrowth = lastMonth.revenue > 0
            ? Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100)
            : 100;

        res.json({
            thisMonth,
            lastMonth,
            revenueGrowth,
            totalPatients,
            totalAppointments,
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// ─── GET /api/finance/monthly-revenue ─────────────────────────────────────────
// Son 12 ay aylık gelir trendi
router.get("/monthly-revenue", async (req, res) => {
    try {
        const now = new Date();
        const months = [];

        for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const dateFilter = { $gte: start, $lt: end };

            const [appts, labs, rads, reports, procs] = await Promise.all([
                Appointment.countDocuments({ date: dateFilter }),
                LabResult.countDocuments({ date: dateFilter }),
                Radiology.countDocuments({ date: dateFilter }),
                MedicalReport.countDocuments({ createdAt: dateFilter }),
                ProcedureNote.find({ date: dateFilter }).select("procedureType").lean(),
            ]);

            const procRev = calcProcRevenue(procs);
            const total =
                appts * PRICES.appointment +
                labs * PRICES.labResult +
                rads * PRICES.radiology +
                reports * PRICES.medicalReport +
                procRev;

            months.push({
                month: start.toLocaleDateString("tr-TR", { month: "short", year: "numeric" }),
                shortMonth: start.toLocaleDateString("tr-TR", { month: "short" }),
                appointments: appts * PRICES.appointment,
                labResults: labs * PRICES.labResult,
                radiology: rads * PRICES.radiology,
                reports: reports * PRICES.medicalReport,
                procedures: procRev,
                total,
                counts: { appts, labs, rads, reports, procs: procs.length },
            });
        }

        res.json(months);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// ─── GET /api/finance/category-breakdown ──────────────────────────────────────
// Bu ay kategori bazlı gelir detayı
router.get("/category-breakdown", async (req, res) => {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateFilter = { $gte: thisMonthStart };

        const [appts, labs, rads, reports, procs] = await Promise.all([
            Appointment.countDocuments({ date: dateFilter }),
            LabResult.countDocuments({ date: dateFilter }),
            Radiology.countDocuments({ date: dateFilter }),
            MedicalReport.countDocuments({ createdAt: dateFilter }),
            ProcedureNote.find({ date: dateFilter }).select("procedureType").lean(),
        ]);

        const procRev = calcProcRevenue(procs);
        const total =
            appts * PRICES.appointment +
            labs * PRICES.labResult +
            rads * PRICES.radiology +
            reports * PRICES.medicalReport +
            procRev;

        res.json({
            total,
            categories: {
                appointments: { count: appts, revenue: appts * PRICES.appointment },
                labResults: { count: labs, revenue: labs * PRICES.labResult },
                radiology: { count: rads, revenue: rads * PRICES.radiology },
                reports: { count: reports, revenue: reports * PRICES.medicalReport },
                procedures: { count: procs.length, revenue: procRev },
            },
            prices: PRICES,
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// ─── GET /api/finance/recent-appointments ─────────────────────────────────────
// Son 20 randevu (finansal tablo için)
router.get("/recent-appointments", async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate("patientId", "name")
            .populate("doctorId", "name specialty")
            .sort({ date: -1 })
            .limit(20)
            .lean();

        const formatted = appointments.map(a => ({
            _id: a._id,
            patientName: a.patientId?.name || "Bilinmiyor",
            doctorName: a.doctorId?.name || "Bilinmiyor",
            specialty: a.doctorId?.specialty || "-",
            date: a.date,
            type: a.type || "Muayene",
            status: a.status || "confirmed",
            amount: PRICES.appointment,
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// ─── GET /api/finance/kpi?period=today|month|year ─────────────────────────────
// 6 büyük KPI kartı için — Günlük, Aylık, Fatura, Ödenmemiş, Tahsil, SGK
router.get("/kpi", async (req, res) => {
    try {
        const now = new Date();
        const period = req.query.period || "month"; // today | month | year

        // ── Date range helpers ────────────────────────────
        const ranges = {
            today: {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
                prevStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
                prevEnd: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            },
            month: {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
                prevStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                prevEnd: new Date(now.getFullYear(), now.getMonth(), 1),
            },
            year: {
                start: new Date(now.getFullYear(), 0, 1),
                end: new Date(now.getFullYear() + 1, 0, 1),
                prevStart: new Date(now.getFullYear() - 1, 0, 1),
                prevEnd: new Date(now.getFullYear(), 0, 1),
            },
        };
        const { start, end, prevStart, prevEnd } = ranges[period] || ranges.month;

        const dateF = { $gte: start, $lt: end };
        const prevDateF = { $gte: prevStart, $lt: prevEnd };

        // ── Current period counts ────────────────────────
        const [
            appts, labs, rads, reports, procs,
            pendingAppts, completedAppts,
            prevAppts, prevLabs, prevRads, prevReports, prevProcs,
        ] = await Promise.all([
            // Current — all
            Appointment.countDocuments({ date: dateF }),
            LabResult.countDocuments({ date: dateF }),
            Radiology.countDocuments({ date: dateF }),
            MedicalReport.countDocuments({ createdAt: dateF }),
            ProcedureNote.find({ date: dateF }).select("procedureType").lean(),
            // Current — pending
            Appointment.countDocuments({ date: dateF, status: "pending" }),
            // Current — completed/confirmed
            Appointment.countDocuments({ date: dateF, status: { $in: ["confirmed", "completed"] } }),
            // Previous period for comparison
            Appointment.countDocuments({ date: prevDateF }),
            LabResult.countDocuments({ date: prevDateF }),
            Radiology.countDocuments({ date: prevDateF }),
            MedicalReport.countDocuments({ createdAt: prevDateF }),
            ProcedureNote.find({ date: prevDateF }).select("procedureType").lean(),
        ]);

        const procRev = calcProcRevenue(procs);
        const prevProcRev = calcProcRevenue(prevProcs);

        const totalRevenue = appts * PRICES.appointment + labs * PRICES.labResult +
            rads * PRICES.radiology + reports * PRICES.medicalReport + procRev;

        const prevRevenue = prevAppts * PRICES.appointment + prevLabs * PRICES.labResult +
            prevRads * PRICES.radiology + prevReports * PRICES.medicalReport + prevProcRev;

        // Total invoices = all service records in period
        const invoiceCount = appts + labs + rads + reports + procs.length;
        const prevInvoiceCount = prevAppts + prevLabs + prevRads + prevReports + prevProcs.length;

        // Ödenmemiş = pending appointments × unit price
        const unpaidRevenue = pendingAppts * PRICES.appointment;
        const unpaidCount = pendingAppts;

        // Tahsil Edilen = confirmed + completed appointments × price
        const collectedRevenue = completedAppts * PRICES.appointment;
        const collectedCount = completedAppts;

        // SGK/Sigorta Bekleyen — simulate as 30% of total + all lab/radiology (typically insured)
        const sgkPending = Math.round((labs * PRICES.labResult + rads * PRICES.radiology) * 0.7 +
            totalRevenue * 0.15);
        const sgkCount = labs + rads;

        const pctChange = (curr, prev) =>
            prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

        res.json({
            period,
            dateRange: { start, end },
            kpis: {
                dailyRevenue: {
                    label: period === "today" ? "Günlük Gelir" : period === "month" ? "Aylık Gelir" : "Yıllık Gelir",
                    value: totalRevenue,
                    prev: prevRevenue,
                    change: pctChange(totalRevenue, prevRevenue),
                    icon: "money",
                },
                monthlyRevenue: {
                    label: "Toplam Gelir",
                    value: totalRevenue,
                    prev: prevRevenue,
                    change: pctChange(totalRevenue, prevRevenue),
                    icon: "calendar",
                },
                invoiceCount: {
                    label: "Kesilen Fatura",
                    value: invoiceCount,
                    prev: prevInvoiceCount,
                    change: pctChange(invoiceCount, prevInvoiceCount),
                    amount: invoiceCount * PRICES.appointment,
                    icon: "invoice",
                },
                unpaidInvoices: {
                    label: "Ödenmemiş Faturalar",
                    value: unpaidCount,
                    amount: unpaidRevenue,
                    prev: 0,
                    change: 0,
                    icon: "unpaid",
                },
                collectedAmount: {
                    label: "Tahsil Edilen",
                    value: collectedRevenue,
                    count: collectedCount,
                    prev: 0,
                    change: collectedRevenue > 0 && totalRevenue > 0
                        ? Math.round((collectedRevenue / totalRevenue) * 100)
                        : 0,
                    icon: "collected",
                },
                sgkPending: {
                    label: "SGK / Sigorta Bekleyen",
                    value: sgkPending,
                    count: sgkCount,
                    prev: 0,
                    change: 0,
                    icon: "sgk",
                },
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// ─── GET /api/finance/charts ──────────────────────────────────────────────────
// 4 grafik için veri: günlük (saatlik), aylık (günlük), yıllık (aylık), karşılaştırma
router.get("/charts", async (req, res) => {
    try {
        const now = new Date();

        // ── 1) Günlük: today's breakdown by 4-hour blocks ─────────────────────
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dailyBlocks = [];
        for (let h = 0; h < 24; h += 3) {
            const blockStart = new Date(todayStart); blockStart.setHours(h);
            const blockEnd = new Date(todayStart); blockEnd.setHours(h + 3);
            const df = { $gte: blockStart, $lt: blockEnd };
            const [a, l, r, rep, p] = await Promise.all([
                Appointment.countDocuments({ date: df }),
                LabResult.countDocuments({ date: df }),
                Radiology.countDocuments({ date: df }),
                MedicalReport.countDocuments({ createdAt: df }),
                ProcedureNote.find({ date: df }).select("procedureType").lean(),
            ]);
            const total = a * PRICES.appointment + l * PRICES.labResult +
                r * PRICES.radiology + rep * PRICES.medicalReport + calcProcRevenue(p);
            dailyBlocks.push({
                label: `${String(h).padStart(2, "0")}:00`,
                total, appointments: a * PRICES.appointment,
                labResults: l * PRICES.labResult, radiology: r * PRICES.radiology,
                reports: rep * PRICES.medicalReport, procedures: calcProcRevenue(p),
            });
        }

        // ── 2) Aylık: current month — per week (7-day blocks) ─────────────────
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const weeklyBlocks = [];
        for (let w = 0; w < 5; w++) {
            const dayFrom = w * 7 + 1;
            const dayTo = Math.min(dayFrom + 6, daysInMonth);
            if (dayFrom > daysInMonth) break;
            const wStart = new Date(now.getFullYear(), now.getMonth(), dayFrom);
            const wEnd = new Date(now.getFullYear(), now.getMonth(), dayTo + 1);
            const df = { $gte: wStart, $lt: wEnd };
            const [a, l, r, rep, p] = await Promise.all([
                Appointment.countDocuments({ date: df }),
                LabResult.countDocuments({ date: df }),
                Radiology.countDocuments({ date: df }),
                MedicalReport.countDocuments({ createdAt: df }),
                ProcedureNote.find({ date: df }).select("procedureType").lean(),
            ]);
            const total = a * PRICES.appointment + l * PRICES.labResult +
                r * PRICES.radiology + rep * PRICES.medicalReport + calcProcRevenue(p);
            weeklyBlocks.push({ label: `H${w + 1}`, dayRange: `${dayFrom}-${dayTo}`, total, appointments: a * PRICES.appointment, labResults: l * PRICES.labResult, radiology: r * PRICES.radiology, reports: rep * PRICES.medicalReport, procedures: calcProcRevenue(p) });
        }

        // ── 3) Yıllık: last 12 months (already built, return monthly totals) ──
        const yearlyMonths = [];
        for (let i = 11; i >= 0; i--) {
            const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const df = { $gte: mStart, $lt: mEnd };
            const [a, l, r, rep, p] = await Promise.all([
                Appointment.countDocuments({ date: df }),
                LabResult.countDocuments({ date: df }),
                Radiology.countDocuments({ date: df }),
                MedicalReport.countDocuments({ createdAt: df }),
                ProcedureNote.find({ date: df }).select("procedureType").lean(),
            ]);
            const total = a * PRICES.appointment + l * PRICES.labResult +
                r * PRICES.radiology + rep * PRICES.medicalReport + calcProcRevenue(p);
            yearlyMonths.push({
                label: mStart.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
                shortLabel: mStart.toLocaleDateString("tr-TR", { month: "short" }),
                total, appointments: a * PRICES.appointment, labResults: l * PRICES.labResult,
                radiology: r * PRICES.radiology, reports: rep * PRICES.medicalReport, procedures: calcProcRevenue(p),
                year: mStart.getFullYear(), month: mStart.getMonth(),
            });
        }

        // ── 4) Karşılaştırma: this month vs last month, per category ──────────
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = thisMonthStart;
        const dfThis = { $gte: thisMonthStart };
        const dfLast = { $gte: lastMonthStart, $lt: lastMonthEnd };
        const [tA, tL, tR, tRep, tP, lA, lL, lR, lRep, lP] = await Promise.all([
            Appointment.countDocuments({ date: dfThis }), LabResult.countDocuments({ date: dfThis }),
            Radiology.countDocuments({ date: dfThis }), MedicalReport.countDocuments({ createdAt: dfThis }),
            ProcedureNote.find({ date: dfThis }).select("procedureType").lean(),
            Appointment.countDocuments({ date: dfLast }), LabResult.countDocuments({ date: dfLast }),
            Radiology.countDocuments({ date: dfLast }), MedicalReport.countDocuments({ createdAt: dfLast }),
            ProcedureNote.find({ date: dfLast }).select("procedureType").lean(),
        ]);
        const thisTotals = { appointments: tA * PRICES.appointment, labResults: tL * PRICES.labResult, radiology: tR * PRICES.radiology, reports: tRep * PRICES.medicalReport, procedures: calcProcRevenue(tP) };
        const lastTotals = { appointments: lA * PRICES.appointment, labResults: lL * PRICES.labResult, radiology: lR * PRICES.radiology, reports: lRep * PRICES.medicalReport, procedures: calcProcRevenue(lP) };
        const thisTotal = Object.values(thisTotals).reduce((s, v) => s + v, 0);
        const lastTotal = Object.values(lastTotals).reduce((s, v) => s + v, 0);
        const pctChange = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : thisTotal > 0 ? 100 : 0;

        const thisMonthName = thisMonthStart.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
        const lastMonthName = lastMonthStart.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

        res.json({
            daily: dailyBlocks,
            monthly: weeklyBlocks,
            yearly: yearlyMonths,
            comparison: {
                thisMonth: { name: thisMonthName, total: thisTotal, ...thisTotals },
                lastMonth: { name: lastMonthName, total: lastTotal, ...lastTotals },
                pctChange,
                categories: Object.keys(thisTotals).map(k => ({
                    key: k,
                    thisValue: thisTotals[k],
                    lastValue: lastTotals[k],
                    pct: lastTotals[k] > 0 ? Math.round(((thisTotals[k] - lastTotals[k]) / lastTotals[k]) * 100) : thisTotals[k] > 0 ? 100 : 0,
                })),
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;

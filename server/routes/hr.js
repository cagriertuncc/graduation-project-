import express from "express";
import multer from "multer";
import path from "path";
import auth, { roleGuard } from "../middleware/auth.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import JobPosting from "../models/JobPosting.js";
import JobApplication from "../models/JobApplication.js";
import LeaveRequest from "../models/LeaveRequest.js";
import DutyShift from "../models/DutyShift.js";
import EmployeePerformance from "../models/EmployeePerformance.js";

const router = express.Router();

// CV Yükleme (Multer) Konfigürasyonu
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/cvs"),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "cv-" + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Sadece PDF dosyaları yüklenebilir."), false);
        }
    }
});


// ====================================================
// PUBLIC ROUTES (Adaylar için Kariyer Sayfası vb.)
// ====================================================

// Aktif İş İlanlarını Getir
router.get("/postings", async (req, res) => {
    try {
        const postings = await JobPosting.find({ status: "Aktif" }).sort({ createdAt: -1 });
        res.json(postings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Yeni Başvuru Oluştur
router.post("/applications", upload.single("cvFile"), async (req, res) => {
    try {
        const payload = { ...req.body };
        if (req.file) {
            payload.cvUrl = `/uploads/cvs/${req.file.filename}`;
        }

        const app = await JobApplication.create(payload);
        if (app.jobId) await JobPosting.findByIdAndUpdate(app.jobId, { $inc: { applicationCount: 1 } });
        res.status(201).json(app);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ====================================================
// PROTECTED HR ROUTES
// ====================================================
// Tüm HR rotaları için "hr" veya "admin" yetkisi zorunludur
router.use(auth, roleGuard("hr", "admin"));

// ----------------------------------------------------
// GET /api/hr/dashboard-stats
// ----------------------------------------------------
router.get("/dashboard-stats", async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: { $in: ["doctor", "staff"] } });
        const activeLeaves = await LeaveRequest.countDocuments({ durum: "Onaylı", bitis: { $gte: new Date() } });
        const pendingApplications = await JobApplication.countDocuments({ status: { $in: ["Yeni", "İnceleniyor"] } });
        const openJobs = await JobPosting.countDocuments({ status: "Aktif" });

        res.json({
            totalEmployees,
            activeLeaves,
            pendingApplications,
            openJobs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// GET /api/hr/employees
// ----------------------------------------------------
router.get("/employees", async (req, res) => {
    try {
        const employees = await User.find({ 
            role: { $in: ["doctor", "staff", "hr", "technician", "pharmacist", "receptionist", "director", "accountant"] } 
        })
        .select("-password")
        .populate("profileId");

        const roleTitles = {
            doctor: "Uzman Hekim",
            staff: "İdari Personel",
            hr: "İK Uzmanı",
            technician: "Teknisyen",
            pharmacist: "Eczacı",
            receptionist: "Danışma Görevlisi",
            accountant: "Muhasebe Görevlisi",
            director: "Hastane Yöneticisi"
        };

        const formatted = employees.map(emp => {
            return {
                id: emp._id,
                name: emp.profileId?.name || "Bilinmeyen Çalışan",
                email: emp.email,
                role: emp.role,
                title: roleTitles[emp.role] || "Çalışan",
                specialty: emp.profileId?.specialty || "İdari",
                status: emp.isActive !== false ? "Aktif" : "Pasif",
                joinDate: emp.createdAt
            };
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// JOB POSTINGS (HR ADMIN ACTION)
// ----------------------------------------------------
router.get("/postings/all", async (req, res) => {
    try {
        const postings = await JobPosting.find().sort({ createdAt: -1 });
        res.json(postings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/postings", async (req, res) => {
    try {
        const posting = await JobPosting.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.status(201).json(posting);
    } catch (err) {
        console.error("JobPosting Create Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.patch("/postings/:id", async (req, res) => {
    try {
        const updated = await JobPosting.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "İlan bulunamadı" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/postings/:id", async (req, res) => {
    try {
        const deleted = await JobPosting.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "İlan bulunamadı" });
        await JobApplication.deleteMany({ jobId: req.params.id });
        res.json({ message: "İlan başarıyla silindi" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// JOB APPLICATIONS (HR ADMIN ACTION)
// ----------------------------------------------------
router.get("/applications", async (req, res) => {
    try {
        const { jobId, status } = req.query;
        let query = {};
        if (jobId) query.jobId = jobId;
        if (status) query.status = status;

        const applications = await JobApplication.find(query)
            .populate("jobId", "title department")
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/applications/:id", async (req, res) => {
    try {
        const updated = await JobApplication.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate("jobId", "title department");

        if (!updated) return res.status(404).json({ error: "Başvuru bulunamadı" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// EMPLOYEE PERFORMANCE
// ----------------------------------------------------
router.get("/performance", async (req, res) => {
    try {
        const perfs = await EmployeePerformance.find()
            .populate("userId", "name role")
            .populate("evaluatorId", "name")
            .sort({ createdAt: -1 });
        res.json(perfs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/performance", async (req, res) => {
    try {
        const perf = await EmployeePerformance.create({
            ...req.body,
            evaluatorId: req.user.id
        });
        res.status(201).json(perf);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// DUTY SHIFTS (HR ACTIONS)
// ----------------------------------------------------
router.get("/duty-shifts", async (req, res) => {
    try {
        const shifts = await DutyShift.find()
            .populate({
                path: "userId",
                populate: {
                    path: "profileId"
                }
            })
            .sort("date");
        res.json(shifts);
    } catch (err) {
        res.status(500).json({ error: "Nöbet listesi alınamadı", message: err.message });
    }
});

router.post("/duty-shifts", async (req, res) => {
    try {
        const { userId, date, note } = req.body;
        if (!userId || !date) {
            return res.status(400).json({ error: "Personel ve tarih seçimi zorunludur." });
        }

        const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
        if (date < todayStr) {
            return res.status(400).json({ error: "Geçmiş tarihlere nöbet ataması yapılamaz!" });
        }

        const existing = await DutyShift.findOne({ userId, date, note });
        if (existing) {
            return res.status(400).json({ error: "Bu personel için bu tarihte zaten bir nöbet tanımlanmış." });
        }

        const newShift = await DutyShift.create({ userId, date, note });
        const populatedShift = await newShift.populate({
            path: "userId",
            populate: {
                path: "profileId"
            }
        });

        res.status(201).json(populatedShift);
    } catch (err) {
        res.status(500).json({ error: "Nöbet kaydı oluşturulamadı", message: err.message });
    }
});

router.delete("/duty-shifts/:id", async (req, res) => {
    try {
        const shift = await DutyShift.findById(req.params.id);
        if (!shift) {
            return res.status(404).json({ error: "Nöbet kaydı bulunamadı" });
        }

        await shift.deleteOne();
        res.json({ message: "Nöbet kaydı başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Nöbet kaydı silinemedi", message: err.message });
    }
});

export default router;

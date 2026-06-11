import express from "express";
import os from "os";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import SystemLog from "../models/SystemLog.js";
import SystemSetting from "../models/SystemSetting.js";
import Department from "../models/Department.js";
import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import auth from "../middleware/auth.js";
import DutyShift from "../models/DutyShift.js";

const router = express.Router();

/**
 * Helper function to log system actions
 */
const logAction = async (action, userObj, details, status = "info") => {
    try {
        await SystemLog.create({
            action,
            user: userObj?.name || userObj?.email || "Sistem",
            userId: userObj?._id || null,
            details,
            status
        });
    } catch (err) {
        console.error("System Logging Error:", err);
    }
};

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ error: "Erişim engellendi. Sadece admin yetkisi gereklidir." });
    }
};

// Middleware to check if user is admin or director
const adminOrDirectorAuth = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "director" || req.user.role === "staff")) {
        next();
    } else {
        res.status(403).json({ error: "Erişim engellendi. Bu işlem için yetkiniz yok." });
    }
};

// GET /api/admin/system-stats - Tüm sistemdeki genel istatistikleri getirir
router.get("/system-stats", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const totalDoctors = await Doctor.countDocuments({ isAdmin: false });
        const totalPatients = await Patient.countDocuments();

        const appointments = await Appointment.find();
        const totalAppointments = appointments.length;
        const waitingAppointments = appointments.filter(a => a.status === 'bekliyor').length;
        const completedAppointments = appointments.filter(a => a.status === 'tamamlandı').length;

        // Node.js OS modülü ile gerçek bellek hesabı
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = Math.round((usedMem / totalMem) * 100);

        // CPU load ortalaması bilgisi
        const cpus = os.cpus();
        let cpuUsage = 15; // fallback
        if (cpus && cpus.length > 0) {
            cpuUsage = Math.round((os.loadavg()[0] / cpus.length) * 100) || Math.floor(Math.random() * 20) + 5;
            if (cpuUsage > 100) cpuUsage = 99;
        }

        // --- Yeni Analitik Metrikleri ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Günlük Hasta/Randevu Sayısı
        const dailyAppointments = appointments.filter(a => new Date(a.date) >= today && new Date(a.date) < new Date(today.getTime() + 86400000));
        const dailyPatients = dailyAppointments.length;

        // 2. Randevu İptal Oranı
        const canceledAppointments = appointments.filter(a => a.status === 'iptal').length;
        const cancellationRate = totalAppointments > 0 ? Math.round((canceledAppointments / totalAppointments) * 100) : 0;

        // 3. En Yoğun Doktor ve Branş
        const doctorCounts = {};
        const deptCounts = {};

        appointments.forEach(a => {
            if (a.status !== 'iptal') {
                if (a.doctorId) {
                    doctorCounts[a.doctorId._id || a.doctorId] = (doctorCounts[a.doctorId._id || a.doctorId] || 0) + 1;
                }
            }
        });

        let topDoctorId = null;
        let topDoctorCount = 0;
        for (const [id, count] of Object.entries(doctorCounts)) {
            if (count > topDoctorCount) {
                topDoctorCount = count;
                topDoctorId = id;
            }
        }

        let topDoctorObj = null;
        if (topDoctorId) {
            topDoctorObj = await Doctor.findById(topDoctorId);
            if (topDoctorObj) {
                deptCounts[topDoctorObj.specialty] = (deptCounts[topDoctorObj.specialty] || 0) + topDoctorCount;
            }
        }

        // Bütün doktorları tarayıp branş yoğunluğunu daha net saptayalım
        const allDocs = await Doctor.find();
        const docDeptMap = {};
        allDocs.forEach(d => { docDeptMap[d._id.toString()] = d.specialty; });

        const fullDeptCounts = {};
        appointments.forEach(a => {
            if (a.status !== 'iptal' && a.doctorId) {
                const docIdStr = (a.doctorId._id || a.doctorId).toString();
                const spec = docDeptMap[docIdStr];
                if (spec) {
                    fullDeptCounts[spec] = (fullDeptCounts[spec] || 0) + 1;
                }
            }
        });

        let topDeptName = "Veri Yok";
        let topDeptCount = 0;
        for (const [name, count] of Object.entries(fullDeptCounts)) {
            if (count > topDeptCount) {
                topDeptCount = count;
                topDeptName = name;
            }
        }

        // 4. Aylık Randevu Dağılımı (Grafik için)
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const monthlyDataMap = {};

        appointments.forEach(a => {
            const d = new Date(a.date);
            if (!isNaN(d.getTime())) {
                const m = monthNames[d.getMonth()];
                monthlyDataMap[m] = (monthlyDataMap[m] || 0) + 1;
            }
        });

        const monthlyChart = monthNames.map(m => ({
            name: m,
            randevular: monthlyDataMap[m] || 0
        })).filter(m => m.randevular > 0 || m.name === monthNames[today.getMonth()]); // Sadece verisi olanlar veya içinde bulunduğumuz ay

        res.json({
            totalDoctors,
            totalPatients,
            totalAppointments,
            waitingAppointments,
            completedAppointments,
            dailyPatients,
            cancellationRate,
            topDoctor: topDoctorObj ? { name: topDoctorObj.name, count: topDoctorCount } : null,
            topDepartment: { name: topDeptName, count: topDeptCount },
            monthlyChart,
            hardware: {
                cpuUsage,
                memoryUsage,
                diskUsage: 42 // Placeholder
            }
        });
    } catch (err) {
        res.status(500).json({ error: "İstatistikler getirilemedi", message: err.message });
    }
});

// GET /api/admin/users - Tüm kullanıcıları listeler (Admin dahil her rol)
router.get("/users", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const users = await User.find().populate("profileId").sort("-createdAt");

        // Populate stats if profile is Doctor
        const usersWithStats = await Promise.all(users.map(async (user) => {
            let extra = {};
            if (user.role === 'doctor' && user.profileId) {
                const patientCount = await Patient.countDocuments({ doctorId: user.profileId._id });
                const appointmentCount = await Appointment.countDocuments({ doctorId: user.profileId._id });
                extra = { patientCount, appointmentCount };
            }
            return {
                ...user.toObject(),
                ...extra
            };
        }));

        res.json(usersWithStats);
    } catch (err) {
        res.status(500).json({ error: "Kullanıcılar listelenemedi", message: err.message });
    }
});

// POST /api/admin/users - Yeni bir kullanıcı oluşturur
router.post("/users", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        if (req.user.role === "staff") {
            return res.status(403).json({ error: "Erişim engellendi. İdari personel kullanıcı oluşturamaz." });
        }
        if (req.user.role === "admin" && req.user.profileId?.specialty === "Bilgi İşlem Uzmanı") {
            return res.status(403).json({ error: "Erişim engellendi. Kullanıcı oluşturma yetkiniz yoktur." });
        }
        const { name, email, password, role, specialty, phone } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Bu email adresine sahip bir kullanıcı zaten var." });
        }

        let profileId = null;
        let profileModel = null;

        // Create Profile Document
        if (role === 'patient') {
            const newPat = await Patient.create({
                name,
                phone: phone || "",
                age: 30, // Varsayılan değerler
                gender: "Erkek",
                status: "active"
            });
            profileId = newPat._id;
            profileModel = "Patient";
        } else {
            // doctor, admin, staff hepsi personel profili (simdilik Doctor semasi) kullanır
            const newDoc = await Doctor.create({
                name,
                specialty: specialty || role,
                phone: phone || ""
            });
            profileId = newDoc._id;
            profileModel = "Doctor";
        }

        const newUser = await User.create({
            email,
            password,
            role,
            profileModel,
            profileId
        });

        // User response
        const userObj = newUser.toObject();
        delete userObj.password;

        // attach name immediately for frontend
        userObj.profileId = { _id: profileId, name: name, specialty: specialty };

        await logAction(
            "Yeni Kullanıcı Eklendi",
            req.user,
            `${role} yetkisi ile ${email} adresi sisteme tanımlandı.`,
            "success"
        );

        res.status(201).json(userObj);
    } catch (err) {
        res.status(500).json({ error: "Kullanıcı oluşturulamadı", message: err.message });
    }
});

// PUT /api/admin/users/:id - Var olan kullanıcıyı günceller
router.put("/users/:id", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        if (req.user.role === "admin" && req.user.profileId?.specialty === "Bilgi İşlem Uzmanı") {
            return res.status(403).json({ error: "Erişim engellendi. Kullanıcı düzenleme yetkiniz yoktur." });
        }
        const { name, email, specialty, phone, password, role, workingHours, isOnline, salary, dailyPatientLimit, rating } = req.body;

        const user = await User.findById(req.params.id).populate("profileId");
        if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

        if (email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ error: "Bu email adresi kullanımda." });
        }

        // Update basic User logic
        user.email = email || user.email;
        if (role) user.role = role;

        if (password && password.trim().length >= 6) {
            user.password = password;
        }
        await user.save();

        // Update Profile Logic
        if (user.profileId) {
            if (user.profileModel === 'Patient') {
                const pat = await Patient.findById(user.profileId._id);
                if (pat) {
                    if (name) pat.name = name;
                    if (phone) pat.phone = phone;
                    await pat.save();
                }
            } else {
                const doc = await Doctor.findById(user.profileId._id);
                if (doc) {
                    if (name !== undefined) doc.name = name;
                    if (specialty !== undefined) doc.specialty = specialty;
                    if (phone !== undefined) doc.phone = phone;
                    if (workingHours !== undefined) doc.workingHours = workingHours;
                    if (isOnline !== undefined) doc.isOnline = isOnline;
                    if (salary !== undefined) doc.salary = salary;
                    if (dailyPatientLimit !== undefined) doc.dailyPatientLimit = dailyPatientLimit;
                    if (rating !== undefined) doc.rating = rating;

                    await doc.save();
                }
            }
        }

        const userObj = user.toObject();
        delete userObj.password;
        res.json(userObj);
    } catch (err) {
        res.status(500).json({ error: "Kullanıcı güncellenemedi", message: err.message });
    }
});

// DELETE /api/admin/users/:id - Kullanıcıyı siler
router.delete("/users/:id", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        if (req.user.role === "staff") {
            return res.status(403).json({ error: "Erişim engellendi. İdari personel kullanıcı silemez." });
        }
        if (req.user.role === "admin" && req.user.profileId?.specialty !== "Bilgi İşlem Müdürü") {
            return res.status(403).json({ error: "Erişim engellendi. Kullanıcı silme yetkisi sadece Bilgi İşlem Müdürü'ne aittir." });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

        // Delete profile object
        if (user.profileModel === 'Patient') {
            await Patient.findByIdAndDelete(user.profileId);
            await Appointment.deleteMany({ patientId: user.profileId });
        } else if (user.profileModel === 'Doctor') {
            await Doctor.findByIdAndDelete(user.profileId);
            await Patient.deleteMany({ doctorId: user.profileId }); // (eski dizayndan kalma legacy koruma)
            await Appointment.deleteMany({ doctorId: user.profileId });
        }

        await user.deleteOne();

        await logAction(
            "Kullanıcı Silindi",
            req.user,
            `${user.email} (${user.role}) sistemden kalıcı olarak silindi.`,
            "warning"
        );

        res.json({ message: "Kullanıcı ve bağlı olduğu profiller silindi." });
    } catch (err) {
        res.status(500).json({ error: "Kullanıcı silinemedi", message: err.message });
    }
});

// GET /api/admin/doctors/:id/performance - Doktor performans metriklerini getirir
router.get("/doctors/:id/performance", auth, adminAuth, async (req, res) => {
    try {
        const docId = req.params.id; // Note: In this context, ID should be the Doctor profile _id.
        const allAppointments = await Appointment.find({ doctorId: docId });

        const now = new Date();
        const total = allAppointments.length;
        const completed = allAppointments.filter(a => a.status === 'completed').length;

        let upcoming = 0;
        allAppointments.forEach(a => {
            const aptDate = new Date(`${a.date}T${a.time}`);
            if (aptDate > now && a.status !== 'cancelled') {
                upcoming++;
            }
        });

        // Simulate a rating between 4.0 and 5.0 just for visual feedback (or 0 if totally empty)
        const rating = total > 0 ? (4.0 + Math.random()).toFixed(1) : 0;

        res.json({
            totalAppointments: total,
            completedAppointments: completed,
            upcomingAppointments: upcoming,
            averageRating: rating
        });

    } catch (err) {
        res.status(500).json({ error: "Performans verisi alınamadı", message: err.message });
    }
});

// GET /api/admin/logs - En son sistem kayıtları
router.get("/logs", auth, adminAuth, async (req, res) => {
    try {
        const logs = await SystemLog.find()
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Loglamalar alınırken hata oluştu", message: error.message });
    }
});

// GET /api/admin/settings - Sistem Ayarlarını Getir
router.get("/settings", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: "Ayarlar alınamadı", message: error.message });
    }
});

// PUT /api/admin/settings - Sistem Ayarlarını Güncelle
router.put("/settings", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = new SystemSetting({});
            await settings.save();
        }

        if (req.user.role === "admin") {
            const specialty = req.user.profileId?.specialty;
            if (req.body.emergencyLockdown !== undefined && req.body.emergencyLockdown !== settings.emergencyLockdown) {
                if (specialty !== "Bilgi İşlem Müdürü") {
                    return res.status(403).json({ error: "Erişim engellendi. Acil durum kilidini sadece Bilgi İşlem Müdürü yönetebilir." });
                }
            }
            if (req.body.maintenanceMode !== undefined && req.body.maintenanceMode !== settings.maintenanceMode) {
                if (specialty !== "Bilgi İşlem Müdür Yardımcısı" && specialty !== "Bilgi İşlem Müdürü") {
                    return res.status(403).json({ error: "Erişim engellendi. Bakım modunu sadece Müdür veya Müdür Yardımcısı yönetebilir." });
                }
            }
            if (req.body.hospitalName !== undefined && req.body.hospitalName !== settings.hospitalName) {
                if (specialty !== "Bilgi İşlem Müdürü") {
                    return res.status(403).json({ error: "Erişim engellendi. Hastane adını sadece Bilgi İşlem Müdürü değiştirebilir." });
                }
            }
        }

        if (req.user.role === "staff") {
            if (req.body.emergencyLockdown !== undefined && req.body.emergencyLockdown !== settings.emergencyLockdown) {
                return res.status(403).json({ error: "Erişim engellendi. İdari personel acil durum kilidini yönetemez." });
            }
            if (req.body.maintenanceMode !== undefined && req.body.maintenanceMode !== settings.maintenanceMode) {
                return res.status(403).json({ error: "Erişim engellendi. İdari personel bakım modunu yönetemez." });
            }
        }

        Object.assign(settings, req.body);
        await settings.save();

        await logAction(
            "Sistem Ayarları Değiştirildi",
            req.user,
            "Hastane konfigürasyonları veya bildirim tercihleri güncellendi.",
            "warning"
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: "Ayarlar kaydedilemedi", message: error.message });
    }
});

// ── DEPARTMAN DENETİMİ (BRANŞLAR) ──

// GET /api/admin/departments
router.get("/departments", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const specs = await Department.find().sort({ name: 1 });
        res.json(specs);
    } catch (error) {
        res.status(500).json({ error: "Departmanlar alınamadı", message: error.message });
    }
});

// POST /api/admin/departments
router.post("/departments", auth, adminAuth, async (req, res) => {
    try {
        const { name, status } = req.body;
        const newDoc = await Department.create({ name, status });

        await logAction("Yeni Branş Tanımlandı", req.user, `Sisteme '${name}' adlı branş eklendi.`);
        res.status(201).json(newDoc);
    } catch (error) {
        res.status(500).json({ error: "Departman oluşturulamadı", message: error.message });
    }
});

// PUT /api/admin/departments/:id
router.put("/departments/:id", auth, adminAuth, async (req, res) => {
    try {
        const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Departman bulunamadı" });
        await logAction("Branş Güncellendi", req.user, `'${updated.name}' branşı düzenlendi.`);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Departman güncellenemedi", message: error.message });
    }
});

// DELETE /api/admin/departments/:id
router.delete("/departments/:id", auth, adminAuth, async (req, res) => {
    try {
        const deleted = await Department.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Departman bulunamadı" });
        await logAction("Branş Silindi", req.user, `'${deleted.name}' branşı ve ilişkili metrikler silindi.`, "warning");
        res.json({ message: "Başarıyla silindi" });
    } catch (error) {
        res.status(500).json({ error: "Departman silinemedi", message: error.message });
    }
});

// ── DUYURULAR (SİSTEM ANONSLARI) ──

// GET /api/admin/announcements (Tüm duyurular - Admin)
router.get("/announcements", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const anons = await Announcement.find().sort({ createdAt: -1 }).populate("createdBy", "name email");
        res.json(anons);
    } catch (error) {
        res.status(500).json({ error: "Duyurular alınamadı", message: error.message });
    }
});

// GET /api/admin/announcements/active (Sadece aktif duyurular - Herkes)
router.get("/announcements/active", auth, async (req, res) => {
    try {
        const activeAnons = await Announcement.find({ active: true }).sort({ createdAt: -1 });
        res.json(activeAnons);
    } catch (error) {
        res.status(500).json({ error: "Aktif duyurular alınamadı", message: error.message });
    }
});

// POST /api/admin/announcements (Yeni Duyuru Yayınla)
router.post("/announcements", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const { title, message, type, active } = req.body;
        const newAnon = await Announcement.create({
            title, message, type, active,
            createdBy: req.user._id
        });

        await logAction("Yeni Duyuru Yayınlandı", req.user, `'${title}' başlıklı sistem duyurusu geçildi.`);
        res.status(201).json(newAnon);
    } catch (error) {
        res.status(500).json({ error: "Duyuru oluşturulamadı", message: error.message });
    }
});

// PUT /api/admin/announcements/:id (Duyuruyu Güncelle/Kapat)
router.put("/announcements/:id", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Duyuru bulunamadı" });
        await logAction("Duyuru Güncellendi", req.user, `'${updated.title}' başlıklı duyurunun durumu değiştirildi.`);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Duyuru güncellenemedi", message: error.message });
    }
});

// DELETE /api/admin/announcements/:id
router.delete("/announcements/:id", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const deleted = await Announcement.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Duyuru bulunamadı" });
        await logAction("Duyuru Silindi", req.user, `'${deleted.title}' silindi.`, "warning");
        res.json({ message: "Duyuru silindi" });
    } catch (error) {
        res.status(500).json({ error: "Duyuru silinemedi", message: error.message });
    }
});

// ── VERİTABANI YEDEKLEME KOMUTU ──

// GET /api/admin/backup
router.get("/backup", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        // Collect all data dumps into memory
        const backupData = {
            timestamp: new Date().toISOString(),
            users: await User.find().lean(),
            doctors: await Doctor.find().lean(),
            patients: await Patient.find().lean(),
            appointments: await Appointment.find().lean(),
            departments: await Department.find().lean(),
            settings: await SystemSetting.find().lean(),
            announcements: await Announcement.find().lean(),
        };

        // Log the event securely
        await logAction("Sistem Yedeği Alındı", req.user, `Tüm kullanıcı, randevu ve ayar verilerinin JSON dökümü oluşturuldu.`, "warning");

        // Return dummy json. In a real scenario, this could be piped to a file stream.
        res.json({
            success: true,
            message: "Veritabanı yedeği başarıyla oluşturuldu.",
            sizeBytes: JSON.stringify(backupData).length,
            file: "gp2_backup_" + Date.now() + ".json",
            data: backupData
        });
    } catch (error) {
        res.status(500).json({ error: "Yedekleme başarısız oldu", message: error.message });
    }
});

// ── HASTA YÖNETİMİ (ADMIN ÖZEL) ──

// GET /api/admin/patients (Tüm hastalar, silinmiş olanlar dahil/hariç parametreye göre)
router.get("/patients", auth, adminAuth, async (req, res) => {
    try {
        const { includeDeleted, search } = req.query;
        let query = {};
        if (includeDeleted !== "true") {
            query.isDeleted = { $ne: true };
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }
        const patients = await Patient.find(query)
            .populate("doctorId", "name specialty")
            .sort({ createdAt: -1 });

        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: "Hastalar alınamadı", message: err.message });
    }
});

// GET /api/admin/patients/:id/appointments (Hastanın geçmiş randevuları)
router.get("/patients/:id/appointments", auth, adminAuth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.params.id })
            .populate("doctorId", "name specialty")
            .sort({ date: -1, time: -1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: "Randevular alınamadı", message: err.message });
    }
});

// DELETE /api/admin/patients/:id (Soft Delete)
router.delete("/patients/:id", auth, adminAuth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        patient.isDeleted = true;
        await patient.save();

        await logAction("Hasta Soft Delete", req.user, `'${patient.name}' arşivlendi (Soft Delete).`, "warning");
        res.json({ message: "Hasta başarıyla silindi (Soft Delete)" });
    } catch (err) {
        res.status(500).json({ error: "Hasta silinemedi", message: err.message });
    }
});

// POST /api/admin/patients/:id/penalty (Ceza puanı ekleme / Kara liste)
router.post("/patients/:id/penalty", auth, adminAuth, async (req, res) => {
    try {
        const { penaltyPoints, isBlacklisted } = req.body;
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        if (penaltyPoints !== undefined) {
            patient.penaltyPoints = penaltyPoints;
            if (patient.penaltyPoints >= 3) {
                patient.isBlacklisted = true;
            } else if (patient.penaltyPoints < 3 && isBlacklisted === undefined) {
                patient.isBlacklisted = false;
            }
        }

        if (isBlacklisted !== undefined) {
            patient.isBlacklisted = isBlacklisted;
        }

        await patient.save();
        await logAction("Hasta Ceza/Kara Liste Güncellemesi", req.user, `'${patient.name}' adlı hastanın ceza durumu güncellendi.`);

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: "Ceza durumu güncellenemedi", message: err.message });
    }
});

// ── RANDEVU YÖNETİMİ & ANALİZ (ADMIN ÖZEL) ──

// GET /api/admin/appointments (Tüm randevular, filtreleme eklenebilir)
router.get("/appointments", auth, adminAuth, async (req, res) => {
    try {
        const { status, date } = req.query;
        let query = {};
        if (status) query.status = status;
        if (date) query.date = new Date(date);

        const appointments = await Appointment.find(query)
            .populate("doctorId", "name specialty")
            .populate("patientId", "name phone email")
            .sort({ date: -1, time: -1 });

        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: "Randevular alınamadı", message: err.message });
    }
});

// PUT /api/admin/appointments/:id/cancel (Admin tarafından randevu iptali)
router.put("/appointments/:id/cancel", auth, adminAuth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("patientId", "name")
            .populate("doctorId", "name specialty");

        if (!appointment) return res.status(404).json({ error: "Randevu bulunamadı" });

        appointment.status = "iptal";
        await appointment.save();

        await logAction(
            "Admin Randevu İptali",
            req.user,
            `'${appointment.patientId?.name}' hastasının Dr. ${appointment.doctorId?.name} (${appointment.doctorId?.specialty}) randevusu yönetici tarafından iptal edildi.`,
            "warning"
        );
        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: "Randevu iptal edilemedi", message: err.message });
    }
});

// GET /api/admin/appointments/analytics (Yoğunluk ve doluluk analizi)
router.get("/appointments/analytics", auth, adminAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Hangi branş yoğun? (Tüm zamanlar tamamlanan/bekleyen statülerine göre)
        const densityAnalysis = await Appointment.aggregate([
            { $match: { status: { $ne: "iptal" } } },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $unwind: "$doctor" },
            {
                $group: {
                    _id: "$doctor.specialty",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Günlük/Haftalık Doluluk
        const weeklyAppointments = await Appointment.countDocuments({
            date: { $gte: today, $lte: weekEnd },
            status: { $in: ["bekliyor", "tamamlandı"] }
        });

        // Calculate maximum theoretical capacity for a week
        const totalDoctors = await Doctor.countDocuments({ isOnline: true });
        const globalSettings = await SystemSetting.findOne() || { maxAppointmentsPerDay: 40 };
        // Assuming docs work 6 days a week roughly
        const theoreticalWeeklyCapacity = totalDoctors * globalSettings.maxAppointmentsPerDay * 6;

        const occupancyRate = theoreticalWeeklyCapacity > 0
            ? ((weeklyAppointments / theoreticalWeeklyCapacity) * 100).toFixed(1)
            : 0;

        res.json({
            departmentDensity: densityAnalysis,
            weeklyStats: {
                totalBooked: weeklyAppointments,
                capacity: theoreticalWeeklyCapacity,
                occupancyRate: parseFloat(occupancyRate)
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Analiz oluşturulamadı", message: err.message });
    }
});

// GET /api/admin/appointments/smart-slots (Akıllı boş saat önerisi)
router.get("/appointments/smart-slots", auth, adminAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const searchEnd = new Date(today);
        searchEnd.setDate(searchEnd.getDate() + 14); // Look 2 weeks ahead

        // Fetch all doctors
        const doctors = await Doctor.find({ isOnline: true }, "_id name specialty dailyPatientLimit workingHours");

        // Fetch all upcoming appointments to cross-reference
        const upcomingAppointments = await Appointment.find({
            date: { $gte: today, $lte: searchEnd },
            status: { $in: ["bekliyor"] }
        }).lean();

        let recommendations = [];

        // Simplified Smart Algorithm: find the doctor with the least upcoming appointments
        for (const doc of doctors) {
            const docAppts = upcomingAppointments.filter(a => a.doctorId.toString() === doc._id.toString());
            // Predict load
            const loadScore = docAppts.length;
            recommendations.push({
                doctor: {
                    id: doc._id,
                    name: doc.name,
                    specialty: doc.specialty
                },
                upcomingCount: loadScore,
                recommendedDate: new Date(today.getTime() + 86400000).toISOString() // Placeholder algorithm logic for recommendation logic 
            });
        }

        // Sort by least busy (lower loadScore = better recommendation)
        recommendations.sort((a, b) => a.upcomingCount - b.upcomingCount);
        // Return top 5 recommendations
        res.json(recommendations.slice(0, 5));
    } catch (err) {
        res.status(500).json({ error: "Öneriler oluşturulamadı", message: err.message });
    }
});

// POST /api/admin/send-notification - Bireysel veya toplu bildirim gönderimi
router.post("/send-notification", auth, adminAuth, async (req, res) => {
    try {
        const { targetType, receiverId, title, message, type, link } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({ error: "Başlık ve mesaj alanları zorunludur." });
        }

        const notificationType = type || "message";

        if (targetType === "all_doctors") {
            // Tüm doktorlara gönder (User modeli)
            const doctors = await User.find({ role: "doctor" });
            const notifications = doctors.map(doc => ({
                receiverId: doc._id,
                receiverModel: "User",
                title,
                message,
                type: notificationType,
                link: link || "/dashboard"
            }));
            await Notification.insertMany(notifications);
            await logAction("Toplu Bildirim Gönderildi", req.user, `Tüm doktorlara '${title}' başlıklı bildirim gönderildi.`, "info");
            return res.status(201).json({ message: `${doctors.length} doktora bildirim başarıyla gönderildi.` });

        } else if (targetType === "all_patients") {
            // Tüm hastalara gönder (Patient modeli)
            const patients = await Patient.find({ isDeleted: { $ne: true } });
            const notifications = patients.map(pat => ({
                receiverId: pat._id,
                receiverModel: "Patient",
                title,
                message,
                type: notificationType,
                link: link || "/hasta/portal"
            }));
            await Notification.insertMany(notifications);
            await logAction("Toplu Bildirim Gönderildi", req.user, `Tüm hastalara '${title}' başlıklı bildirim gönderildi.`, "info");
            return res.status(201).json({ message: `${patients.length} hastaya bildirim başarıyla gönderildi.` });

        } else if (targetType === "all_staff") {
            // Tüm personele (Doktor, Sekreter, Eczacı, Muhasebeci, İK, Teknisyen) gönder (User modeli)
            const staff = await User.find({ role: { $in: ["doctor", "receptionist", "pharmacist", "accountant", "hr", "technician", "staff"] } });
            const notifications = staff.map(st => ({
                receiverId: st._id,
                receiverModel: "User",
                title,
                message,
                type: notificationType,
                link: link || "/dashboard"
            }));
            await Notification.insertMany(notifications);
            await logAction("Toplu Bildirim Gönderildi", req.user, `Tüm personel ve doktorlara '${title}' başlıklı bildirim gönderildi.`, "info");
            return res.status(201).json({ message: `${staff.length} personele bildirim başarıyla gönderildi.` });

        } else {
            // Bireysel gönderim
            if (!receiverId) {
                return res.status(400).json({ error: "Lütfen bir alıcı seçin." });
            }
            const receiverModel = targetType === "patient" ? "Patient" : "User";
            const newNotification = await Notification.create({
                receiverId,
                receiverModel,
                title,
                message,
                type: notificationType,
                link: link || (receiverModel === "Patient" ? "/hasta/portal" : "/dashboard")
            });
            await logAction("Bireysel Bildirim Gönderildi", req.user, `Bir alıcıya '${title}' başlıklı bildirim gönderildi.`, "info");
            return res.status(201).json({ message: "Bildirim başarıyla gönderildi.", data: newNotification });
        }
    } catch (error) {
        res.status(500).json({ error: "Bildirim gönderilemedi", message: error.message });
    }
});

// POST /api/admin/send-message - Bireysel mesaj gönderimi
router.post("/send-message", auth, adminAuth, async (req, res) => {
    try {
        const { targetType, receiverId, title, content } = req.body;

        if (!receiverId || !title || !content) {
            return res.status(400).json({ error: "Alıcı, başlık ve mesaj içeriği zorunludur." });
        }

        const receiverModel = targetType === "patient" ? "Patient" : "User";

        // Create Message
        const newMessage = await Message.create({
            senderId: req.user._id,
            senderModel: "User",
            senderRole: "admin",
            receiverId,
            receiverModel,
            title,
            content
        });

        // Create notification associated with message
        await Notification.create({
            receiverId,
            receiverModel,
            title: "Yeni Mesaj (Yönetici)",
            message: `${req.user.name || req.user.email} size bir mesaj gönderdi: "${title}"`,
            type: "message",
            link: receiverModel === "Patient" ? "/hasta/portal" : "/dashboard"
        });

        await logAction("Mesaj Gönderildi", req.user, `Yönetici tarafından bir kullanıcıya özel mesaj gönderildi.`, "info");

        res.status(201).json({ message: "Mesaj ve bildirim başarıyla gönderildi.", data: newMessage });
    } catch (error) {
        res.status(500).json({ error: "Mesaj gönderilemedi", message: error.message });
    }
});

// --- DUTY SHIFT ROUTES ---

// GET /api/admin/duty-shifts - Get all shifts populated with user profile
router.get("/duty-shifts", auth, adminOrDirectorAuth, async (req, res) => {
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

// POST /api/admin/duty-shifts - Create or update a shift assignment
router.post("/duty-shifts", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const { userId, date, note } = req.body;
        if (!userId || !date) {
            return res.status(400).json({ error: "Personel ve tarih seçimi zorunludur." });
        }

        // Check if there is an existing shift with same userId, date and note
        const existing = await DutyShift.findOne({ userId, date, note });
        if (existing) {
            return res.status(400).json({ error: "Bu personel için bu tarihte ve bu notla zaten bir nöbet tanımlanmış." });
        }

        const newShift = await DutyShift.create({ userId, date, note });
        const populatedShift = await newShift.populate({
            path: "userId",
            populate: {
                path: "profileId"
            }
        });

        await logAction(
            "Nöbet Tanımlandı",
            req.user,
            `Tarih: ${date}, Personel ID: ${userId}, Açıklama: ${note || "-"}`,
            "success"
        );

        res.status(201).json(populatedShift);
    } catch (err) {
        res.status(500).json({ error: "Nöbet kaydı oluşturulamadı", message: err.message });
    }
});

// DELETE /api/admin/duty-shifts/:id - Delete a shift assignment
router.delete("/duty-shifts/:id", auth, adminOrDirectorAuth, async (req, res) => {
    try {
        const shift = await DutyShift.findById(req.params.id);
        if (!shift) {
            return res.status(404).json({ error: "Nöbet kaydı bulunamadı" });
        }

        await shift.deleteOne();

        await logAction(
            "Nöbet Silindi",
            req.user,
            `Nöbet kaydı silindi (ID: ${req.params.id})`,
            "warning"
        );

        res.json({ message: "Nöbet kaydı başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Nöbet kaydı silinemedi", message: err.message });
    }
});

export default router;

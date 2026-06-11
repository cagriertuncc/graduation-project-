import express from "express";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import LabResult from "../models/LabResult.js";
import Prescription from "../models/Prescription.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import MedicalFile from "../models/MedicalFile.js";
import Notification from "../models/Notification.js";
import Vital from "../models/Vital.js";
import Goal from "../models/Goal.js";
import Payment from "../models/Payment.js";
import MedicationLog from "../models/MedicationLog.js";
import SelfMedication from "../models/SelfMedication.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Radiology from "../models/Radiology.js";
import MedicalReport from "../models/MedicalReport.js";
import ProcedureNote from "../models/ProcedureNote.js";
import Announcement from "../models/Announcement.js";
import patientAuth from "../middleware/patientAuth.js";
import { performTriage, calculateRiskScore, analyzeDensity } from "../utils/triage.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "PLACEHOLDER_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/medical_files";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Sadece resim (jpg, png) ve PDF dosyaları yüklenebilir."));
    }
});

const router = express.Router();

// ----------------------------------------------------
// GET ALL AVAILABLE DOCTORS (With their Specialties)
// ----------------------------------------------------
router.get("/doctors", async (req, res) => {
    try {
        // Fetch only users with role "doctor" and populate their Doctor profiles
        const doctorUsers = await User.find({ role: "doctor" })
            .select("-password")
            .populate({
                path: "profileId"
            });

        // Extract the actual Doctor profiles and ensure uniqueness just in case
        const uniqueDoctors = [];
        const seenIds = new Set();

        for (const user of doctorUsers) {
            const profile = user.profileId;
            if (profile && !seenIds.has(profile._id.toString())) {
                seenIds.add(profile._id.toString());
                uniqueDoctors.push(profile);
            }
        }

        res.json(uniqueDoctors);
    } catch (err) {
        res.status(500).json({ error: "Doktor listesi alınamadı", message: err.message });
    }
});

// ----------------------------------------------------
// GET BOOKED SLOTS FOR A DOCTOR ON A DATE
// ----------------------------------------------------
router.get("/booked-slots", async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) return res.status(400).json({ error: "Doktor ve tarih gereklidir." });

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            doctorId,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ["iptal", "reddedildi"] }
        }).select("time");

        const bookedSlots = appointments.map(a => a.time).filter(Boolean);
        res.json({ bookedSlots });
    } catch (err) {
        res.status(500).json({ error: "Dolu saatler alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// BOOK AN APPOINTMENT (As Logged In Patient)
// ----------------------------------------------------
router.post("/book", patientAuth, async (req, res) => {
    try {
        if (req.user.role !== "patient") {
            return res.status(403).json({ error: "Sadece hastalar randevu alabilir." });
        }

        const { doctorId, date, time, type, notes } = req.body;

        if (!doctorId || !date || !time) {
            return res.status(400).json({ error: "Doktor, tarih ve saat zorunludur." });
        }

        // ── Kara Liste Kontrolü ───────────────────────────────────────
        const bookingPatientSelf = await Patient.findById(req.user.id).select("isBlacklisted penaltyPoints name");
        if (bookingPatientSelf && bookingPatientSelf.isBlacklisted) {
            return res.status(403).json({
                error: "Hesabınız kara listeye alınmıştır. Randevu alabilmek için klinikle iletişime geçin."
            });
        }
        // ─────────────────────────────────────────────────────────────

        // Validate Doctor
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: "Seçilen doktor bulunamadı." });
        }

        // Prevent past appointments
        const now = new Date();
        const appointmentDateTime = new Date(`${date}T${time}:00`);

        if (appointmentDateTime < now) {
            return res.status(400).json({ error: "Geçmiş bir tarihe veya saate randevu alınamaz." });
        }

        // Check scheduling conflicts
        const targetDate = new Date(date + "T00:00:00.000Z");
        const dayOfWeek = targetDate.getDay();

        if (dayOfWeek === 0) {
            return res.status(400).json({ error: "Pazar günleri randevu verilememektedir." });
        }

        if (dayOfWeek === 6) {
            // Check if time is after 13:00 on Saturday
            const hour = parseInt(time.split(":")[0]);
            if (hour >= 13 && time !== "13:00") {
                return res.status(400).json({ error: "Cumartesi günleri sadece öğlene kadar randevu verilmektedir." });
            }
        }

        // ── İzin dönemi kontrolü ──────────────────────────────────────
        const apptDate = new Date(date);
        const apptDayStart = new Date(apptDate);
        apptDayStart.setHours(0, 0, 0, 0);
        const apptDayEnd = new Date(apptDate);
        apptDayEnd.setHours(23, 59, 59, 999);

        const activeLeave = await LeaveRequest.findOne({
            doctorId,
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

        // ─── START FAMILY SUPPORT ───
        const bookingPatientId = req.body.patientId || req.user.id;

        // Verify authorization if booking for someone else
        if (bookingPatientId !== req.user.id) {
            const isFamilyMember = await Patient.exists({ _id: bookingPatientId, parentId: req.user.id });
            if (!isFamilyMember) {
                return res.status(403).json({ error: "Bu hasta için randevu alma yetkiniz yok." });
            }
        }

        // Check if patient already has a pending appointment in the SAME specialty
        const patientPendingAppointments = await Appointment.find({
            patientId: bookingPatientId,
            status: "bekliyor"
        }).populate("doctorId");

        const hasSameSpecialtyAppointment = patientPendingAppointments.some(
            app => app.doctorId && doctor.specialty && app.doctorId.specialty === doctor.specialty
        );

        if (hasSameSpecialtyAppointment) {
            return res.status(400).json({ error: `${doctor.specialty} branşında zaten bekleyen aktif bir randevu bulunmaktadır.` });
        }
        // ─── END FAMILY SUPPORT ───

        const existingApp = await Appointment.findOne({
            doctorId,
            date: targetDate,
            time,
            status: { $in: ["bekliyor", "tamamlandı"] }
        });

        if (existingApp) {
            return res.status(400).json({ error: "Bu saat dilimi dolu, lütfen başka bir saat seçin." });
        }

        // Create
        const appointment = await Appointment.create({
            patientId: bookingPatientId,
            doctorId,
            date: targetDate,
            time,
            type: type || "Kontrol",
            notes: notes || "",
            status: "bekliyor" // Default status
        });

        res.status(201).json({ message: "Randevunuz başarıyla oluşturuldu.", appointment });
    } catch (err) {
        res.status(500).json({ error: "Randevu oluşturulamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY APPOINTMENTS
// ----------------------------------------------------
router.get("/my-appointments", patientAuth, async (req, res) => {
    try {
        if (req.user.role !== "patient") {
            return res.status(403).json({ error: "Erişim reddedildi." });
        }

        // Get own ID and all family members' IDs
        const familyMembers = await Patient.find({ parentId: req.user.id }).select("_id");
        const patientIds = [req.user.id, ...familyMembers.map(m => m._id)];

        const appointments = await Appointment.find({ patientId: { $in: patientIds } })
            .populate("doctorId", "name specialty")
            .populate("patientId", "name") // Useful to know who the appointment is for
            .sort({ date: -1, time: -1 }); // Chronological sort

        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: "Randevular alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// SUBMIT APPOINTMENT REVIEW
// ----------------------------------------------------
router.post("/appointments/:id/review", patientAuth, async (req, res) => {
    try {
        if (req.user.role !== "patient") {
            return res.status(403).json({ error: "Erişim reddedildi." });
        }

        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Geçerli bir puan (1-5) girmelisiniz." });
        }

        const appt = await Appointment.findById(req.params.id);

        if (!appt) {
            return res.status(404).json({ error: "Randevu bulunamadı." });
        }

        // Verify ownership (could belong to family member)
        const familyMembers = await Patient.find({ parentId: req.user.id }).select("_id");
        const patientIds = [req.user.id, ...familyMembers.map(m => m._id.toString())];

        if (!patientIds.includes(appt.patientId.toString())) {
            return res.status(403).json({ error: "Bu randevuyu değerlendirme yetkiniz yok." });
        }

        if (appt.status !== "tamamlandı") {
            return res.status(400).json({ error: "Sadece tamamlanmış randevuları değerlendirebilirsiniz." });
        }

        if (appt.review && appt.review.rating) {
            return res.status(400).json({ error: "Bu randevu zaten değerlendirilmiş." });
        }

        appt.review = {
            rating: Number(rating),
            comment: comment ? comment.trim() : "",
            createdAt: new Date()
        };

        await appt.save();

        res.json({ message: "Değerlendirmeniz başarıyla kaydedildi.", appointment: appt });
    } catch (err) {
        res.status(500).json({ error: "Değerlendirme kaydedilemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// GET DOCTOR BOOKED SLOTS FOR A DATE
// ----------------------------------------------------
router.get("/doctor-slots", patientAuth, async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ error: "Eksik parametreler." });
        }

        const targetDate = new Date(date + "T00:00:00.000Z");

        const bookedAppointments = await Appointment.find({
            doctorId,
            date: targetDate,
            status: { $in: ["bekliyor", "tamamlandı"] }
        });

        const bookedTimes = bookedAppointments.map(app => app.time);

        res.json({ bookedTimes });
    } catch (err) {
        res.status(500).json({ error: "Saatler getirilemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// CANCEL APPOINTMENT
// ----------------------------------------------------
router.put("/cancel/:id", patientAuth, async (req, res) => {
    try {
        if (req.user.role !== "patient") {
            return res.status(403).json({ error: "Erişim reddedildi." });
        }

        const appt = await Appointment.findById(req.params.id);

        if (!appt) {
            return res.status(404).json({ error: "Randevu bulunamadı." });
        }

        // Check if the appointment belongs to the logged in patient or a family member
        const familyMembers = await Patient.find({ parentId: req.user.id }).select("_id");
        const patientIds = [req.user.id, ...familyMembers.map(m => m._id.toString())];

        if (!patientIds.includes(appt.patientId.toString())) {
            return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
        }

        if (appt.status !== "bekliyor") {
            return res.status(400).json({ error: "Sadece beklemedeki randevular iptal edilebilir." });
        }

        appt.status = "iptal";
        appt.cancellationReason = "Hasta tarafından kendi isteğiyle iptal edildi.";
        await appt.save();

        // ── Ceza Puanı: İptal eden hastanın kendi randevusu ise puan ekle ──
        if (appt.patientId.toString() === req.user.id.toString()) {
            const canceller = await Patient.findById(req.user.id);
            if (canceller) {
                canceller.penaltyPoints = (canceller.penaltyPoints || 0) + 1;
                // 3 puandan sonra kara listeye al
                if (canceller.penaltyPoints >= 3) {
                    canceller.isBlacklisted = true;
                }
                await canceller.save();
            }
        }
        // ─────────────────────────────────────────────────────────────

        res.json({
            message: "Randevu iptal edildi.",
            appointment: appt,
            penaltyPoints: (await Patient.findById(req.user.id).select("penaltyPoints isBlacklisted"))
        });
    } catch (err) {
        res.status(500).json({ error: "Randevu iptal edilemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY LAB RESULTS
// ----------------------------------------------------
router.get("/my-lab-results", patientAuth, async (req, res) => {
    try {
        const results = await LabResult.find({ patientId: req.user.id })
            .populate("doctorId", "name title specialty")
            .sort({ date: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Lab sonuçları alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY PRESCRIPTIONS
// ----------------------------------------------------
router.get("/my-prescriptions", patientAuth, async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.user.id })
            .populate("doctorId", "name title specialty")
            .sort({ date: -1 });
        res.json(prescriptions);
    } catch (err) {
        res.status(500).json({ error: "Reçeteler alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY MESSAGES
// ----------------------------------------------------
router.get("/my-messages", patientAuth, async (req, res) => {
    try {
        const messages = await Message.find({ receiverId: req.user.id })
            .populate("senderId", "name role profileId")
            .sort({ date: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Mesajlar alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET SMART RECOMMENDATIONS (AI SUPPORTED)
// ----------------------------------------------------
router.get("/smart-recommendations", patientAuth, async (req, res) => {
    try {
        const patientId = req.user.id;
        // Hasta Patient modelinde, User modelinde değil
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        const symptomText = req.query.symptoms || "";

        // 1. AI Triage & Disease Prediction (LLM Powered)
        let triageResult = null;
        if (symptomText) {
            const prompt = `
                Bir hastanın şikayetlerine göre hangi tıbbi birime (branş) gitmesi gerektiğini ve aciliyet durumunu belirle.
                Şikayet: "${symptomText}"

                Yanıtını tam olarak şu JSON formatında ver:
                {
                    "suggestedSpecialty": "Bölüm Adı",
                    "urgency": "Düşük/Orta/Yüksek",
                    "predictedCondition": "Tahmin edilen olası durum",
                    "baseRisk": 1-10 (sayı)
                }
            `;
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
                triageResult = JSON.parse(text);
            } catch (err) {
                console.error("Smart Rec AI Triage Error:", err);
                triageResult = performTriage(symptomText); // Fallback to hardcoded
            }
        }

        // 2. Personal Risk Score
        const riskAnalysis = calculateRiskScore({
            age: patient.age,
            height: patient.height,
            weight: patient.weight,
            smokingAlcoholStatus: patient.smokingAlcoholStatus,
            chronicDiseases: patient.chronicDiseases
        });

        // 3. Density Analysis & Least Busy Doctor per Specialty
        const specialties = await Doctor.distinct("specialty");
        const recommendedDoctors = {};
        const densityAnalysis = {};

        for (const spec of specialties) {
            const docsInSpec = await Doctor.find({ specialty: spec });
            let bestDoc = null;
            let minLoad = Infinity;
            let totalSpecLoad = 0;

            for (const doc of docsInSpec) {
                const load = await Appointment.countDocuments({
                    doctorId: doc._id,
                    status: "bekliyor",
                    date: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
                });

                totalSpecLoad += load;

                if (load < minLoad) {
                    minLoad = load;
                    bestDoc = doc._id;
                }
            }

            recommendedDoctors[spec] = bestDoc;
            densityAnalysis[spec] = analyzeDensity(totalSpecLoad);
        }

        // 4. Optimal Slot Rule (already exists, but refined)
        const optimalSlotRule = "10:00 ve sonrası (Daha az yoğun)";

        res.json({
            triage: triageResult,
            risk: riskAnalysis,
            suggestedSpecialty: triageResult ? triageResult.suggestedSpecialty : null,
            recommendedDoctors,
            density: densityAnalysis,
            optimalSlotRule
        });
    } catch (err) {
        res.status(500).json({ error: "Öneriler getirilemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// SEND MESSAGE TO DOCTOR
// ----------------------------------------------------
router.post("/send-message", patientAuth, async (req, res) => {
    try {
        const { receiverId, title, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ error: "Alıcı ve mesaj içeriği zorunludur." });
        }

        // Validate receiver is a doctor
        const doctor = await User.findOne({ _id: receiverId, role: "doctor" });
        if (!doctor) {
            return res.status(404).json({ error: "Geçerli bir doktor bulunamadı." });
        }

        const message = await Message.create({
            senderId: req.user.id,
            senderModel: "Patient",
            senderRole: "patient",
            receiverId: doctor._id,
            receiverModel: "User",
            title: title || "Hasta Mesajı",
            content,
            date: new Date()
        });

        // Add notification for doctor (User model)
        await Notification.create({
            receiverId: doctor._id,
            receiverModel: "User",
            title: "Yeni Mesaj",
            message: `${req.user.name} size yeni bir mesaj gönderdi.`,
            type: "message",
            link: `/doctor/messages`
        });

        res.status(201).json({ message: "Mesajınız başarıyla gönderildi.", data: message });
    } catch (err) {
        res.status(500).json({ error: "Mesaj gönderilemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// UPLOAD MEDICAL FILE
// ----------------------------------------------------
router.post("/upload-file", patientAuth, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Lütfen bir dosya seçin." });
        }

        const medicalFile = await MedicalFile.create({
            patientId: req.user.id,
            name: req.body.name || req.file.originalname,
            type: req.file.mimetype,
            url: req.file.path,
            uploadedBy: "patient"
        });

        res.status(201).json({ message: "Dosya başarıyla yüklendi.", data: medicalFile });
    } catch (err) {
        res.status(500).json({ error: "Dosya yüklenemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY FILES
// ----------------------------------------------------
router.get("/my-files", patientAuth, async (req, res) => {
    try {
        const files = await MedicalFile.find({ patientId: req.user.id }).sort({ date: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Dosyalar alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY NOTIFICATIONS
// ----------------------------------------------------
router.get("/my-notifications", patientAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            receiverId: req.user.id,
            receiverModel: "Patient"
        }).sort({ date: -1 }).limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Bildirimler alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// MARK NOTIFICATION AS READ
// ----------------------------------------------------
router.patch("/notifications/:id/read", patientAuth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, receiverId: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ error: "Bildirim bulunamadı." });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: "İşlem başarısız.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY VITALS (Historical Health Data)
// ----------------------------------------------------
router.get("/my-vitals", patientAuth, async (req, res) => {
    try {
        const vitals = await Vital.find({ patientId: req.user.id }).sort({ date: -1 });
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ error: "Sağlık verileri alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// ADD NEW VITAL ENTRY
// ----------------------------------------------------
router.post("/vitals", patientAuth, async (req, res) => {
    try {
        const { type, value, unit, date, notes } = req.body;

        if (!type || !value || !unit) {
            return res.status(400).json({ error: "Tür, değer ve birim zorunludur." });
        }

        const vital = await Vital.create({
            patientId: req.user.id,
            type,
            value,
            unit,
            date: date || new Date(),
            notes: notes || ""
        });

        res.status(201).json({ message: "Veri kaydedildi.", data: vital });
    } catch (err) {
        res.status(500).json({ error: "Veri kaydedilemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// UPDATE VITAL ENTRY
// ----------------------------------------------------
router.put("/vitals/:id", patientAuth, async (req, res) => {
    try {
        const { value, notes, date } = req.body;
        const vital = await Vital.findOneAndUpdate(
            { _id: req.params.id, patientId: req.user.id },
            { value, notes, date },
            { new: true }
        );
        if (!vital) return res.status(404).json({ error: "Veri bulunamadı." });
        res.json({ message: "Veri güncellendi.", data: vital });
    } catch (err) {
        res.status(500).json({ error: "Güncelleme başarısız.", message: err.message });
    }
});

// ----------------------------------------------------
// DELETE VITAL ENTRY
// ----------------------------------------------------
router.delete("/vitals/:id", patientAuth, async (req, res) => {
    try {
        const vital = await Vital.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
        if (!vital) return res.status(404).json({ error: "Veri bulunamadı." });
        res.json({ message: "Veri silindi." });
    } catch (err) {
        res.status(500).json({ error: "Silme işlemi başarısız.", message: err.message });
    }
});

// ----------------------------------------------------
// PAYMENT PROCESS (MOCK)
// ----------------------------------------------------
router.post("/pay", patientAuth, async (req, res) => {
    try {
        const { appointmentId, cardNumber, expiry, cvc, amount } = req.body;

        if (!appointmentId || !cardNumber || !amount) {
            return res.status(400).json({ error: "Eksik ödeme bilgileri." });
        }

        const appointment = await Appointment.findOne({ _id: appointmentId, patientId: req.user.id });
        if (!appointment) return res.status(404).json({ error: "Randevu bulunamadı." });

        // Generate a random transaction ID
        const transactionId = "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();

        const payment = await Payment.create({
            patientId: req.user.id,
            appointmentId,
            amount,
            transactionId,
            status: "success",
            paymentMethod: "Credit Card (**** " + cardNumber.slice(-4) + ")"
        });

        appointment.paymentStatus = "paid";
        await appointment.save();

        res.status(201).json({ message: "Ödeme başarıyla tamamlandı.", data: payment });
    } catch (err) {
        res.status(500).json({ error: "Ödeme işlemi başarısız.", message: err.message });
    }
});

// ----------------------------------------------------
// GET PAYMENT HISTORY (INCLUDING FAMILY)
// ----------------------------------------------------
router.get("/payments", patientAuth, async (req, res) => {
    try {
        const familyMembers = await Patient.find({ parentId: req.user.id }).select("_id");
        const patientIds = [req.user.id, ...familyMembers.map(m => m._id)];

        const payments = await Payment.find({ patientId: { $in: patientIds } })
            .populate({
                path: "appointmentId",
                populate: { path: "doctorId", select: "name specialty" }
            })
            .populate("patientId", "name")
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: "Ödeme geçmişi getirilemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// MEDICATION TRACKER: GET TODAY'S DOSES
// ----------------------------------------------------
router.get("/medication-today", patientAuth, async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const prescriptions = await Prescription.find({ patientId: req.user.id })
            .populate("doctorId", "name title");
        
        const selfMeds = await SelfMedication.find({ patientId: req.user.id });

        const logs = await MedicationLog.find({ patientId: req.user.id, date: today });

        const doses = [];

        prescriptions.forEach(p => {
            p.medications.forEach(m => {
                // Simplified frequency parsing
                // "Günde 1 kez" -> ["09:00"]
                // "Günde 2 kez" -> ["09:00", "21:00"]
                // "Günde 3 kez" -> ["09:00", "14:00", "21:00"]
                let times = ["09:00"];
                const freq = m.frequency.toLowerCase();
                if (freq.includes("2 kez") || freq.includes("sabah akşam")) {
                    times = ["09:00", "21:00"];
                } else if (freq.includes("3 kez") || freq.includes("sabah öğle akşam")) {
                    times = ["09:00", "14:00", "21:00"];
                } else if (freq.includes("4 kez")) {
                    times = ["08:00", "12:00", "16:00", "20:00"];
                }

                times.forEach(time => {
                    const log = logs.find(l =>
                        l.prescriptionId && l.prescriptionId.equals(p._id) &&
                        l.medicationName === m.name &&
                        l.timeSlot === time
                    );

                    doses.push({
                        prescriptionId: p._id,
                        medicationName: m.name,
                        dosage: m.dosage,
                        timeSlot: time,
                        taken: log ? log.taken : false,
                        doctorName: p.doctorId?.name || "Doktor"
                    });
                });
            });
        });

        // Add self-entered medications
        selfMeds.forEach(sm => {
            // Check if today falls in date range
            const todayDate = new Date(today);
            if (sm.startDate) {
                const sDate = new Date(sm.startDate.toISOString().split("T")[0]);
                if (sDate > todayDate) return;
            }
            if (sm.endDate) {
                const eDate = new Date(sm.endDate.toISOString().split("T")[0]);
                if (eDate < todayDate) return;
            }

            sm.timeSlots.forEach(time => {
                const log = logs.find(l =>
                    !l.prescriptionId &&
                    l.medicationName === sm.name &&
                    l.timeSlot === time
                );

                doses.push({
                    prescriptionId: null,
                    medicationId: sm._id,
                    medicationName: sm.name,
                    dosage: sm.dosage,
                    timeSlot: time,
                    taken: log ? log.taken : false,
                    isSelfEntered: true,
                    doctorName: "Kişisel İlaç"
                });
            });
        });

        // Sort by time
        doses.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

        res.json(doses);
    } catch (err) {
        res.status(500).json({ error: "İlaç listesi alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// MEDICATION TRACKER: TOGGLE DOSE STATUS
// ----------------------------------------------------
router.post("/medication-log/toggle", patientAuth, async (req, res) => {
    try {
        const { prescriptionId, medicationName, timeSlot, taken } = req.body;
        const today = new Date().toISOString().split("T")[0];

        const log = await MedicationLog.findOneAndUpdate(
            {
                patientId: req.user.id,
                prescriptionId: prescriptionId || null,
                medicationName,
                date: today,
                timeSlot
            },
            {
                taken,
                takenAt: taken ? new Date() : null
            },
            { upsert: true, new: true }
        );

        res.json({ message: "İlaç durumu güncellendi.", log });
    } catch (err) {
        res.status(500).json({ error: "İşlem başarısız.", message: err.message });
    }
});

// ----------------------------------------------------
// PATIENT PORTAL: GET SELF-ENTERED MEDICATIONS
// ----------------------------------------------------
router.get("/self-medications", patientAuth, async (req, res) => {
    try {
        const selfMeds = await SelfMedication.find({ patientId: req.user.id }).sort({ createdAt: -1 });
        res.json(selfMeds);
    } catch (err) {
        res.status(500).json({ error: "Kişisel ilaçlar alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// PATIENT PORTAL: ADD SELF-ENTERED MEDICATION
// ----------------------------------------------------
router.post("/self-medications", patientAuth, async (req, res) => {
    try {
        const { name, dosage, frequency, timeSlots, startDate, endDate } = req.body;
        if (!name || !dosage || !frequency || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            return res.status(400).json({ error: "Lütfen tüm zorunlu alanları doldurun ve en az bir saat dilimi belirtin." });
        }

        const newMed = new SelfMedication({
            patientId: req.user.id,
            name,
            dosage,
            frequency,
            timeSlots,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : undefined
        });

        await newMed.save();
        res.status(201).json({ message: "Kişisel ilaç başarıyla eklendi.", medication: newMed });
    } catch (err) {
        res.status(500).json({ error: "Kişisel ilaç eklenemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// PATIENT PORTAL: DELETE SELF-ENTERED MEDICATION
// ----------------------------------------------------
router.delete("/self-medications/:id", patientAuth, async (req, res) => {
    try {
        const result = await SelfMedication.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
        if (!result) {
            return res.status(404).json({ error: "İlaç bulunamadı veya silme yetkiniz yok." });
        }
        res.json({ message: "Kişisel ilaç başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Kişisel ilaç silinemedi.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY SENT MESSAGES (Messages patient sent to doctors)
// ----------------------------------------------------
router.get("/my-sent-messages", patientAuth, async (req, res) => {
    try {
        const messages = await Message.find({ senderId: req.user.id, senderModel: "Patient" })
            .populate("receiverId", "name role profileId")
            .sort({ date: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Gönderilen mesajlar alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY RADIOLOGY RESULTS
// ----------------------------------------------------
router.get("/my-radiology", patientAuth, async (req, res) => {
    try {
        const results = await Radiology.find({ patientId: req.user.id })
            .populate("doctorId", "name specialty title")
            .sort({ date: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Radyoloji sonuçları alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY MEDICAL REPORTS
// ----------------------------------------------------
router.get("/my-medical-reports", patientAuth, async (req, res) => {
    try {
        const reports = await MedicalReport.find({ patientId: req.user.id })
            .populate("doctorId", "name specialty title")
            .sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: "Tıbbi raporlar alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// MARK ALL NOTIFICATIONS AS READ
// ----------------------------------------------------
router.patch("/notifications/read-all", patientAuth, async (req, res) => {
    try {
        await Notification.updateMany(
            { receiverId: req.user.id, receiverModel: "Patient", isRead: false },
            { isRead: true }
        );
        res.json({ message: "Tüm bildirimler okundu olarak işaretlendi." });
    } catch (err) {
        res.status(500).json({ error: "İşlem başarısız.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY PROCEDURE NOTES
// ----------------------------------------------------
router.get("/my-procedures", patientAuth, async (req, res) => {
    try {
        const procedures = await ProcedureNote.find({ patientId: req.user.id })
            .populate("doctorId", "name specialty title")
            .sort({ date: -1 });
        res.json(procedures);
    } catch (err) {
        res.status(500).json({ error: "Prosedür notları alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET ACTIVE ANNOUNCEMENTS (public — no auth required)
// ----------------------------------------------------
router.get("/announcements", async (req, res) => {
    try {
        const announcements = await Announcement.find({ active: true })
            .sort({ createdAt: -1 })
            .limit(5);
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ error: "Duyurular alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// GET MY PENALTY STATUS
// ----------------------------------------------------
router.get("/my-penalty", patientAuth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id).select("penaltyPoints isBlacklisted name");
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı." });
        res.json({
            penaltyPoints: patient.penaltyPoints || 0,
            isBlacklisted: patient.isBlacklisted || false,
        });
    } catch (err) {
        res.status(500).json({ error: "Ceza bilgisi alınamadı.", message: err.message });
    }
});

// ----------------------------------------------------
// PATIENT HEALTH GOALS ROUTES
// ----------------------------------------------------

// 1. Get all goals for the patient (filtered by day or today)
router.get("/goals", patientAuth, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // Fetch goals for today
        let goals = await Goal.find({
            patientId: req.user.id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        // If no goals exist for today, automatically seed default daily goals
        if (goals.length === 0) {
            const defaultGoals = [
                {
                    patientId: req.user.id,
                    type: "water",
                    title: "Günlük Su Tüketimi",
                    target: 2500,
                    current: 0,
                    unit: "ml",
                    date: startOfDay
                },
                {
                    patientId: req.user.id,
                    type: "steps",
                    title: "Günlük Adım Sayısı",
                    target: 10000,
                    current: 0,
                    unit: "adım",
                    date: startOfDay
                },
                {
                    patientId: req.user.id,
                    type: "sleep",
                    title: "Günlük Uyku Süresi",
                    target: 8,
                    current: 0,
                    unit: "saat",
                    date: startOfDay
                }
            ];
            goals = await Goal.create(defaultGoals);
        }

        res.json(goals);
    } catch (err) {
        res.status(500).json({ error: "Hedefler yüklenemedi.", message: err.message });
    }
});

// 2. Add new custom goal
router.post("/goals", patientAuth, async (req, res) => {
    try {
        const { type, title, target, current, unit, date } = req.body;

        if (!type || !title || target === undefined || !unit) {
            return res.status(400).json({ error: "Tür, başlık, hedef ve birim zorunludur." });
        }

        const goalDate = date ? new Date(date) : new Date();

        const goal = await Goal.create({
            patientId: req.user.id,
            type,
            title,
            target,
            current: current || 0,
            unit,
            date: goalDate
        });

        res.status(201).json({ message: "Hedef eklendi.", data: goal });
    } catch (err) {
        res.status(500).json({ error: "Hedef eklenemedi.", message: err.message });
    }
});

// 3. Update goal (current value / target)
router.put("/goals/:id", patientAuth, async (req, res) => {
    try {
        const { current, target, title, unit } = req.body;
        
        // Find existing to compute new values correctly
        const existingGoal = await Goal.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!existingGoal) return res.status(404).json({ error: "Hedef bulunamadı." });

        const updatedCurrent = current !== undefined ? current : existingGoal.current;
        const updatedTarget = target !== undefined ? target : existingGoal.target;
        const isCompleted = updatedCurrent >= updatedTarget;

        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, patientId: req.user.id },
            { 
                current: updatedCurrent, 
                target: updatedTarget, 
                title: title !== undefined ? title : existingGoal.title,
                unit: unit !== undefined ? unit : existingGoal.unit,
                isCompleted 
            },
            { new: true }
        );

        res.json({ message: "Hedef güncellendi.", data: goal });
    } catch (err) {
        res.status(500).json({ error: "Hedef güncellenemedi.", message: err.message });
    }
});

// 4. Delete goal
router.delete("/goals/:id", patientAuth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
        if (!goal) return res.status(404).json({ error: "Hedef bulunamadı." });
        res.json({ message: "Hedef silindi." });
    } catch (err) {
        res.status(500).json({ error: "Hedef silinemedi.", message: err.message });
    }
});

export default router;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import appointmentRoutes from "./routes/appointments.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import adminRoutes from "./routes/admin.js";
import labResultRoutes from "./routes/labResults.js";
import radiologyRoutes from "./routes/radiology.js";
import medicalReportRoutes from "./routes/medicalReports.js";
import procedureNoteRoutes from "./routes/procedureNotes.js";
import analyticsRoutes from "./routes/analytics.js";
import financeRoutes from "./routes/finance.js";
import pharmacyRoutes from "./routes/pharmacy.js";

// --- PATIENT PORTAL ROUTES ---
import patientAuthRoutes from "./routes/patientAuth.js";
import patientPortalRoutes from "./routes/patientPortal.js";
import aiRoutes from "./routes/ai.js";
import leaveRequestRoutes from "./routes/leaveRequests.js";
import ikNotificationRoutes from "./routes/ikNotifications.js";

// --- HR PANEL ---
import hrRoutes from "./routes/hr.js";
import itRequestsRoutes from "./routes/itRequests.js";

// --- TECHNICIAN PANEL ---
import technicianRoutes from "./routes/technician.js";

// --- JOURNAL ---
import journalRoutes from "./routes/journal.js";

import { initCronJobs } from "./utils/reminders.js";

dotenv.config();

// Initialize Cron Jobs
initCronJobs();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/lab-results", labResultRoutes);
app.use("/api/radiology", radiologyRoutes);
app.use("/api/medical-reports", medicalReportRoutes);
app.use("/api/procedure-notes", procedureNoteRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/finance", financeRoutes);

// --- PATIENT PORTAL API ---
app.use("/api/patient-auth", patientAuthRoutes);
app.use("/api/patient-portal", patientPortalRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/ik-notifications", ikNotificationRoutes);

// --- HR PANEL API ---
app.use("/api/hr", hrRoutes);

// --- TECHNICIAN PANEL API ---
app.use("/api/technician", technicianRoutes);

// --- JOURNAL API ---
app.use("/api/journal", journalRoutes);

// --- PHARMACY API ---
app.use("/api/pharmacy", pharmacyRoutes);

// --- IT REQUESTS API ---
app.use("/api/it-requests", itRequestsRoutes);

import SystemSetting from "./models/SystemSetting.js";

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "MediTrack API çalışıyor 🚀" });
});

// Public System Status for Lockdown/Maintenance
app.get("/api/system-status", async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({});
        }
        res.json({
            maintenanceMode: settings.maintenanceMode || false,
            emergencyLockdown: settings.emergencyLockdown || false,
            hospitalName: settings.hospitalName || "MediTrack Merkez Hastanesi"
        });
    } catch (err) {
        res.status(500).json({ error: "Sistem durumu alınamadı", message: err.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Sunucu hatası", message: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 MediTrack API: http://localhost:${PORT}`);
});

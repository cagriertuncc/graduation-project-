import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    reportType: {
        type: String,
        enum: ["Sevk", "İstirahat", "Sağlık Kurulu", "Epikriz", "Diğer"],
        required: [true, "Rapor türü zorunludur"],
    },
    title: {
        type: String,
        required: [true, "Rapor başlığı zorunludur"],
        trim: true,
    },
    content: {
        type: String,
        required: [true, "Rapor içeriği zorunludur"],
        trim: true,
    },
    diagnosis: {
        type: String,
        trim: true,
    },
    startDate: {
        type: Date, // İstirahat başlangıç
    },
    endDate: {
        type: Date, // İstirahat bitiş
    },
    referredTo: {
        type: String,
        trim: true, // Sevk edilen bölüm/hastane
    },
    status: {
        type: String,
        enum: ["taslak", "tamamlandı", "onaylandı"],
        default: "taslak",
    },
    notes: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

medicalReportSchema.index({ doctorId: 1, date: -1 });
medicalReportSchema.index({ patientId: 1 });

export default mongoose.model("MedicalReport", medicalReportSchema);

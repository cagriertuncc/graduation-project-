import mongoose from "mongoose";

const procedureNoteSchema = new mongoose.Schema({
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
    procedureType: {
        type: String,
        enum: ["Ameliyat", "Küçük Cerrahi", "Biyopsi", "Endoskopi", "Enjeksiyon", "Pansuman", "Diğer"],
        required: [true, "İşlem türü zorunludur"],
    },
    procedureName: {
        type: String,
        required: [true, "İşlem adı zorunludur"],
        trim: true,
    },
    indication: {
        type: String,
        trim: true, // Endikasyon / neden
    },
    technique: {
        type: String,
        trim: true, // Uygulanan teknik
    },
    findings: {
        type: String,
        trim: true, // Bulgular
    },
    complications: {
        type: String,
        trim: true, // Komplikasyonlar
    },
    anesthesia: {
        type: String,
        enum: ["Genel", "Lokal", "Spinal", "Sedasyon", "Yok", "Diğer"],
        default: "Yok",
    },
    duration: {
        type: String,
        trim: true, // "45 dakika", "2 saat"
    },
    status: {
        type: String,
        enum: ["planlandı", "tamamlandı", "iptal"],
        default: "tamamlandı",
    },
    postOpInstructions: {
        type: String,
        trim: true, // Operasyon sonrası talimatlar
    },
    notes: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

procedureNoteSchema.index({ doctorId: 1, date: -1 });
procedureNoteSchema.index({ patientId: 1 });

export default mongoose.model("ProcedureNote", procedureNoteSchema);

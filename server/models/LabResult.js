import mongoose from "mongoose";

const resultItemSchema = new mongoose.Schema({
    parameter: {
        type: String,
        required: true,
        trim: true, // "WBC", "Hemoglobin", "Glukoz" vb.
    },
    value: {
        type: String,
        required: true,
        trim: true,
    },
    unit: {
        type: String,
        trim: true, // "mg/dL", "g/L", "10^3/uL"
    },
    referenceRange: {
        type: String,
        trim: true, // "4.0 - 10.0"
    },
    isAbnormal: {
        type: Boolean,
        default: false,
    },
});

const labResultSchema = new mongoose.Schema({
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
    testType: {
        type: String,
        enum: ["Kan", "İdrar", "Biyokimya", "Hormon", "Diğer"],
        required: [true, "Test türü zorunludur"],
    },
    testName: {
        type: String,
        required: [true, "Test adı zorunludur"],
        trim: true, // "Tam Kan Sayımı", "Tiroid Fonksiyon Testi"
    },
    status: {
        type: String,
        enum: ["beklemede", "tamamlandı", "anormal"],
        default: "beklemede",
    },
    results: [resultItemSchema],
    labName: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

labResultSchema.index({ doctorId: 1, date: -1 });
labResultSchema.index({ patientId: 1 });

export default mongoose.model("LabResult", labResultSchema);

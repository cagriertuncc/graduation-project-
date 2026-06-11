import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    dosage: {
        type: String,
        required: true,
        trim: true,
    },
    frequency: {
        type: String,
        required: true,
        trim: true, // "Günde 2 kez", "Haftada 1" vb.
    },
    duration: {
        type: String,
        trim: true, // "30 gün", "3 ay" vb.
    },
});

const prescriptionSchema = new mongoose.Schema({
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
    diagnosis: {
        type: String,
        required: [true, "Tanı zorunludur"],
        trim: true,
    },
    medications: [medicationSchema],
    notes: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["beklemede", "verildi"],
        default: "beklemede",
    },
}, { timestamps: true });

prescriptionSchema.index({ doctorId: 1, date: -1 });
prescriptionSchema.index({ patientId: 1 });

export default mongoose.model("Prescription", prescriptionSchema);

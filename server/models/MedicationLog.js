import mongoose from "mongoose";

const medicationLogSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prescription",
        required: false
    },
    medicationName: {
        type: String,
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    timeSlot: {
        type: String, // e.g., "08:00", "14:00", "20:00"
        required: true
    },
    taken: {
        type: Boolean,
        default: false
    },
    takenAt: {
        type: Date
    }
}, { timestamps: true });

// Ensure a patient can only have one log per medication/date/timeslot
medicationLogSchema.index({ patientId: 1, date: 1, medicationName: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model("MedicationLog", medicationLogSchema);

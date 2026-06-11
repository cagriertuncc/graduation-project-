import mongoose from "mongoose";

const vitalSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    type: {
        type: String,
        enum: ["blood_pressure", "blood_sugar", "weight", "pulse", "oxygen", "temperature", "cholesterol"],
        required: true,
    },
    value: {
        type: String, // Storing as string to handle "120/80" for BP or simple numbers
        required: true,
    },
    unit: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

// Index for faster queries by patient and date
vitalSchema.index({ patientId: 1, date: -1 });

export default mongoose.model("Vital", vitalSchema);

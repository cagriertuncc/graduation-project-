import mongoose from "mongoose";

const medicalFileSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true, // e.g., 'application/pdf', 'image/jpeg'
    },
    url: {
        type: String,
        required: true, // Path to file on disk or cloud storage
    },
    uploadedBy: {
        type: String,
        enum: ["patient", "doctor"],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

medicalFileSchema.index({ patientId: 1, date: -1 });

export default mongoose.model("MedicalFile", medicalFileSchema);

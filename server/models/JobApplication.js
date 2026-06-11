import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "JobPosting", required: true },
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    experienceYears: { type: Number, default: 0 },
    education: { type: String },
    cvUrl: { type: String }, // optional file path
    status: {
        type: String,
        enum: ["Yeni", "İnceleniyor", "Mülakat", "Teklif", "Kabul", "Ret"],
        default: "Yeni"
    },
    score: { type: Number, min: 0, max: 100, default: 0 }, // optional AI or manual score
    notes: { type: String }
}, { timestamps: true });

export default mongoose.model("JobApplication", jobApplicationSchema);

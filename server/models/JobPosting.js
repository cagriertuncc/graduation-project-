import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    department: { type: String, required: true },
    type: { type: String, required: true, enum: ["Tam Zamanlı", "Yarı Zamanlı", "Sözleşmeli", "Stajyer"] },
    location: { type: String, required: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    status: { type: String, enum: ["Aktif", "Kapalı"], default: "Aktif" },
    applicationCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("JobPosting", jobPostingSchema);

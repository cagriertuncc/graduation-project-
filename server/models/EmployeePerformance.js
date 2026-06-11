import mongoose from "mongoose";

const employeePerformanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    period: { type: String, required: true }, // e.g. "2026-Q1" or "2026-03"
    score: { type: Number, required: true, min: 0, max: 100 },
    metrics: {
        hastaMemnuniyeti: { type: Number, min: 0, max: 100 },
        randevuTamamlama: { type: Number, min: 0, max: 100 },
        iletisim: { type: Number, min: 0, max: 100 },
        zamanYonetimi: { type: Number, min: 0, max: 100 }
    },
    notes: { type: String },
    status: { type: String, enum: ["Taslak", "Tamamlandı"], default: "Tamamlandı" }
}, { timestamps: true });

export default mongoose.model("EmployeePerformance", employeePerformanceSchema);

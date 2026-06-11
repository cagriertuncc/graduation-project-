import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctorName: { type: String, required: true },
    tip: { type: String, required: true, enum: ["Yıllık İzin", "Hastalık İzni", "Mazeret İzni", "Ücretsiz İzin"] },
    baslangic: { type: Date, required: true },
    bitis: { type: Date, required: true },
    gun: { type: Number, required: true },
    aciklama: { type: String, default: "" },
    durum: { type: String, enum: ["Beklemede", "Onaylı", "Reddedildi"], default: "Beklemede" },
    onaylayanId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notlar: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("LeaveRequest", leaveRequestSchema);

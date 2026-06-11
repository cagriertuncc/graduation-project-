import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    // Kime gönderildiği
    aliciRol: { type: String, enum: ["hr", "doctor", "admin"], required: true },
    aliciId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null = tüm hr
    // İçerik
    tip: { type: String, enum: ["izin_talebi", "izin_onaylandi", "izin_reddedildi"], required: true },
    baslik: { type: String, required: true },
    mesaj: { type: String, required: true },
    // İlgili kayıt
    kaynakId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveRequest" },
    // Durum
    okundu: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("IKNotification", notificationSchema);

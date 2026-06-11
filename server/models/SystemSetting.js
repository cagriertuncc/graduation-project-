import mongoose from "mongoose";

const SystemSettingSchema = new mongoose.Schema({
    hospitalName: { type: String, default: "MediTrack Merkez Hastanesi" },
    contactEmail: { type: String, default: "iletisim@meditrack.com" },
    maxAppointmentsPerDay: { type: Number, default: 40 },
    maintenanceMode: { type: Boolean, default: false },
    emergencyLockdown: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("SystemSetting", SystemSettingSchema);

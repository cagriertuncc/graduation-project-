import mongoose from "mongoose";

const dutyShiftSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Kullanıcı seçimi zorunludur"]
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: [true, "Nöbet tarihi zorunludur"]
    },
    note: {
        type: String, // Örn: "Gece Nöbeti", "Hafta Sonu Acil"
        default: ""
    }
}, { timestamps: true });

// A user can have multiple shifts per day, but let's prevent duplicate assignments of the same user on the same date with the exact same note
dutyShiftSchema.index({ userId: 1, date: 1, note: 1 }, { unique: true });

export default mongoose.model("DutyShift", dutyShiftSchema);

import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    date: {
        type: Date,
        required: [true, "Randevu tarihi zorunludur"],
    },
    time: {
        type: String,
        required: [true, "Randevu saati zorunludur"],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Geçerli saat formatı: HH:MM"],
    },
    duration: {
        type: Number,
        default: 30,
        enum: [15, 30, 45, 60],
    },
    type: {
        type: String,
        enum: ["Kontrol", "Takip", "İlk Muayene", "Acil"],
        default: "Kontrol",
    },
    status: {
        type: String,
        enum: ["bekliyor", "tamamlandı", "iptal"],
        default: "bekliyor",
    },
    notes: {
        type: String,
        trim: true,
    },
    room: {
        type: String,
        default: "Muayene 1",
        trim: true,
    },
    fee: {
        type: Number,
        default: 500, // Varsayılan muayene ücreti
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid",
    },
    review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now }
    }
}, { timestamps: true });

// Cumartesi yarım gün, Pazar tatil validasyonu
appointmentSchema.pre("validate", function (next) {
    if (this.date) {
        const day = this.date.getDay(); // 0=Pazar, 6=Cumartesi
        if (day === 0) {
            return next(new Error("Pazar günü randevu alınamaz"));
        }
        if (day === 6) {
            const hour = parseInt(this.time.split(":")[0]);
            if (hour >= 13) {
                return next(new Error("Cumartesi günü sadece 09:00-13:00 arası randevu alınabilir"));
            }
        }
    }
    next();
});

// Indexler
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ status: 1 });

export default mongoose.model("Appointment", appointmentSchema);

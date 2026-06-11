import mongoose from "mongoose";

const diseaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Hastalık adı zorunludur"],
        trim: true,
    },
    diagnosedDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["tedavi", "iyileşti", "kronik"],
        default: "tedavi",
    },
    severity: {
        type: String,
        enum: ["hafif", "orta", "ciddi"],
        default: "orta",
    },
    notes: {
        type: String,
        trim: true,
    },
    medications: [{
        type: String,
        trim: true,
    }],
});

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Hasta adı zorunludur"],
        trim: true,
    },
    age: {
        type: Number,
        required: true,
        min: [0, "Yaş 0'dan küçük olamaz"],
        max: [120, "Geçerli bir yaş giriniz"],
    },
    gender: {
        type: String,
        enum: ["Erkek", "Kadın"],
        required: true,
    },
    tc: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Geçerli bir e-posta adresi giriniz"],
    },
    password: {
        type: String, // Hashed
        select: false, // Default hidden
    },
    role: {
        type: String,
        default: "patient",
    },
    phone: {
        type: String,
        trim: true,
    },
    bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    registeredDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["active", "inactive", "archived"],
        default: "active",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    penaltyPoints: {
        type: Number,
        default: 0,
    },
    isBlacklisted: {
        type: Boolean,
        default: false,
    },
    height: {
        type: Number,
        min: [30, "Boy 30 cm'den az olamaz"],
        max: [250, "Geçerli bir boy giriniz"],
    },
    weight: {
        type: Number,
        min: [2, "Kilo 2 kg'dan az olamaz"],
        max: [500, "Geçerli bir kilo giriniz"],
    },
    chronicDiseases: {
        type: String,
        trim: true,
    },
    allergies: {
        type: String,
        trim: true,
    },
    smokingAlcoholStatus: {
        type: String,
        trim: true,
    },
    emergencyContact: {
        name: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
    },
    diseases: [diseaseSchema],
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor", // Artık hastalar başlangıçta doktorsuz eklenebilir
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        default: null
    },
    relationship: {
        type: String,
        enum: ["Self", "Child", "Spouse", "Parent", "Other", "Kendim", "Çocuk", "Eş", "Anne/Baba", "Diğer"],
        default: "Self"
    }
}, { timestamps: true });

// Doktor bazlı sorgu için index
patientSchema.index({ doctorId: 1 });
patientSchema.index({ name: "text" });

export default mongoose.model("Patient", patientSchema);

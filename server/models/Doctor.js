import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Doktor adı zorunludur"],
        trim: true,
    },
    specialty: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
        default: "",
    },
    workingHours: {
        type: Map,
        of: String,
        default: {
            monday: "09:00-17:00",
            tuesday: "09:00-17:00",
            wednesday: "09:00-17:00",
            thursday: "09:00-17:00",
            friday: "09:00-17:00",
            saturday: "09:00-13:00",
            sunday: "tatil",
        },
    },
    dailyPatientLimit: {
        type: Number,
        default: 40
    },
    isOnline: {
        type: Boolean,
        default: true
    },
    salary: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model("Doctor", doctorSchema);

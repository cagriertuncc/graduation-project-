import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/meditrack";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "doctor", "patient", "staff", "accountant", "hr", "technician", "pharmacist", "receptionist"], required: true },
    profileModel: { type: String, enum: ["Doctor", "Patient"] },
    profileId: { type: mongoose.Schema.Types.ObjectId, refPath: "profileModel" },
}, { timestamps: true });

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

async function createReceptionist() {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB bağlandı");

    const email = "danisma@hastane.com";
    const password = "123456";
    const role = "receptionist";
    const name = "Hasta Danışma & Kabul";

    const existing = await User.findOne({ email });
    if (existing) {
        existing.role = "receptionist";
        if (password) {
            const salt = await bcrypt.genSalt(10);
            existing.password = await bcrypt.hash(password, salt);
        }
        await existing.save();
        console.log("🔄 Mevcut kullanıcı güncellendi: role → receptionist");
    } else {
        // Create a doctor profile (since it's used for staff profiles in this project)
        const profile = await Doctor.create({
            name,
            specialty: "Danışma",
            phone: "05551234567"
        });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        await User.create({
            email,
            password: hashed,
            role,
            profileModel: "Doctor",
            profileId: profile._id
        });
        console.log("✅ Tıbbi Sekreter oluşturuldu:", email, "/ şifre:", password);
    }

    await mongoose.disconnect();
    console.log("🎉 İşlem tamamlandı!");
}

createReceptionist().catch(e => { console.error("❌ Hata:", e.message); process.exit(1); });

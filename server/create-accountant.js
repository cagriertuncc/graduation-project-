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
    role: { type: String, enum: ["admin", "doctor", "patient", "staff", "accountant"], required: true },
    profileModel: { type: String, enum: ["Doctor", "Patient"] },
    profileId: { type: mongoose.Schema.Types.ObjectId, refPath: "profileModel" },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAccountant() {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB bağlandı");

    const email = "muhasebe@hastane.com";
    const password = "123456";
    const role = "accountant";

    const existing = await User.findOne({ email });
    if (existing) {
        if (existing.role !== "accountant") {
            existing.role = "accountant";
            await existing.save();
            console.log("🔄 Mevcut kullanıcı güncellendi: role → accountant");
        } else {
            console.log("ℹ️  Muhasebeci zaten mevcut:", email);
        }
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        await User.create({ email, password: hashed, role });
        console.log("✅ Muhasebeci oluşturuldu:", email, "/ şifre:", password);
    }

    await mongoose.disconnect();
    console.log("🎉 Tamamlandı!");
}

createAccountant().catch(e => { console.error("❌ Hata:", e.message); process.exit(1); });

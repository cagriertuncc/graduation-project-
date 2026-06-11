import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Doctor from "./models/Doctor.js";

dotenv.config();

const addHRUser = async () => {
    await connectDB();

    const existing = await User.findOne({ email: "ik@hastane.com" });
    if (existing) {
        console.log("⚠️  ik@hastane.com zaten mevcut, güncelleniyor...");
        await User.deleteOne({ email: "ik@hastane.com" });
    }

    const profile = await Doctor.create({
        name: "İK Yöneticisi",
        specialty: "İnsan Kaynakları",
        phone: "0555 000 0099"
    });

    await User.create({
        email: "ik@hastane.com",
        password: "123456",
        role: "hr",
        profileModel: "Doctor",
        profileId: profile._id
    });

    console.log("✅ İK kullanıcısı oluşturuldu!");
    console.log("   E-posta : ik@hastane.com");
    console.log("   Şifre   : 123456");
    console.log("   Rol     : hr");
    process.exit(0);
};

addHRUser().catch(err => {
    console.error("❌ Hata:", err.message);
    process.exit(1);
});

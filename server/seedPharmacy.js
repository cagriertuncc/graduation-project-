import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import User from "./models/User.js";
import MedicationStock from "./models/MedicationStock.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/meditrack";

const initialStocks = [
    { name: "Parol 500 mg", stock: 120, criticalLimit: 15, unit: "Kutu" },
    { name: "Augmentin 1000 mg", stock: 8, criticalLimit: 10, unit: "Kutu" }, // Bitiyor olsun (yetersiz stok/uyarı)
    { name: "Coraspin 100 mg", stock: 85, criticalLimit: 20, unit: "Kutu" },
    { name: "Lansor 30 mg", stock: 45, criticalLimit: 8, unit: "Kutu" },
    { name: "Majezik 100 mg", stock: 60, criticalLimit: 12, unit: "Kutu" },
    { name: "Arveles 25 mg", stock: 110, criticalLimit: 15, unit: "Kutu" },
    { name: "Dolorex 50 mg", stock: 4, criticalLimit: 8, unit: "Kutu" }, // Bitiyor
    { name: "Aprol 550 mg", stock: 35, criticalLimit: 10, unit: "Kutu" }
];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Eczacı Kullanıcısını Oluştur
        const email = "eczane@hastane.com";
        const password = "123456";
        const role = "pharmacist";

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("ℹ️ Pharmacist user already exists:", email);
            // Şifreyi de sıfırlayalım ki çift hashlenme düzelsin
            existingUser.password = password; 
            existingUser.role = role;
            await existingUser.save();
            console.log("🔄 Updated existing pharmacist password and role.");
        } else {
            await User.create({ email, password, role });
            console.log("✅ Pharmacist user created:", email, "/ password: 123456");
        }

        // 2. İlaç Stoklarını Tohumla
        console.log("Seeding medication stocks...");
        for (const item of initialStocks) {
            const existingStock = await MedicationStock.findOne({
                name: { $regex: new RegExp("^" + item.name + "$", "i") }
            });

            if (existingStock) {
                console.log(`ℹ️ Stock already exists for: ${item.name}`);
            } else {
                await MedicationStock.create(item);
                console.log(`✅ Seeded stock for: ${item.name}`);
            }
        }

        console.log("🎉 Seeding completed successfully!");
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});

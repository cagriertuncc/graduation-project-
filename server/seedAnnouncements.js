import mongoose from "mongoose";
import Announcement from "./models/Announcement.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/meditrack";

async function seedAnnouncements() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    console.log("Cleaning old announcements...");
    await Announcement.deleteMany({});

    console.log("Seeding announcements...");
    const dummyAnnouncements = [
        {
            title: "Yeni Otopark Kartları Dağıtımı",
            message: "Tüm personelimizin yeni hastane otopark giriş kartlarını en geç Cuma gününe kadar İdari İşler departmanından almaları rica olunur. Eski kartlar Pazartesi gününden itibaren geçersiz olacaktır.",
            type: "info",
            active: true
        },
        {
            title: "Planlı Güç Kesintisi Uyarısı",
            message: "14 Haziran Pazar günü 02:00 - 04:00 saatleri arasında hastane ana binasında planlı trafo bakımı yapılacaktır. Jeneratörler devreye girecektir fakat kritik olmayan cihazların kapalı tutulması önerilir.",
            type: "warning",
            active: true
        },
        {
            title: "Kritik Kan Stoku İhtiyacı (A Rh+)",
            message: "Hastanemiz kan merkezinde A Rh+ kan stoku kritik seviyeye gerilemiştir. Bağış yapmak isteyen personelimizin acil olarak kan merkezine başvurması rica olunur.",
            type: "critical",
            active: true
        }
    ];

    await Announcement.insertMany(dummyAnnouncements);
    console.log("🎉 Announcements seeded successfully!");
    await mongoose.disconnect();
}

seedAnnouncements().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});

import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Doctor from "./models/Doctor.js";
import Patient from "./models/Patient.js";
import Appointment from "./models/Appointment.js";
import LabResult from "./models/LabResult.js";
import Radiology from "./models/Radiology.js";
import bcrypt from "bcrypt";

dotenv.config();

const seed = async () => {
    await connectDB();

    console.log("🗑️  Mevcut veriler temizleniyor...");
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await LabResult.deleteMany({});
    await Radiology.deleteMany({});

    // ─── İK ve Muhasebe Kullanıcıları ───────────────
    console.log("🧑‍💼 İK kullanıcısı oluşturuluyor...");
    const ikProfile = await Doctor.create({
        name: "İnsan Kaynakları",
        specialty: "İK Yöneticisi",
        phone: "0555 000 0099"
    });
    await User.create({
        email: "ik@hastane.com",
        password: "123456",
        role: "hr",
        profileModel: "Doctor",
        profileId: ikProfile._id
    });
    console.log("   ✅ İK Kullanıcısı - ik@hastane.com (Rol: hr)");

    // ─── Teknisyen Kullanıcısı ──────────────────────
    console.log("🧪 Teknisyen kullanıcısı oluşturuluyor...");
    const tekProfile = await Doctor.create({
        name: "Laboratuvar Teknisyeni",
        specialty: "Baş Teknisyen",
        phone: "0555 000 0088"
    });
    await User.create({
        email: "tek@hastane.com",
        password: "123456",
        role: "technician",
        profileModel: "Doctor",
        profileId: tekProfile._id
    });
    console.log("   ✅ Teknisyen Kullanıcısı - tek@hastane.com (Rol: technician)");

    // ─── Doktorlar ──────────────────────────────────
    console.log("👨‍⚕️ Doktorlar oluşturuluyor...");

    const docsToCreate = [
        {
            name: "Uzman Can Tekin",
            email: "admin@hastane.com",
            password: "123456",
            specialty: "Bilgi İşlem Uzmanı",
            phone: "-",
            isAdmin: true,
        },
        {
            name: "Başhekim Dr. Sinan Öztürk",
            email: "idare@hastane.com",
            password: "123456",
            specialty: "Başhekim / Hastane İdaresi",
            phone: "0533 111 2233",
            role: "director",
        },
        {
            name: "İdari Memur Meltem Yılmaz",
            email: "personel@hastane.com",
            password: "123456",
            specialty: "İdari İşler Personeli",
            phone: "0533 222 3344",
            role: "staff",
        },
        {
            name: "Dr. Ahmet Yılmaz",
            email: "ahmet.yilmaz@hastane.com",
            password: "123456",
            specialty: "Dahiliye Uzmanı",
            phone: "0530 000 1122",
        },
        {
            name: "Dr. Canan Öz",
            email: "canan.oz@hastane.com",
            password: "123456",
            specialty: "Dahiliye Uzmanı",
            phone: "0530 111 2233",
        },
        {
            name: "Dr. Ayşe Kaya",
            email: "ayse.kaya@hastane.com",
            password: "123456",
            specialty: "Kardiyoloji Uzmanı",
            phone: "0532 999 8877",
        },
        {
            name: "Dr. Murat Kılıç",
            email: "murat.kilic@hastane.com",
            password: "123456",
            specialty: "Kardiyoloji Uzmanı",
            phone: "0532 888 7766",
        },
        {
            name: "Dr. Mehmet Öz",
            email: "mehmet.oz@hastane.com",
            password: "123456",
            specialty: "Nöroloji Uzmanı",
            phone: "0533 555 4433",
        },
        {
            name: "Dr. Zeynep Aksoy",
            email: "zeynep.aksoy@hastane.com",
            password: "123456",
            specialty: "Nöroloji Uzmanı",
            phone: "0533 444 3322",
        },
        {
            name: "Müdür Hakan Çelik",
            email: "it.mudur@hastane.com",
            password: "123456",
            specialty: "Bilgi İşlem Müdürü",
            phone: "-",
            role: "admin",
        },
        {
            name: "Müdür Yrd. Leyla Aslan",
            email: "it.muduryrd@hastane.com",
            password: "123456",
            specialty: "Bilgi İşlem Müdür Yardımcısı",
            phone: "-",
            role: "admin",
        },
        {
            name: "Dr. Fatma Şahin",
            email: "fatma.sahin@hastane.com",
            password: "123456",
            specialty: "Çocuk Sağlığı ve Hastalıkları",
            phone: "0544 333 2211",
        },
        {
            name: "Dr. Kerem Arslan",
            email: "kerem.arslan@hastane.com",
            password: "123456",
            specialty: "Çocuk Sağlığı ve Hastalıkları",
            phone: "0544 444 3322",
        },
        {
            name: "Dr. Serkan Yılmaz",
            email: "serkan.yilmaz@hastane.com",
            password: "123456",
            specialty: "Ortopedi ve Travmatoloji",
            phone: "0545 444 3322",
        },
        {
            name: "Dr. Elif Yurt",
            email: "elif.yurt@hastane.com",
            password: "123456",
            specialty: "Ortopedi ve Travmatoloji",
            phone: "0545 555 4433",
        },
        {
            name: "Dr. Selin Aydın",
            email: "selin.aydin@hastane.com",
            password: "123456",
            specialty: "Göz Hastalıkları",
            phone: "0546 555 4433",
        },
        {
            name: "Dr. Hakan Demir",
            email: "hakan.demir@hastane.com",
            password: "123456",
            specialty: "Göz Hastalıkları",
            phone: "0546 666 5544",
        },
        {
            name: "Dr. Yasemin Yalçın",
            email: "yasemin.yalcin@hastane.com",
            password: "123456",
            specialty: "Dermatoloji (Cildiye)",
            phone: "0547 111 2233",
        },
        {
            name: "Dr. Hakan Yıldız",
            email: "hakan.yildiz@hastane.com",
            password: "123456",
            specialty: "Dermatoloji (Cildiye)",
            phone: "0547 222 3344",
        },
        {
            name: "Dr. Merve Şen",
            email: "merve.sen@hastane.com",
            password: "123456",
            specialty: "Fiziksel Tıp ve Rehabilitasyon",
            phone: "0548 111 2233",
        },
        {
            name: "Dr. Kemal Koç",
            email: "kemal.koc@hastane.com",
            password: "123456",
            specialty: "Fiziksel Tıp ve Rehabilitasyon",
            phone: "0548 222 3344",
        },
        {
            name: "Dr. Serdar Polat",
            email: "serdar.polat@hastane.com",
            password: "123456",
            specialty: "Genel Cerrahi",
            phone: "0549 111 2233",
        },
        {
            name: "Dr. Ebru Çelik",
            email: "ebru.celik@hastane.com",
            password: "123456",
            specialty: "Genel Cerrahi",
            phone: "0549 222 3344",
        },
        {
            name: "Dr. Emre Kurt",
            email: "emre.kurt@hastane.com",
            password: "123456",
            specialty: "Kulak Burun Boğaz",
            phone: "0550 111 2233",
        },
        {
            name: "Dr. Deniz Aslan",
            email: "deniz.aslan@hastane.com",
            password: "123456",
            specialty: "Kulak Burun Boğaz",
            phone: "0550 222 3344",
        }
    ];

    const docs = [];
    for (const d of docsToCreate) {
        const role = d.role || (d.isAdmin ? "admin" : "doctor");

        const docProfile = await Doctor.create({
            name: d.name,
            specialty: d.specialty,
            phone: d.phone
        });

        await User.create({
            email: d.email,
            password: d.password,
            role: role,
            profileModel: "Doctor",
            profileId: docProfile._id
        });

        docs.push(docProfile);
        console.log(`   ✅ ${docProfile.name} (${docProfile.specialty}) - ${d.email} (Rol: ${role})`);
    }

    // Docs by index: 0 = Admin, 1 = Dahiliye (Ahmet), 2 = Kardiyo (Ayşe), 3 = Nöroloji (Mehmet)

    // ─── Hastalar ───────────────────────────────────
    console.log("🏥 Hastalar oluşturuluyor...");
    const patientsRaw = [
        // DAHILIYE 1 (Ahmet Yılmaz)
        {
            docIdx: 2, name: "Elif Kaya", age: 34, gender: "Kadın", phone: "0532 111 2233",
            email: "elif.kaya@mail.com", bloodType: "A+", registeredDate: "2025-06-15", status: "active",
            diseases: [{ name: "Tip 2 Diyabet", diagnosedDate: "2025-06-15", status: "tedavi", severity: "orta", notes: "HbA1c: 7.2. Metformin başlandı.", medications: ["Metformin 1000mg"] }]
        },
        {
            docIdx: 2, name: "Fatma Yıldız", age: 45, gender: "Kadın", phone: "0536 555 6677",
            email: "fatma.yildiz@mail.com", bloodType: "A-", registeredDate: "2025-07-22", status: "active",
            diseases: [{ name: "Hipotiroidizm", diagnosedDate: "2025-07-22", status: "tedavi", severity: "hafif", notes: "TSH: 12.5. Levotiroksin başlandı.", medications: ["Levotiroksin 50mcg"] }]
        },
        // DAHILIYE 2 (Canan Öz)
        {
            docIdx: 3, name: "Hasan Arslan", age: 41, gender: "Erkek", phone: "0537 666 7788",
            email: "hasan.arslan@mail.com", bloodType: "O+", registeredDate: "2025-05-05", status: "active",
            diseases: [
                { name: "Gastrit", diagnosedDate: "2025-05-05", status: "iyileşti", severity: "hafif", notes: "PPI başlandı.", medications: ["Lansoprazol 30mg"] },
                { name: "Üriner Sistem Enfeksiyonu", diagnosedDate: "2025-10-10", status: "iyileşti", severity: "hafif", notes: "Kültürde E.coli üredi.", medications: ["Siprofloksasin 500mg"] }
            ]
        },

        // KARDiYOLOJI 1 (Ayşe Kaya)
        {
            docIdx: 4, name: "Mehmet Demir", age: 52, gender: "Erkek", phone: "0533 222 3344",
            email: "mehmet.demir@mail.com", bloodType: "B+", registeredDate: "2025-03-10", status: "active",
            diseases: [{ name: "Koroner Arter Hastalığı", diagnosedDate: "2025-03-10", status: "tedavi", severity: "ciddi", notes: "Anjiyografi yapıldı. Stent uygulandı.", medications: ["Aspirin 100mg", "Metoprolol 50mg"] }]
        },
        {
            docIdx: 4, name: "Ali Öztürk", age: 67, gender: "Erkek", phone: "0535 444 5566",
            email: "ali.ozturk@mail.com", bloodType: "AB+", registeredDate: "2024-11-20", status: "active",
            diseases: [
                { name: "Kalp Yetmezliği", diagnosedDate: "2024-11-20", status: "tedavi", severity: "ciddi", notes: "EKO'da EF %35.", medications: ["Furosemid", "Enalapril"] },
                { name: "Hipertansiyon", diagnosedDate: "2024-12-01", status: "tedavi", severity: "orta", notes: "Kan basıncı: 160/100.", medications: ["Ramipril 5mg"] }
            ]
        },
        // KARDiYOLOJI 2 (Murat Kılıç)
        {
            docIdx: 5, name: "Selma Yılmaz", age: 59, gender: "Kadın", phone: "0533 123 4567",
            email: "selma.y@mail.com", bloodType: "O-", registeredDate: "2026-01-10", status: "active",
            diseases: [{ name: "Aritmi / Atriyal Fibrilasyon", diagnosedDate: "2026-01-10", status: "tedavi", severity: "orta", notes: "Holter takıldı. Ritim kontrolsüz.", medications: ["Amiodaron", "Apiksaban"] }]
        },

        // NÖROLOJİ 1 (Mehmet Öz)
        {
            docIdx: 6, name: "Burak Şahin", age: 38, gender: "Erkek", phone: "0539 888 9900",
            email: "burak.sahin@mail.com", bloodType: "A+", registeredDate: "2025-11-01", status: "active",
            diseases: [{ name: "Migren", diagnosedDate: "2025-11-01", status: "tedavi", severity: "orta", notes: "Aura ile birlikte migren atakları.", medications: ["Topiramat 50mg", "Sumatriptan"] }]
        },
        {
            docIdx: 6, name: "Zeynep Koç", age: 55, gender: "Kadın", phone: "0538 777 8899",
            email: "zeynep.koc@mail.com", bloodType: "B-", registeredDate: "2025-02-14", status: "active",
            diseases: [{ name: "Nöropatik Ağrı", diagnosedDate: "2025-02-14", status: "tedavi", severity: "orta", notes: "Bacaklarda karıncalanma, EMG çekildi.", medications: ["Gabapentin 300mg"] }]
        },
        // NÖROLOJİ 2 (Zeynep Aksoy)
        {
            docIdx: 7, name: "Kemal Tunç", age: 71, gender: "Erkek", phone: "0531 666 5544",
            email: "kemal.tunc@mail.com", bloodType: "O+", registeredDate: "2025-08-11", status: "active",
            diseases: [{ name: "Parkinson Hastalığı", diagnosedDate: "2025-08-11", status: "tedavi", severity: "ciddi", notes: "Hafif tremor ve bradikinezi mevcut.", medications: ["Levodopa/Benserazid"] }]
        },
        // ÇOCUK SAĞLIĞI VE HASTALIKLARI 1 (Fatma Şahin)
        {
            docIdx: 10, name: "Ali Can", age: 8, gender: "Erkek", phone: "0555 777 6655",
            email: "alican@mail.com", bloodType: "O+", registeredDate: "2025-09-12", status: "active",
            diseases: [{ name: "Akut Bronşit", diagnosedDate: "2025-09-12", status: "iyileşti", severity: "hafif", notes: "Öksürük şurubu başlandı.", medications: ["Pediatrik Şurup"] }]
        },
        // ÇOCUK SAĞLIĞI VE HASTALIKLARI 2 (Kerem Arslan)
        {
            docIdx: 11, name: "Can Yılmaz", age: 5, gender: "Erkek", phone: "0555 111 2233",
            email: "canyilmaz@mail.com", bloodType: "AB+", registeredDate: "2025-09-20", status: "active",
            diseases: [{ name: "Grip", diagnosedDate: "2025-09-20", status: "iyileşti", severity: "hafif", notes: "Dinlenme ve bol sıvı önerildi.", medications: ["Parasetamol Şurup"] }]
        },
        // ORTOPEDİ VE TRAVMATOLOJİ 1 (Serkan Yılmaz)
        {
            docIdx: 12, name: "Veli Demir", age: 29, gender: "Erkek", phone: "0555 888 7766",
            email: "veli.demir@mail.com", bloodType: "B-", registeredDate: "2025-10-05", status: "active",
            diseases: [{ name: "Menisküs Yırtığı", diagnosedDate: "2025-10-05", status: "tedavi", severity: "orta", notes: "Fizik tedavi önerildi.", medications: ["Ağrı Kesici Jel"] }]
        },
        // ORTOPEDİ VE TRAVMATOLOJİ 2 (Elif Yurt)
        {
            docIdx: 13, name: "Selin Demir", age: 32, gender: "Kadın", phone: "0555 222 3344",
            email: "selindemir@mail.com", bloodType: "O-", registeredDate: "2025-10-15", status: "active",
            diseases: [{ name: "Ayak Bileği Burkulması", diagnosedDate: "2025-10-15", status: "iyileşti", severity: "hafif", notes: "Bandaj ve istirahat.", medications: ["Ağrı Kesici Jel"] }]
        },
        // GÖZ HASTALIKLARI 1 (Selin Aydın)
        {
            docIdx: 14, name: "Merve Çetin", age: 24, gender: "Kadın", phone: "0555 999 8877",
            email: "merve.cetin@mail.com", bloodType: "A+", registeredDate: "2025-11-20", status: "active",
            diseases: [{ name: "Miyopi", diagnosedDate: "2025-11-20", status: "tedavi", severity: "hafif", notes: "Gözlük reçete edildi.", medications: ["Göz Damlası"] }]
        },
        // GÖZ HASTALIKLARI 2 (Hakan Demir)
        {
            docIdx: 15, name: "Ahmet Kaya", age: 47, gender: "Erkek", phone: "0555 333 4455",
            email: "ahmetkaya@mail.com", bloodType: "B+", registeredDate: "2025-11-25", status: "active",
            diseases: [{ name: "Konjonktivit", diagnosedDate: "2025-11-25", status: "iyileşti", severity: "hafif", notes: "Antibiyotikli damla.", medications: ["Göz Damlası"] }]
        },
        // DERMATOLOJİ (CİLDİYE) (Yasemin Yalçın)
        {
            docIdx: 16, name: "Yusuf Bulut", age: 28, gender: "Erkek", phone: "0555 444 5566",
            email: "yusufbulut@mail.com", bloodType: "AB-", registeredDate: "2025-12-01", status: "active",
            diseases: [{ name: "Akne Vulgaris", diagnosedDate: "2025-12-01", status: "tedavi", severity: "hafif", notes: "Topikal krem reçete edildi.", medications: ["Akne Kremi"] }]
        },
        // FTR (Merve Şen)
        {
            docIdx: 18, name: "Aylin Yılmaz", age: 39, gender: "Kadın", phone: "0555 555 6677",
            email: "aylin.yilmaz2@mail.com", bloodType: "A-", registeredDate: "2025-12-05", status: "active",
            diseases: [{ name: "Bel Fıtığı", diagnosedDate: "2025-12-05", status: "tedavi", severity: "orta", notes: "10 seans fizik tedavi önerildi.", medications: ["Kas Gevşetici"] }]
        },
        // GENEL CERRAHİ (Serdar Polat)
        {
            docIdx: 20, name: "Burak Demir", age: 44, gender: "Erkek", phone: "0555 666 7788",
            email: "burakdemir@mail.com", bloodType: "O+", registeredDate: "2025-12-10", status: "active",
            diseases: [{ name: "Kolelitiazis (Safra Taşı)", diagnosedDate: "2025-12-10", status: "tedavi", severity: "ciddi", notes: "Kolesistektomi planlandı.", medications: ["Spazmolitik"] }]
        },
        // KBB (Emre Kurt)
        {
            docIdx: 22, name: "Melis Şahin", age: 31, gender: "Kadın", phone: "0555 777 8899",
            email: "melissahin@mail.com", bloodType: "B+", registeredDate: "2025-12-15", status: "active",
            diseases: [{ name: "Deviasyon ve Sinüzit", diagnosedDate: "2025-12-15", status: "tedavi", severity: "hafif", notes: "Burun spreyi önerildi.", medications: ["Nasal Sprey"] }]
        }
    ];

    const patients = [];
    const salt = await bcrypt.genSalt(10);
    const defaultHashedPassword = await bcrypt.hash("123456", salt);
    let tcCounter = 12345678901;
    for (const p of patientsRaw) {
        const phoneCleaned = p.phone ? p.phone.replace(/\s/g, "") : "";
        const created = await Patient.create({
            ...p,
            phone: phoneCleaned,
            doctorId: docs[p.docIdx]._id,
            password: defaultHashedPassword,
            tc: String(tcCounter++)
        });
        patients.push(created);
        console.log(`   ✅ ${created.name} (${docs[p.docIdx].specialty}) - TC: ${created.tc}`);
    }

    // ─── Randevular ─────────────────────────────────
    console.log("📅 Randevular oluşturuluyor...");

    // Y bugüne göre birkaç randevu oluşturalım (bildirimlerin çalışması için)
    const today = new Date();
    // UTC offset'ten etkilenmemek için local date string oluşturalım:
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const h = today.getHours();

    // Geçmiş saat (artık bildirimde geçmez)
    const pastTime = `${String(Math.max(8, h - 2)).padStart(2, '0')}:00`;
    // Yakın saat (30 dk içi acil - bildirimde kırmızı)
    const nearTime = `${String(h).padStart(2, '0')}:${String(Math.min(59, today.getMinutes() + 15)).padStart(2, '0')}`;
    // Gelecek saat (bugün, ama uzak - bildirimde normal)
    const futureTime = `${String(Math.min(23, h + 2)).padStart(2, '0')}:30`;

    const appointmentsRaw = [
        // Dahiliye
        { patientIdx: 0, date: todayStr, time: pastTime, duration: 30, type: "Kontrol", status: "tamamlandı", notes: "Diyabet kontrolü yapıldı", room: "Oda 101" },
        { patientIdx: 1, date: todayStr, time: nearTime, duration: 30, type: "Takip", status: "bekliyor", notes: "Tiroit sonuçları incelenecek", room: "Oda 101" },
        { patientIdx: 2, date: "2026-02-25", time: "10:00", duration: 30, type: "Kontrol", status: "bekliyor", notes: "Gastrit şikayetleri dinlenecek", room: "Oda 101" },

        // Kardiyoloji
        { patientIdx: 3, date: todayStr, time: nearTime, duration: 45, type: "Acil", status: "bekliyor", notes: "Göğüs ağrısı şikayeti ile yatış onayı", room: "Oda 205" },
        { patientIdx: 4, date: todayStr, time: futureTime, duration: 30, type: "Kontrol", status: "bekliyor", notes: "Tansiyon holter takılacak", room: "Oda 205" },
        { patientIdx: 5, date: "2026-03-02", time: "14:00", duration: 30, type: "Takip", status: "bekliyor", notes: "Ritim kontrolü EKO", room: "Oda 205" },

        // Nöroloji
        { patientIdx: 6, date: todayStr, time: nearTime, duration: 30, type: "Kontrol", status: "bekliyor", notes: "Migren atak sıklığı konuşulacak", room: "Oda 308" },
        { patientIdx: 8, date: todayStr, time: futureTime, duration: 45, type: "Takip", status: "bekliyor", notes: "Parkinson tremor derecelendirmesi", room: "Oda 308" },
        { patientIdx: 7, date: "2026-02-28", time: "09:30", duration: 30, type: "Kontrol", status: "iptal", notes: "Hasta gelemiyor", room: "Oda 308" },
        // Çocuk Sağlığı
        { patientIdx: 9, date: todayStr, time: nearTime, duration: 30, type: "Kontrol", status: "bekliyor", notes: "Ateş takibi yapılacak", room: "Oda 402" },
        { patientIdx: 11, date: todayStr, time: futureTime, duration: 30, type: "Takip", status: "bekliyor", notes: "Gelişim kontrolü", room: "Oda 403" },
        // Ortopedi
        { patientIdx: 10, date: todayStr, time: futureTime, duration: 45, type: "İlk Muayene", status: "bekliyor", notes: "Diz ağrısı şikayeti", room: "Oda 405" },
        { patientIdx: 13, date: "2026-03-06", time: "14:00", duration: 30, type: "Kontrol", status: "bekliyor", notes: "Pansuman değişimi", room: "Oda 406" },
        // Göz Hastalıkları
        { patientIdx: 11, date: "2026-03-05", time: "11:00", duration: 30, type: "Kontrol", status: "bekliyor", notes: "Gözlük numarası değişimi", room: "Oda 408" },
        { patientIdx: 14, date: todayStr, time: nearTime, duration: 30, type: "Kontrol", status: "bekliyor", notes: "Görme keskinliği testi", room: "Oda 409" },
        // Dermatoloji
        { patientIdx: 15, date: todayStr, time: nearTime, duration: 30, type: "Kontrol", status: "bekliyor", notes: "Cilt kontrolü ve krem takibi", room: "Oda 501" },
        // FTR
        { patientIdx: 16, date: todayStr, time: futureTime, duration: 30, type: "Takip", status: "bekliyor", notes: "Egzersiz kontrolü", room: "Oda 504" },
        // Genel Cerrahi
        { patientIdx: 17, date: todayStr, time: nearTime, duration: 45, type: "İlk Muayene", status: "bekliyor", notes: "Ameliyat öncesi değerlendirme", room: "Oda 508" },
        // KBB
        { patientIdx: 18, date: "2026-03-10", time: "10:30", duration: 30, type: "Kontrol", status: "bekliyor", notes: "Burun muayenesi ve kontrol", room: "Oda 512" }
    ];

    for (const a of appointmentsRaw) {
        const patient = patients[a.patientIdx];
        const docId = patient.doctorId; // Hasta hangi doktoraysa, randevu da o doktora yazılır

        const created = await Appointment.create({
            doctorId: docId,
            patientId: patient._id,
            date: new Date(a.date + "T00:00:00"),
            time: a.time,
            duration: a.duration,
            type: a.type,
            status: a.status,
            notes: a.notes,
            room: a.room,
        });
        console.log(`   ✅ ${a.date} ${a.time} — ${patient.name} (${a.type})`);
    }

    // ─── Tahliller ve Görüntülemeler ───────────────
    console.log("🧪 Tahlil ve görüntüleme talepleri oluşturuluyor...");
    
    // Dahiliye (Ahmet Yılmaz) -> Elif Kaya (index 0)
    await LabResult.create({
        doctorId: docs[2]._id,
        patientId: patients[0]._id,
        testType: "Kan",
        testName: "Tam Kan Sayımı (Hemogram)",
        status: "beklemede",
        labName: "Merkez Laboratuvarı",
        notes: "Halsizlik şikayeti nedeniyle rutin hemogram istendi."
    });

    // Kardiyoloji (Ayşe Kaya) -> Mehmet Demir (index 3)
    await LabResult.create({
        doctorId: docs[4]._id,
        patientId: patients[3]._id,
        testType: "Biyokimya",
        testName: "Rutin Biyokimya Profili",
        status: "beklemede",
        labName: "Merkez Laboratuvarı",
        notes: "Açlık Kan Şekeri, Üre, Kreatinin ve Lipid paneli kontrolü."
    });

    // Kardiyoloji (Ayşe Kaya) -> Ali Öztürk (index 4)
    await Radiology.create({
        doctorId: docs[4]._id,
        patientId: patients[4]._id,
        imagingType: "Röntgen",
        bodyPart: "Göğüs (AC Grafisi)",
        status: "beklemede",
        notes: "Öksürük ve nefes darlığı nedeniyle PA Akciğer Grafisi istendi."
    });

    // Nöroloji (Mehmet Öz) -> Burak Şahin (index 6)
    await Radiology.create({
        doctorId: docs[6]._id,
        patientId: patients[6]._id,
        imagingType: "MR",
        bodyPart: "Beyin",
        status: "beklemede",
        notes: "Şiddetli migren ve görme bulanıklığı şikayetlerine yönelik kranial MR."
    });

    // --- Örnek Tamamlanmış Kayıtlar (Geçmiş için) ---
    // Tamamlanmış Lab
    await LabResult.create({
        doctorId: docs[2]._id,
        patientId: patients[1]._id, // Fatma Yıldız
        testType: "Hormon",
        testName: "Tiroid Fonksiyon Testi",
        status: "tamamlandı",
        labName: "Merkez Laboratuvarı",
        results: [
            { parameter: "TSH", value: "2.4", unit: "uIU/mL", referenceRange: "0.27 - 4.2", isAbnormal: false },
            { parameter: "Serbest T3", value: "3.1", unit: "pg/mL", referenceRange: "2.0 - 4.4", isAbnormal: false },
            { parameter: "Serbest T4", value: "1.2", unit: "ng/dL", referenceRange: "0.93 - 1.7", isAbnormal: false }
        ],
        notes: "Değerler normal sınırlardadır."
    });

    // Tamamlanmış Radyoloji
    await Radiology.create({
        doctorId: docs[2]._id,
        patientId: patients[2]._id, // Hasan Arslan
        imagingType: "Ultrason",
        bodyPart: "Tüm Batın",
        status: "tamamlandı",
        findings: "Karaciğer boyutları tabii olup parankim ekosu minimal grade 1 yağlanma lehine artmıştır. Safra kesesi, dalak, pankreas ve her iki böbrek normal sınırlardadır.",
        impression: "Grade 1 hepatosteatoz dışında patolojik bulgu saptanmadı.",
        notes: "Rutin USG kontrolü."
    });

    console.log("   ✅ Tahlil ve görüntüleme talepleri oluşturuldu.");

    // ─── Özet ───────────────────────────────────────
    console.log("\n═══════════════════════════════════════════");
    console.log("🎉 Multi-Doktor Seed tamamlandı!");
    console.log(`   👨‍⚕️ ${docs.length} Doktor`);
    console.log(`   🏥 ${patients.length} Hasta`);
    console.log(`   📅 ${appointmentsRaw.length} Randevu`);
    console.log("═══════════════════════════════════════════");
    console.log("\n🔐 Örnek Giriş Bilgileri (Şifre hepsinde 123456):");
    const userDocs = await User.find({ role: { $in: ["doctor", "admin", "director"] } }).populate("profileId");
    userDocs.forEach(u => console.log(`   - ${u.email} (${u.profileId?.name} - ${u.profileId?.specialty})`));
    console.log("═══════════════════════════════════════════\n");

    process.exit(0);
};

seed().catch(err => {
    console.error("❌ Seed hatası:", err);
    process.exit(1);
});

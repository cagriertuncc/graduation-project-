import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";
import patientAuth from "../middleware/patientAuth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "gp_secure_secret_key";

// ----------------------------------------------------
// PATIENT REGISTRATION
// ----------------------------------------------------
router.post("/register", async (req, res) => {
    try {
        const { tc, name, email, phone, age, gender, bloodType, password, chronicDiseases, allergies, smokingAlcoholStatus, emergencyContact } = req.body;

        if (!tc || !name || !email || !password || !age || !gender || !phone) {
            return res.status(400).json({ error: "Lütfen tüm zorunlu alanları doldurun" });
        }

        // Check if TC or Email exists
        const existingTC = await Patient.findOne({ tc });
        if (existingTC) return res.status(400).json({ error: "Bu T.C. Kimlik numarası ile kayıtlı bir hesap var" });

        const existingEmail = await Patient.findOne({ email });
        if (existingEmail) return res.status(400).json({ error: "Bu e-posta adresi sistemde zaten kayıtlı" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create independent patient record
        const newPatient = await Patient.create({
            tc,
            name,
            email,
            phone,
            age,
            gender,
            bloodType,
            password: hashedPassword,
            chronicDiseases,
            allergies,
            smokingAlcoholStatus,
            emergencyContact,
            role: "patient"
        });

        // Auto login after registration
        const token = jwt.sign({ id: newPatient._id, role: "patient" }, JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            message: "Kayıt başarılı",
            token,
            patient: {
                id: newPatient._id,
                name: newPatient.name,
                email: newPatient.email,
                role: newPatient.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Kayıt işlemi sırasında bir hata oluştu", message: err.message });
    }
});

// ----------------------------------------------------

// CHECK TC EXISTENCE
// ----------------------------------------------------
router.get("/check-tc/:tc", async (req, res) => {
    try {
        const { tc } = req.params;
        const existingPatient = await Patient.findOne({ tc });
        if (existingPatient) {
            return res.json({ exists: true, message: "Bu T.C. Kimlik numarası ile kayıtlı bir hesap var" });
        }
        res.json({ exists: false });
    } catch (err) {
        res.status(500).json({ error: "Sorgulama hatası", message: err.message });
    }
});

// ----------------------------------------------------
// PATIENT LOGIN
// ----------------------------------------------------
router.post("/login", async (req, res) => {
    try {
        const { tcOrEmail, password } = req.body;

        if (!tcOrEmail || !password) {
            return res.status(400).json({ error: "TC Kimlik/E-posta ve şifre gereklidir" });
        }

        // Allow login with either TC or Email
        const patient = await Patient.findOne({
            $or: [{ email: tcOrEmail }, { tc: tcOrEmail }]
        }).select("+password"); // password field is excluded by default

        if (!patient) return res.status(401).json({ error: "Kullanıcı bulunamadı" });

        // Check password
        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) return res.status(401).json({ error: "Hatalı şifre" });

        // Check active status
        if (patient.status === "inactive" || patient.status === "archived" || patient.isDeleted) {
            return res.status(403).json({ error: "Hesabınız askıya alınmıştır veya silinmiştir." });
        }

        // Generate Token
        const token = jwt.sign({ id: patient._id, role: "patient" }, JWT_SECRET, { expiresIn: "7d" });

        res.json({
            message: "Giriş başarılı",
            token,
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                role: patient.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Giriş işlemi başarısız", message: err.message });
    }
});

// ----------------------------------------------------
// GET CURRENT LOGGED IN PATIENT
// ----------------------------------------------------
router.get("/me", patientAuth, async (req, res) => {
    try {
        if (req.user.role !== "patient") {
            return res.status(403).json({ error: "Yetkisiz erişim. Hasta profiline girmelisiniz." });
        }

        const patient = await Patient.findById(req.user.id);
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: "Profil bilgisi alınamadı", message: err.message });
    }
});

// ----------------------------------------------------
// FORGOT PASSWORD REQUEST
// ----------------------------------------------------
router.post("/forgot-password", async (req, res) => {
    try {
        const { tc, email } = req.body;
        if (!tc || !email) return res.status(400).json({ error: "T.C. ve E-posta gereklidir" });

        const patient = await Patient.findOne({ tc, email });
        if (!patient) return res.status(404).json({ error: "Bu bilgilerle eşleşen bir hasta bulunamadı" });

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save code (hashed) and expiry (10 mins)
        const salt = await bcrypt.genSalt(10);
        patient.resetPasswordToken = await bcrypt.hash(resetCode, salt);
        patient.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await patient.save();

        // LOG CODE TO CONSOLE (Simulation of Email)
        console.log(`\n-----------------------------------------`);
        console.log(`[MediTrack] ŞİFRE SIFIRLAMA KODU (HASTA):`);
        console.log(`TC: ${tc}`);
        console.log(`KOD: ${resetCode}`);
        console.log(`-----------------------------------------\n`);

        res.json({ message: "Sıfırlama kodu oluşturuldu. Lütfen sistem yöneticisinden veya terminalden kontrol edin." });
    } catch (err) {
        res.status(500).json({ error: "İşlem sırasında bir hata oluştu", message: err.message });
    }
});

// ----------------------------------------------------
// RESET PASSWORD WITH CODE
// ----------------------------------------------------
router.post("/reset-password", async (req, res) => {
    try {
        const { tc, code, newPassword } = req.body;
        if (!tc || !code || !newPassword) return res.status(400).json({ error: "Tüm alanlar zorunludur" });

        const patient = await Patient.findOne({ tc }).select("+resetPasswordToken +resetPasswordExpires");
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        // Check expiry
        if (Date.now() > patient.resetPasswordExpires) {
            return res.status(400).json({ error: "Sıfırlama kodunun süresi dolmuş" });
        }

        // Check code
        const isMatch = await bcrypt.compare(code, patient.resetPasswordToken);
        if (!isMatch) return res.status(400).json({ error: "Hatalı sıfırlama kodu" });

        // Update password
        const salt = await bcrypt.genSalt(10);
        patient.password = await bcrypt.hash(newPassword, salt);
        patient.resetPasswordToken = undefined;
        patient.resetPasswordExpires = undefined;
        await patient.save();

        res.json({ message: "Şifreniz başarıyla güncellendi" });
    } catch (err) {
        res.status(500).json({ error: "Şifre sıfırlama başarısız", message: err.message });
    }
});

// ----------------------------------------------------
// UPDATE PATIENT PROFILE (Name, Email, Phone, Height, Weight, bloodType)
// ----------------------------------------------------
router.patch("/profile", patientAuth, async (req, res) => {
    try {
        if (req.user.role !== "patient") {
            return res.status(403).json({ error: "Yetkisiz erişim." });
        }

        const { name, email, phone, height, weight, bloodType, chronicDiseases, allergies, smokingAlcoholStatus, emergencyContact } = req.body;
        const patient = await Patient.findById(req.user.id);

        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        // Uniqueness checks if email or phone is changing
        if (email && email !== patient.email) {
            const existingEmail = await Patient.findOne({ email });
            if (existingEmail) return res.status(400).json({ error: "Bu e-posta adresi başka bir hesap tarafından kullanılıyor" });
            patient.email = email;
        }

        if (phone && phone !== patient.phone) {
            const existingPhone = await Patient.findOne({ phone });
            if (existingPhone) return res.status(400).json({ error: "Bu telefon numarası başka bir hesap tarafından kullanılıyor" });
            patient.phone = phone;
        }

        if (name) patient.name = name;
        if (height !== undefined) patient.height = height;
        if (weight !== undefined) patient.weight = weight;
        if (bloodType !== undefined) patient.bloodType = bloodType;
        if (chronicDiseases !== undefined) patient.chronicDiseases = chronicDiseases;
        if (allergies !== undefined) patient.allergies = allergies;
        if (smokingAlcoholStatus !== undefined) patient.smokingAlcoholStatus = smokingAlcoholStatus;
        if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;

        await patient.save();

        res.json({
            message: "Profiliniz başarıyla güncellendi",
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                bloodType: patient.bloodType,
                height: patient.height,
                weight: patient.weight,
                chronicDiseases: patient.chronicDiseases,
                allergies: patient.allergies,
                smokingAlcoholStatus: patient.smokingAlcoholStatus,
                emergencyContact: patient.emergencyContact
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Güncelleme başarısız", message: err.message });
    }
});

// ----------------------------------------------------
// CHANGE PASSWORD
// ----------------------------------------------------
router.post("/change-password", patientAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Mevcut şifre ve yeni şifre gereklidir" });
        }

        const patient = await Patient.findById(req.user.id).select("+password");
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, patient.password);
        if (!isMatch) return res.status(401).json({ error: "Mevcut şifreniz hatalı" });

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        patient.password = await bcrypt.hash(newPassword, salt);
        await patient.save();

        res.json({ message: "Şifreniz başarıyla değiştirildi" });
    } catch (err) {
        res.status(500).json({ error: "Şifre değiştirme başarısız", message: err.message });
    }
});

// ----------------------------------------------------
// ADD FAMILY MEMBER
// ----------------------------------------------------
router.post("/family", patientAuth, async (req, res) => {
    try {
        const { tc, name, age, gender, bloodType, phone, chronicDiseases, allergies, relationship } = req.body;

        if (!tc || !name || !age || !gender) {
            return res.status(400).json({ error: "Lütfen zorunlu alanları (TC, İsim, Yaş, Cinsiyet) doldurun" });
        }

        // Check if TC exists
        const existingTC = await Patient.findOne({ tc });
        if (existingTC) return res.status(400).json({ error: "Bu T.C. Kimlik numarası ile kayıtlı bir hesap zaten var" });

        // Create linked patient (no password, managed by parent)
        const familyMember = await Patient.create({
            tc,
            name,
            age,
            gender,
            bloodType,
            phone,
            chronicDiseases,
            allergies,
            relationship: relationship || "Other",
            parentId: req.user.id,
            role: "patient"
        });

        res.status(201).json({
            message: "Aile üyesi başarıyla eklendi",
            familyMember
        });
    } catch (err) {
        res.status(500).json({ error: "Aile üyesi eklenirken hata oluştu", message: err.message });
    }
});

// ----------------------------------------------------
// UPDATE FAMILY MEMBER
// ----------------------------------------------------
router.put("/family/:id", patientAuth, async (req, res) => {
    try {
        const { name, age, gender, bloodType, phone, chronicDiseases, allergies, relationship } = req.body;

        const member = await Patient.findOneAndUpdate(
            { _id: req.params.id, parentId: req.user.id },
            { name, age, gender, bloodType, phone, chronicDiseases, allergies, relationship },
            { new: true }
        );

        if (!member) return res.status(404).json({ error: "Aile üyesi bulunamadı veya yetkiniz yok" });

        res.json({ message: "Aile üyesi bilgileri güncellendi", familyMember: member });
    } catch (err) {
        res.status(500).json({ error: "Güncelleme başarısız", message: err.message });
    }
});

// ----------------------------------------------------
// GET FAMILY MEMBERS
// ----------------------------------------------------
router.get("/family", patientAuth, async (req, res) => {
    try {
        const members = await Patient.find({ parentId: req.user.id });
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: "Aile üyeleri getirilemedi", message: err.message });
    }
});

// ----------------------------------------------------
// DELETE FAMILY MEMBER
// ----------------------------------------------------
router.delete("/family/:id", patientAuth, async (req, res) => {
    try {
        const member = await Patient.findOne({ _id: req.params.id, parentId: req.user.id });
        if (!member) return res.status(404).json({ error: "Aile üyesi bulunamadı veya yetkiniz yok" });

        await Patient.findByIdAndDelete(req.params.id);
        res.json({ message: "Aile üyesi silindi" });
    } catch (err) {
        res.status(500).json({ error: "Silme işlemi başarısız", message: err.message });
    }
});

// ----------------------------------------------------
// DELETE OWN ACCOUNT (Soft Delete)
// ----------------------------------------------------
router.delete("/delete-account", patientAuth, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: "Hesabı silmek için şifrenizi girmelisiniz." });
        }

        const patient = await Patient.findById(req.user.id).select("+password");
        if (!patient) return res.status(404).json({ error: "Hasta bulunamadı" });

        // Verify password before deletion
        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) return res.status(401).json({ error: "Şifreniz hatalı. Hesap silinmedi." });

        // Soft delete: mark as deleted, anonymize personal data
        patient.isDeleted = true;
        patient.status = "archived";
        patient.name = "Silinmiş Hesap";
        patient.email = `deleted_${patient._id}@deleted.local`;
        patient.tc = null;
        patient.phone = null;
        patient.password = undefined;
        await patient.save();

        res.json({ message: "Hesabınız başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Hesap silme işlemi başarısız", message: err.message });
    }
});

export default router;

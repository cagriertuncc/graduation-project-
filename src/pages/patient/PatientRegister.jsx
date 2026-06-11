import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiPhone, FiCalendar, FiArrowRight, FiArrowLeft, FiCheck, FiActivity } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { usePatientAuth } from "../../context/PatientAuthContext";
import registrationImg from "../../assets/images/registration_bg.png";

const InputField = ({ icon, type, name, placeholder, label, form, setForm, focusedField, setFocusedField, error, onBlur }) => (
    <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</label>
        <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: error ? "#ef4444" : (focusedField === name ? "#e11d48" : "#94a3b8"), transition: "all 0.3s ease", zIndex: 1 }}>
                {icon}
            </div>
            <input
                type={type}
                value={form[name]}
                onChange={(e) => {
                    let val = e.target.value;
                    if (name === "tc") val = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
                    else if (name === "age") {
                        val = val.replace(/\D/g, "");
                        if (val !== "" && parseInt(val, 10) > 120) val = "120";
                    }
                    else if (name === "phone") {
                        // Strict phone formatting: starts with +90, total 13 chars (+ and 12 digits)
                        let raw = val.replace(/[^\d]/g, "");
                        if (raw.startsWith("90")) {
                            val = "+" + raw.slice(0, 12);
                        } else if (raw.length > 0) {
                            val = "+90" + raw.slice(0, 10);
                        } else {
                            val = "";
                        }
                    }
                    else if (name === "name") {
                        val = val.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ ]/g, "");
                        val = val.split(" ").map(w => w ? w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR") : "").join(" ");
                    }
                    else if (name === "email") {
                        val = val.toLowerCase().trim();
                    }
                    setForm({ ...form, [name]: val });
                }}
                onFocus={() => setFocusedField(name)}
                onBlur={() => {
                    setFocusedField(null);
                    if (onBlur) onBlur();
                }}
                placeholder={placeholder}
                style={{
                    width: "100%", padding: "14px 16px 14px 48px", borderRadius: "16px",
                    border: `2px solid ${error ? "#ef4444" : (focusedField === name ? "#fb7185" : "#f1f5f9")}`,
                    background: focusedField === name ? "#fff" : "#f8fafc",
                    boxShadow: focusedField === name ? "0 10px 15px -3px rgba(225, 29, 72, 0.1)" : "none",
                    fontSize: "15px", color: error ? "#ef4444" : "#1e293b", outline: "none", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
            />
        </div>
        {error && <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>{error}</div>}
    </div>
);

const translations = {
    tr: {
        modernSolution: "Sağlığınız İçin Modern Çözüm",
        modernDesc: "Hızlı randevu sistemi, online sonuç takibi ve size özel sağlık danışmanlığı ile tanışın.",
        loginParam: "Giriş Yap",
        createAccount: "Yeni Hesap Oluştur",
        registerDesc: "Hemen kayıt olun ve sağlık hizmetlerinden faydalanın.",
        fullName: "Ad Soyad",
        namePlaceholder: "Örn: Mehmet Öz",
        tcNumber: "T.C. Kimlik / Pasaport No",
        tcPlaceholder: "Kimlik veya Pasaport No",
        ageTitle: "Yaş",
        agePlaceholder: "Yaşınızı Giriniz",
        genderTitle: "Cinsiyet",
        male: "Erkek",
        female: "Kadın",
        bloodTitle: "Kan Grubu",
        emailTitle: "E-Posta",
        emailPlaceholder: "ornek@mail.com",
        phoneTitle: "Telefon",
        phonePlaceholder: "+90 5XX XXX XX XX",
        passTitle: "Şifre",
        passPlaceholder: "••••••••",
        goBack: "Geri Dön",
        continueParam: "Devam Et",
        saving: "Kaydediliyor...",
        registerSubmit: "Kayıt Ol ve Tamamla",
        errEmailReq: "E-posta adresi zorunludur",
        errEmailInvalid: "Geçerli bir e-posta adresi giriniz (örn: isim@mail.com)",
        errPhoneReq: "Telefon numarası zorunludur",
        errPhoneInvalid: "Telefon numarası eksik (10 hane olmalıdır)",
        errTcReq: "Kimlik / Pasaport No zorunludur",
        errTcInvalid: "Geçerli bir Kimlik / Pasaport No giriniz (en az 7 karakter)",
        errPassReq: "Şifre zorunludur",
        errPassInvalid: "Şifre en az 8 karakter olmalıdır",
        errNameInvalid: "Ad soyad en az 3 karakter olmalıdır",
        errCheckInfo: "Lütfen bilgileri kontrol edip tekrar deneyin.",
        errCheckContact: "Lütfen iletişim ve güvenlik bilgilerini kontrol edin.",
        errRegFailed: "Kayıt işlemi başarısız",
        medicalInfo: "Tıbbi Bilgiler",
        emergencyContact: "Acil İletişim",
        chronicDiseases: "Kronik Hastalıklar",
        chronicPlaceholder: "Örn: Şeker, Tansiyon (Yoksa 'Yok' yazın)",
        allergies: "Alerjiler",
        allergiesPlaceholder: "Örn: Polen, Penisilin",
        smokingAlcohol: "Sigara / Alkol Durumu",
        smokingPlaceholder: "Sigara/Alkol kullanımı",
        emergencyName: "Yakınınızın Adı Soyadı",
        emergencyPhone: "Yakınınızın Telefonu"
    },
    en: {
        modernSolution: "A Modern Solution For Your Health",
        modernDesc: "Discover fast appointment booking, online result tracking, and personalized health consulting.",
        loginParam: "Log In",
        createAccount: "Create New Account",
        registerDesc: "Register now and benefit from our health services.",
        fullName: "Full Name",
        namePlaceholder: "e.g. John Doe",
        tcNumber: "National ID / Passport No",
        tcPlaceholder: "ID or Passport No",
        ageTitle: "Age",
        agePlaceholder: "Enter Your Age",
        genderTitle: "Gender",
        male: "Male",
        female: "Female",
        bloodTitle: "Blood Type",
        emailTitle: "Email",
        emailPlaceholder: "example@mail.com",
        phoneTitle: "Phone",
        phonePlaceholder: "+90 5XX XXX XX XX",
        passTitle: "Password",
        passPlaceholder: "••••••••",
        goBack: "Go Back",
        continueParam: "Continue",
        saving: "Saving...",
        registerSubmit: "Register & Complete",
        errEmailReq: "Email is required",
        errEmailInvalid: "Enter a valid email (e.g., name@mail.com)",
        errPhoneReq: "Phone number is required",
        errPhoneInvalid: "Phone number is incomplete (must be 10 digits)",
        errTcReq: "ID or Passport No is required",
        errTcInvalid: "Enter a valid ID or Passport No (min 7 characters)",
        errPassReq: "Password is required",
        errPassInvalid: "Password must be at least 8 characters",
        errNameInvalid: "Full name must be at least 3 characters",
        errCheckInfo: "Please check your information and try again.",
        errCheckContact: "Please check your contact and security information.",
        errRegFailed: "Registration failed",
        medicalInfo: "Medical Information",
        emergencyContact: "Emergency Contact",
        chronicDiseases: "Chronic Diseases",
        chronicPlaceholder: "e.g. Diabetes, Hypertension (write 'None' if none)",
        allergies: "Allergies",
        allergiesPlaceholder: "e.g. Pollen, Penicillin",
        smokingAlcohol: "Smoking / Alcohol Status",
        smokingPlaceholder: "Smoking/Alcohol usage",
        emergencyName: "Contact Name",
        emergencyPhone: "Contact Phone"
    }
};

const StepIndicator = ({ currentStep, totalSteps }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
        {[...Array(totalSteps)].map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i === totalSteps - 1 ? "0 0 auto" : 1 }}>
                <div style={{
                    width: "36px", height: "36px", borderRadius: "12px",
                    background: currentStep > i + 1 ? "#e11d48" : (currentStep === i + 1 ? "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)" : "#f1f5f9"),
                    color: currentStep >= i + 1 ? "white" : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "14px", transition: "all 0.5s ease",
                    boxShadow: currentStep === i + 1 ? "0 8px 20px -4px rgba(225, 29, 72, 0.4)" : "none"
                }}>
                    {currentStep > i + 1 ? <FiCheck strokeWidth={3} /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                    <div style={{
                        height: "3px", flex: 1, margin: "0 12px", borderRadius: "2px",
                        background: currentStep > i + 1 ? "#e11d48" : "#f1f5f9",
                        transition: "all 0.5s ease"
                    }} />
                )}
            </div>
        ))}
    </div>
);

export default function PatientRegister() {
    const navigate = useNavigate();
    const { registerPatient, isPatientAuthenticated, checkTC } = usePatientAuth();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        tc: "", name: "", email: "", phone: "", age: "", gender: "Erkek", bloodType: "A+", password: "",
        chronicDiseases: "", allergies: "", smokingAlcoholStatus: "",
        emergencyContact: { name: "", phone: "" }
    });
    const [focusedField, setFocusedField] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState(localStorage.getItem('patientLang') || 'tr');

    useEffect(() => {
        localStorage.setItem('patientLang', lang);
    }, [lang]);

    const t = (key) => translations[lang][key] || key;

    useEffect(() => {
        if (isPatientAuthenticated) navigate("/hasta/portal", { replace: true });
    }, [isPatientAuthenticated, navigate]);

    useEffect(() => { setMounted(true); }, []);

    const [fieldErrors, setFieldErrors] = useState({});

    const validateField = async (name, value) => {
        let err = null;
        if (name === "email") {
            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!value) err = t('errEmailReq');
            else if (!regex.test(value)) err = t('errEmailInvalid');
        } else if (name === "phone") {
            if (!value) err = t('errPhoneReq');
            else if (value.length < 13) err = t('errPhoneInvalid');
        } else if (name === "tc") {
            if (!value) err = t('errTcReq');
            else if (value.length < 7) err = t('errTcInvalid');
            else {
                // Real-time backend check
                try {
                    const res = await checkTC(value);
                    if (res && res.exists) err = res.message;
                } catch (e) {
                    console.error("TC Check Error:", e);
                }
            }
        } else if (name === "password") {
            if (!value) err = t('errPassReq');
            else if (value.length < 8) err = t('errPassInvalid');
        }
        setFieldErrors(prev => ({ ...prev, [name]: err }));
        return !err;
    };

    const nextStep = async () => {
        if (step === 1) {
            const isNameValid = form.name.length >= 3;
            if (!isNameValid) setFieldErrors(p => ({ ...p, name: t('errNameInvalid') }));

            const isTcValid = await validateField("tc", form.tc);
            const isAgeValid = form.age !== "";

            if (!isNameValid || !isTcValid || !isAgeValid) {
                setError(t('errCheckInfo'));
                return;
            }
        } else if (step === 2) {
            // No complex validation for gender/blood
        } else if (step === 3) {
            const isEmailValid = await validateField("email", form.email);
            const isPhoneValid = await validateField("phone", form.phone);
            const isPasswordValid = await validateField("password", form.password);
            if (!isEmailValid || !isPhoneValid || !isPasswordValid) {
                setError(t('errCheckContact'));
                return;
            }
        }
        setError("");
        setStep(step + 1);
    };

    const prevStep = () => {
        setError("");
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validations
        // Emergency contact check (Optional but recommended)
        if (form.emergencyContact.phone && form.emergencyContact.phone.length < 13) {
            setError(t('errPhoneInvalid'));
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await registerPatient(form);
            navigate("/hasta/portal");
        } catch (err) {
            console.error("Registration full error:", err);
            const errorMessage = err.error || err.message || t('errRegFailed');
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", overflow: "hidden" }}>
            <style>
                {`
                    @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                    .step-content { animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
                    .glass-effect { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); }
                    @media (max-width: 1024px) { .side-image { display: none !important; } .form-container { width: 100% !important; max-width: 600px !important; margin: 0 auto; } }
                `}
            </style>

            {/* Left Side: Medical Illustration */}
            <div className="side-image" style={{
                flex: 1, position: "relative", background: "linear-gradient(135deg, #4c0519 0%, #be123c 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", overflow: "hidden"
            }}>
                <div style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0", opacity: 0.1, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
                <div style={{ zIndex: 1, textAlign: "center", maxWidth: "500px" }}>
                    <div style={{ transform: mounted ? "scale(1)" : "scale(0.8)", opacity: mounted ? 1 : 0, transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                        <img src={registrationImg} alt="Health" style={{ width: "100%", height: "auto", borderRadius: "40px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5)" }} />
                    </div>
                    <div style={{ marginTop: "48px", color: "white", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease 0.4s" }}>
                        <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-1px" }}>{t('modernSolution')}</h1>
                        <p style={{ fontSize: "18px", opacity: 0.9, lineHeight: "1.6" }}>{t('modernDesc')}</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="form-container" style={{ width: "650px", display: "flex", flexDirection: "column", padding: "60px 80px", background: "white", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", background: "#fef2f2", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <RiHospitalLine style={{ fontSize: "24px", color: "#e11d48" }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a", letterSpacing: "-0.5px" }}>MediTrack</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "100px", padding: "4px" }}>
                            <button
                                onClick={() => setLang('tr')}
                                style={{
                                    padding: "6px 12px", borderRadius: "100px", border: "none",
                                    background: lang === 'tr' ? "white" : "transparent",
                                    color: lang === 'tr' ? "#e11d48" : "#64748b",
                                    fontWeight: 700, fontSize: "12px", cursor: "pointer",
                                    boxShadow: lang === 'tr' ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                    transition: "all 0.3s"
                                }}
                            >TR</button>
                            <button
                                onClick={() => setLang('en')}
                                style={{
                                    padding: "6px 12px", borderRadius: "100px", border: "none",
                                    background: lang === 'en' ? "white" : "transparent",
                                    color: lang === 'en' ? "#e11d48" : "#64748b",
                                    fontWeight: 700, fontSize: "12px", cursor: "pointer",
                                    boxShadow: lang === 'en' ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                    transition: "all 0.3s"
                                }}
                            >EN</button>
                        </div>
                        <Link to="/hasta/giris" style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", textDecoration: "none", transition: "color 0.3s" }}>
                            {t('loginParam')} <FiArrowRight style={{ marginLeft: "4px" }} />
                        </Link>
                    </div>
                </div>

                <div style={{ marginBottom: "32px" }}>
                    <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>{t('createAccount')}</h2>
                    <p style={{ color: "#64748b", fontSize: "16px" }}>{t('registerDesc')}</p>
                </div>

                <StepIndicator currentStep={step} totalSteps={4} />

                {error && (<div style={{ padding: "14px 16px", background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "24px", fontWeight: 500, animation: "shake 0.5s" }}>{error}</div>)}

                <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div className="step-content">
                        {step === 1 && (
                            <div key="step1">
                                <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiUser />} type="text" name="name" label={t('fullName')} placeholder={t('namePlaceholder')} error={fieldErrors.name} />
                                <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiUser />} type="text" name="tc" label={t('tcNumber')} placeholder={t('tcPlaceholder')} error={fieldErrors.tc} onBlur={() => validateField("tc", form.tc)} />
                                <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiCalendar />} type="number" name="age" label={t('ageTitle')} placeholder={t('agePlaceholder')} />
                            </div>
                        )}

                        {step === 2 && (
                            <div key="step2">
                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('genderTitle')}</label>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        {["Erkek", "Kadın"].map(g => (
                                            <button key={g} type="button" onClick={() => setForm({ ...form, gender: g })} style={{
                                                flex: 1, padding: "16px", borderRadius: "16px", border: "2px solid",
                                                borderColor: form.gender === g ? "#e11d48" : "#f1f5f9",
                                                background: form.gender === g ? "#fff1f2" : "#f8fafc",
                                                color: form.gender === g ? "#e11d48" : "#64748b",
                                                fontWeight: 700, cursor: "pointer", transition: "all 0.3s"
                                            }}>{g === "Erkek" ? t('male') : t('female')}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('bloodTitle')}</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                                            <button key={bt} type="button" onClick={() => setForm({ ...form, bloodType: bt })} style={{
                                                padding: "12px", borderRadius: "12px", border: "2px solid",
                                                borderColor: form.bloodType === bt ? "#e11d48" : "#f1f5f9",
                                                background: form.bloodType === bt ? "#fff1f2" : "#f8fafc",
                                                color: form.bloodType === bt ? "#e11d48" : "#64748b",
                                                fontWeight: 700, cursor: "pointer", transition: "all 0.3s"
                                            }}>{bt}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div key="step3">
                                <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiMail />} type="email" name="email" label={t('emailTitle')} placeholder={t('emailPlaceholder')} error={fieldErrors.email} onBlur={() => validateField("email", form.email)} />
                                <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiPhone />} type="text" name="phone" label={t('phoneTitle')} placeholder={t('phonePlaceholder')} error={fieldErrors.phone} onBlur={() => validateField("phone", form.phone)} />
                                <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiLock />} type="password" name="password" label={t('passTitle')} placeholder={t('passPlaceholder')} error={fieldErrors.password} onBlur={() => validateField("password", form.password)} />
                            </div>
                        )}

                        {step === 4 && (
                            <div key="step4">
                                <div style={{ marginBottom: "24px" }}>
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#e11d48", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('medicalInfo')}</h4>
                                    <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiActivity />} type="text" name="chronicDiseases" label={t('chronicDiseases')} placeholder={t('chronicPlaceholder')} />
                                    <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiActivity />} type="text" name="allergies" label={t('allergies')} placeholder={t('allergiesPlaceholder')} />
                                    <InputField form={form} setForm={setForm} focusedField={focusedField} setFocusedField={setFocusedField} icon={<FiActivity />} type="text" name="smokingAlcoholStatus" label={t('smokingAlcohol')} placeholder={t('smokingPlaceholder')} />
                                </div>
                                <div style={{ borderTop: "2px dashed #f1f5f9", paddingTop: "24px" }}>
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#e11d48", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('emergencyContact')}</h4>
                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('emergencyName')}</label>
                                        <div style={{ position: "relative" }}>
                                            <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}><FiUser /></div>
                                            <input
                                                type="text"
                                                value={form.emergencyContact.name}
                                                onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })}
                                                placeholder={t('namePlaceholder')}
                                                style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "16px", border: "2px solid #f1f5f9", background: "#f8fafc", fontSize: "15px" }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('emergencyPhone')}</label>
                                        <div style={{ position: "relative" }}>
                                            <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}><FiPhone /></div>
                                            <input
                                                type="text"
                                                value={form.emergencyContact.phone}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    let raw = val.replace(/[^\d]/g, "");
                                                    if (raw.startsWith("90")) val = "+" + raw.slice(0, 12);
                                                    else if (raw.length > 0) val = "+90" + raw.slice(0, 10);
                                                    else val = "";
                                                    setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: val } });
                                                }}
                                                placeholder={t('phonePlaceholder')}
                                                style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "16px", border: "2px solid #f1f5f9", background: "#f8fafc", fontSize: "15px" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", gap: "16px", paddingTop: "40px" }}>
                        {step > 1 && (
                            <button type="button" onClick={prevStep} style={{
                                flex: 1, padding: "18px", borderRadius: "16px", border: "2px solid #f1f5f9",
                                background: "white", color: "#64748b", fontWeight: 700, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                            }}>
                                <FiArrowLeft /> {t('goBack')}
                            </button>
                        )}

                        {step < 4 ? (
                            <button type="button" onClick={nextStep} style={{
                                flex: 2, padding: "18px", borderRadius: "16px", border: "none",
                                background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
                                color: "white", fontWeight: 700, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                boxShadow: "0 10px 25px -4px rgba(225, 29, 72, 0.4)"
                            }}>
                                {t('continueParam')} <FiArrowRight />
                            </button>
                        ) : (
                            <button type="submit" disabled={isSubmitting} style={{
                                flex: 2, padding: "18px", borderRadius: "16px", border: "none",
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "white", fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                boxShadow: "0 10px 25px -4px rgba(16, 185, 129, 0.4)", opacity: isSubmitting ? 0.7 : 1
                            }}>
                                {isSubmitting ? t('saving') : t('registerSubmit')} <FiCheck strokeWidth={3} />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

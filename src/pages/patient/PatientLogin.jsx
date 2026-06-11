import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiUser, FiCheck } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { usePatientAuth } from "../../context/PatientAuthContext";
import loginImg from "../../assets/images/login_illustration.png";

const InputField = ({ icon, type, name, placeholder, label, value, onChange, focusedField, setFocusedField, error }) => (
    <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</label>
        <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: error ? "#ef4444" : (focusedField === name ? "#e11d48" : "#94a3b8"), transition: "all 0.3s ease", zIndex: 1 }}>
                {icon}
            </div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocusedField(name)}
                onBlur={() => setFocusedField(null)}
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
        {error && <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", fontWeight: 500 }}>{error}</div>}
    </div>
);

const translations = {
    tr: {
        welcomeBack: "Tekrar Hoş Geldiniz",
        welcomeDesc: "Sağlık yolculuğunuza kaldığınız yerden devam edin. Randevularınızı ve sonuçlarınızı kolayca yönetin.",
        loginParam: "Giriş Yap",
        loginDesc: "Lütfen bilgilerinizi giriniz.",
        tcOrEmail: "T.C. Kimlik / Pasaport No / E-posta",
        tcExample: "örn: 12345678910",
        passTitle: "Şifre",
        passPlaceholder: "••••••••",
        forgotPass: "Şifremi Unuttum",
        loggingIn: "Giriş Yapılıyor...",
        loginSystem: "Sisteme Giriş Yap",
        noAccount: "Hesabınız yok mu?",
        createAccount: "Yeni Hesap Oluştur",
        fillAllFields: "Lütfen tüm alanları doldurun.",
        loginFailed: "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
        footerInfo: "© 2026 MediTrack Sağlık Sistemleri. Tüm hakları saklıdır.",
        idType: "Giriş Türü",
        tcLabel: "T.C. Kimlik",
        passportLabel: "Pasaport",
        emailLabel: "E-Posta",
        emailPlaceholder: "ornek@mail.com",
        tcPlaceholder: "11 Haneli TC kimlik numaranızı giriniz",
        passportPlaceholder: "Pasaport No Giriniz"
    },
    en: {
        welcomeBack: "Welcome Back",
        welcomeDesc: "Continue your health journey right where you left off. Easily manage your appointments and results.",
        loginParam: "Log In",
        loginDesc: "Please enter your details.",
        tcOrEmail: "T.C. ID / Passport No / Email",
        tcExample: "e.g. 12345678910",
        passTitle: "Password",
        passPlaceholder: "••••••••",
        forgotPass: "Forgot Password",
        loggingIn: "Logging in...",
        loginSystem: "Log into the System",
        noAccount: "Don't have an account?",
        createAccount: "Create New Account",
        fillAllFields: "Please fill in all fields.",
        loginFailed: "Login failed. Please check your information.",
        footerInfo: "© 2026 MediTrack Health Systems. All rights reserved.",
        idType: "Login Type",
        tcLabel: "T.C. ID",
        passportLabel: "Passport",
        emailLabel: "Email",
        emailPlaceholder: "example@mail.com",
        tcPlaceholder: "Enter 11-digit national ID",
        passportPlaceholder: "Enter Passport No"
    }
};

export default function PatientLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginPatient, isPatientAuthenticated } = usePatientAuth();
    const [tcOrEmail, setTcOrEmail] = useState("");
    const [idType, setIdType] = useState("tc");
    const [password, setPassword] = useState("");
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState(localStorage.getItem('patientLang') || 'tr');

    useEffect(() => {
        localStorage.setItem('patientLang', lang);
    }, [lang]);

    const t = (key) => translations[lang][key] || key;

    useEffect(() => {
        if (isPatientAuthenticated) {
            navigate("/hasta/portal", { replace: true });
        }
    }, [isPatientAuthenticated, navigate]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!tcOrEmail || !password) {
            setError(t('fillAllFields'));
            return;
        }
        setIsLoggingIn(true);
        setError("");
        try {
            await loginPatient(tcOrEmail, password);
            navigate("/hasta/portal");
        } catch (err) {
            setError(err.error || err.message || t('loginFailed'));
        } finally {
            setIsLoggingIn(false);
        }
    };

    const registrationSuccessMsg = lang === 'tr' ? 'Kayıt başarılı! Lütfen bilgilerinizle giriş yapın.' : 'Registration successful! Please log in with your credentials.';

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", overflow: "hidden" }}>
            <style>
                {`
                    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .login-content { animation: slideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
                    @media (max-width: 1024px) { .side-image { display: none !important; } .form-container { width: 100% !important; max-width: 600px !important; margin: 0 auto; } }
                `}
            </style>

            {/* Left Side: Illustration */}
            <div className="side-image" style={{
                flex: "0 0 45%", position: "relative", background: "linear-gradient(135deg, #4c0519 0%, #be123c 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", overflow: "hidden"
            }}>
                <div style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0", opacity: 0.1, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
                <div style={{ zIndex: 1, textAlign: "center", maxWidth: "500px" }}>
                    <div style={{ transform: mounted ? "scale(1)" : "scale(0.8)", opacity: mounted ? 1 : 0, transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                        <img src={loginImg} alt="Health" style={{ width: "100%", height: "auto", borderRadius: "40px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5)" }} />
                    </div>
                    <div style={{ marginTop: "48px", color: "white", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease 0.4s" }}>
                        <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-1px" }}>{t('welcomeBack')}</h1>
                        <p style={{ fontSize: "18px", opacity: 0.9, lineHeight: "1.6" }}>{t('welcomeDesc')}</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="form-container" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 80px", background: "white", position: "relative", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: "450px", margin: "0 auto" }} className="login-content">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "60px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "40px", height: "40px", background: "#fef2f2", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <RiHospitalLine style={{ fontSize: "24px", color: "#e11d48" }} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a", letterSpacing: "-0.5px" }}>MediTrack</span>
                        </div>
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
                    </div>

                    <div style={{ marginBottom: "40px" }}>
                        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>{t('loginParam')}</h2>
                        <p style={{ color: "#64748b", fontSize: "16px" }}>{t('loginDesc')}</p>
                    </div>

                    {location.state?.registered && !error && (
                        <div style={{ padding: "14px 16px", background: "#f0fdf4", borderLeft: "4px solid #10b981", borderRadius: "8px", color: "#166534", fontSize: "14px", marginBottom: "24px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiCheck size={20} />
                            {registrationSuccessMsg}
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: "14px 16px", background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "24px", fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Giriş Türü Toggle */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('idType')}</label>
                            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "12px", padding: "4px" }}>
                                {['tc', 'passport'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setIdType(type);
                                            setTcOrEmail("");
                                            setError("");
                                        }}
                                        style={{
                                            flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                                            background: idType === type ? "white" : "transparent",
                                            color: idType === type ? "#e11d48" : "#64748b",
                                            fontWeight: 700, fontSize: "13px", cursor: "pointer",
                                            boxShadow: idType === type ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                                            transition: "all 0.3s"
                                        }}
                                    >
                                        {t(`${type}Label`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <InputField
                            icon={idType === 'email' ? <FiMail /> : <FiUser />}
                            type="text"
                            name="tc"
                            label={t(idType === 'tc' ? 'tcLabel' : (idType === 'passport' ? 'passportLabel' : 'emailLabel'))}
                            placeholder={t(idType === 'tc' ? 'tcPlaceholder' : (idType === 'passport' ? 'passportPlaceholder' : 'emailPlaceholder'))}
                            value={tcOrEmail}
                            onChange={(e) => {
                                let val = e.target.value;
                                if (idType === "tc") {
                                    val = val.replace(/\D/g, "").slice(0, 11);
                                } else if (idType === "passport") {
                                    val = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
                                } else if (idType === "email") {
                                    val = val.toLowerCase().trim();
                                }
                                setTcOrEmail(val);
                            }}
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                        />

                        <InputField
                            icon={<FiLock />}
                            type="password"
                            name="pass"
                            label={t('passTitle')}
                            placeholder={t('passPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                            <Link to="/hasta/sifremi-unuttum" style={{ fontSize: "14px", fontWeight: 600, color: "#e11d48", textDecoration: "none" }}>{t('forgotPass')}</Link>
                        </div>

                        <button type="submit" disabled={isLoggingIn} style={{
                            padding: "18px", borderRadius: "16px", border: "none",
                            background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
                            color: "white", fontWeight: 700, cursor: isLoggingIn ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            boxShadow: "0 10px 25px -4px rgba(225, 29, 72, 0.4)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: isLoggingIn ? 0.7 : 1, transform: isLoggingIn ? "scale(0.98)" : "scale(1)"
                        }}>
                            {isLoggingIn ? t('loggingIn') : t('loginSystem')} <FiArrowRight />
                        </button>
                    </form>

                    <div style={{ marginTop: "40px", textAlign: "center" }}>
                        <p style={{ color: "#64748b", fontSize: "15px" }}>
                            {t('noAccount')}{" "}
                            <Link to="/hasta/kayit" style={{ color: "#e11d48", fontWeight: 700, textDecoration: "none", borderBottom: "2px solid rgba(225, 29, 72, 0.2)" }}>
                                {t('createAccount')}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Brand */}
                <div style={{ position: "absolute", bottom: "40px", left: "80px", right: "80px", textAlign: "center", opacity: 0.5, fontSize: "12px", color: "#64748b" }}>
                    {t('footerInfo')}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiArrowRight, FiArrowLeft, FiUser } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import patientAuthApi from "../../services/patientAuthApi";
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
        backToLogin: "Giriş Sayfasına Dön",
        title: "Şifremi Unuttum",
        description: "Hesabınızı doğrulamak için T.C. Kimlik numaranızı ve e-posta adresinizi girin.",
        tcLabel: "T.C. Kimlik No",
        tcPlaceholder: "11 haneli T.C. No",
        emailLabel: "E-posta Adresi",
        emailPlaceholder: "kayitli@email.com",
        sending: "Kod Gönderiliyor...",
        sendCode: "Sıfırlama Kodu Gönder",
        fillAllFields: "Lütfen tüm alanları doldurun.",
        errorDefault: "İşlem başarısız. Lütfen bilgilerinizi kontrol edin."
    },
    en: {
        backToLogin: "Back to Login",
        title: "Forgot Password",
        description: "Enter your National ID number and email address to verify your account.",
        tcLabel: "National ID",
        tcPlaceholder: "11-digit National ID",
        emailLabel: "Email Address",
        emailPlaceholder: "registered@email.com",
        sending: "Sending Code...",
        sendCode: "Send Reset Code",
        fillAllFields: "Please fill in all fields.",
        errorDefault: "Operation failed. Please check your information."
    }
};

export default function PatientForgotPassword() {
    const navigate = useNavigate();
    const [tc, setTc] = useState("");
    const [email, setEmail] = useState("");
    const [focusedField, setFocusedField] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState(localStorage.getItem('patientLang') || 'tr');

    useEffect(() => { setMounted(true); }, []);

    const t = (key) => translations[lang][key] || key;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tc || !email) {
            setError(t('fillAllFields'));
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await patientAuthApi.forgotPassword(tc, email);
            navigate("/hasta/sifre-sifirla", { state: { tc } });
        } catch (err) {
            setError(err.error || err.message || t('errorDefault'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", overflow: "hidden" }}>
            <style>
                {`
                    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .content-box { animation: slideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
                    @media (max-width: 1024px) { .side-image { display: none !important; } .form-container { width: 100% !important; padding: 40px 20px !important; } }
                `}
            </style>

            <div className="side-image" style={{
                flex: "0 0 45%", position: "relative", background: "linear-gradient(135deg, #4c0519 0%, #be123c 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", overflow: "hidden"
            }}>
                <div style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0", opacity: 0.1, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
                <div style={{ zIndex: 1, textAlign: "center", maxWidth: "500px" }}>
                    <div style={{ transform: mounted ? "scale(1)" : "scale(0.8)", opacity: mounted ? 1 : 0, transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                        <img src={loginImg} alt="Reset Password" style={{ width: "100%", height: "auto", borderRadius: "40px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5)" }} />
                    </div>
                </div>
            </div>

            <div className="form-container" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 80px", background: "white", position: "relative", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: "450px", margin: "0 auto" }} className="content-box">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                        <Link to="/hasta/giris" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 600, transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#e11d48"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>
                            <FiArrowLeft /> {t('backToLogin')}
                        </Link>
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

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
                        <div style={{ width: "40px", height: "40px", background: "#fef2f2", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <RiHospitalLine style={{ fontSize: "24px", color: "#e11d48" }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a", letterSpacing: "-0.5px" }}>MediTrack</span>
                    </div>

                    <div style={{ marginBottom: "40px" }}>
                        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>{t('title')}</h2>
                        <p style={{ color: "#64748b", fontSize: "16px" }}>{t('description')}</p>
                    </div>

                    {error && (
                        <div style={{ padding: "14px 16px", background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "24px", fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <InputField
                            icon={<FiUser />}
                            type="text"
                            name="tc"
                            label={t('tcLabel')}
                            placeholder={t('tcPlaceholder')}
                            value={tc}
                            onChange={(e) => setTc(e.target.value)}
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                        />

                        <InputField
                            icon={<FiMail />}
                            type="email"
                            name="email"
                            label={t('emailLabel')}
                            placeholder={t('emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                        />

                        <button type="submit" disabled={isLoading} style={{
                            marginTop: "10px", padding: "18px", borderRadius: "16px", border: "none",
                            background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
                            color: "white", fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            boxShadow: "0 10px 25px -4px rgba(225, 29, 72, 0.4)", transition: "all 0.3s ease",
                            opacity: isLoading ? 0.7 : 1
                        }}>
                            {isLoading ? t('sending') : t('sendCode')} <FiArrowRight />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

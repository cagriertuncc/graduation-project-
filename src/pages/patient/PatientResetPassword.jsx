import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiLock, FiCheck, FiArrowRight, FiArrowLeft, FiShield } from "react-icons/fi";
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
        backToPrevious: "Önceki Adıma Dön",
        title: "Şifre Sıfırla",
        description: "Lütfen gelen 6 haneli kodu ve yeni şifrenizi girin.",
        codeLabel: "Sıfırlama Kodu",
        codePlaceholder: "6 Haneli Kod",
        newPasswordLabel: "Yeni Şifre",
        newPasswordPlaceholder: "••••••••",
        updating: "Güncelleniyor...",
        updatePassword: "Şifreyi Güncelle",
        successTitle: "Şifre Güncellendi!",
        successDesc: "Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...",
        loginNow: "Hemen Giriş Yap",
        fillAllFields: "Lütfen tüm alanları doldurun.",
        errorDefault: "Sıfırlama başarısız. Kodu kontrol edip tekrar deneyin."
    },
    en: {
        backToPrevious: "Back to Previous Step",
        title: "Reset Password",
        description: "Please enter the 6-digit code and your new password.",
        codeLabel: "Reset Code",
        codePlaceholder: "6-Digit Code",
        newPasswordLabel: "New Password",
        newPasswordPlaceholder: "••••••••",
        updating: "Updating...",
        updatePassword: "Update Password",
        successTitle: "Password Updated!",
        successDesc: "Your password has been successfully changed. You are being redirected to the login page...",
        loginNow: "Log In Now",
        fillAllFields: "Please fill in all fields.",
        errorDefault: "Reset failed. Please check the code and try again."
    }
};

export default function PatientResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [tc, setTc] = useState(location.state?.tc || "");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [focusedField, setFocusedField] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState(localStorage.getItem('patientLang') || 'tr');

    useEffect(() => { setMounted(true); }, []);

    const t = (key) => translations[lang][key] || key;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tc || !code || !newPassword) {
            setError(t('fillAllFields'));
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await patientAuthApi.resetPassword(tc, code, newPassword);
            setSuccess(true);
            setTimeout(() => navigate("/hasta/giris"), 3000);
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
                    {!success ? (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                                <Link to="/hasta/sifremi-unuttum" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 600, transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#e11d48"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>
                                    <FiArrowLeft /> {t('backToPrevious')}
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
                                    icon={<FiShield />}
                                    type="text"
                                    name="code"
                                    label={t('codeLabel')}
                                    placeholder={t('codePlaceholder')}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    focusedField={focusedField}
                                    setFocusedField={setFocusedField}
                                />

                                <InputField
                                    icon={<FiLock />}
                                    type="password"
                                    name="pass"
                                    label={t('newPasswordLabel')}
                                    placeholder={t('newPasswordPlaceholder')}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
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
                                    {isLoading ? t('updating') : t('updatePassword')} <FiCheck />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <div style={{ width: "80px", height: "80px", background: "#f0fdf4", color: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                                <FiCheck size={40} />
                            </div>
                            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>{t('successTitle')}</h2>
                            <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "32px", lineHeight: "1.6" }}>{t('successDesc')}</p>
                            <Link to="/hasta/giris" style={{ color: "#e11d48", fontWeight: 700, textDecoration: "none" }}>{t('loginNow')}</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { useReceptionistAuth } from "../context/ReceptionistAuthContext";
import loginImg from "../assets/images/login_illustration.png";

export default function ReceptionistLogin() {
    const navigate = useNavigate();
    const { login, isReceptionistAuthenticated } = useReceptionistAuth();
    const [email, setEmail] = useState("danisma@hastane.com");
    const [password, setPassword] = useState("123456");
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isReceptionistAuthenticated) {
            navigate("/danisma/panel", { replace: true });
        }
    }, [isReceptionistAuthenticated, navigate]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            await login(email, password);
            navigate("/danisma/panel");
        } catch (err) {
            setError(err.message || "Giriş başarısız");
            setIsLoggingIn(false);
        }
    };

    const PURPLE = "#7c3aed";
    const PURPLE_LIGHT = "#8b5cf6";

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
            <style>
                {`
                    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .login-content { animation: slideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
                    @media (max-width: 1024px) { .side-image { display: none !important; } .form-container { width: 100% !important; max-width: 600px !important; margin: 0 auto; } }
                `}
            </style>

            {/* Left Side: Illustration Panel */}
            <div className="side-image" style={{
                flex: "0 0 45%", position: "relative", background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", overflow: "hidden"
            }}>
                <div style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0", opacity: 0.1, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
                <div style={{ zIndex: 1, textAlign: "center", maxWidth: "500px" }}>
                    <div style={{ transform: mounted ? "scale(1)" : "scale(0.8)", opacity: mounted ? 1 : 0, transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                        <img src={loginImg} alt="Health illustration" style={{ width: "100%", height: "auto", borderRadius: "40px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.3)" }} />
                    </div>
                    <div style={{ marginTop: "48px", color: "white", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease 0.4s" }}>
                        <h1 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-1px" }}>MediTrack Danışma</h1>
                        <p style={{ fontSize: "16px", opacity: 0.9, lineHeight: "1.6" }}>Hasta kabul işlemlerini gerçekleştirin, randevuları hızlıca planlayıp düzenleyin ve doktor hasta kabul sıralarını canlı yönetin.</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="form-container" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 80px", background: "white", position: "relative", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: "450px", margin: "0 auto" }} className="login-content">
                    
                    {/* Brand Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "60px" }}>
                        <div style={{ width: "40px", height: "40px", background: "#f3e8ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <RiHospitalLine style={{ fontSize: "24px", color: PURPLE }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a", letterSpacing: "-0.5px" }}>MediTrack Danışma</span>
                    </div>

                    <div style={{ marginBottom: "40px" }}>
                        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Hasta Kabul / Vezne Girişi</h2>
                        <p style={{ color: "#64748b", fontSize: "15px" }}>Hasta kayıt ve randevu yönetim portalına erişmek için bilgilerinizi girin.</p>
                    </div>

                    {error && (
                        <div style={{ padding: "14px 16px", background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "24px", fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        
                        {/* Email Input */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                                E-POSTA ADRESİ
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: focusedField === "email" ? PURPLE : "#94a3b8", transition: "all 0.2s", zIndex: 1 }}>
                                    <FiMail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    style={{
                                        width: "100%", padding: "14px 16px 14px 48px", borderRadius: "16px",
                                        border: `2px solid ${focusedField === "email" ? PURPLE : "#f1f5f9"}`,
                                        background: focusedField === "email" ? "#fff" : "#f8fafc",
                                        fontSize: "15px", color: "#1e293b", outline: "none", transition: "all 0.2s"
                                    }}
                                    placeholder="danisma@hastane.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                                ŞİFRE
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: focusedField === "password" ? PURPLE : "#94a3b8", transition: "all 0.2s", zIndex: 1 }}>
                                    <FiLock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    style={{
                                        width: "100%", padding: "14px 44px 14px 48px", borderRadius: "16px",
                                        border: `2px solid ${focusedField === "password" ? PURPLE : "#f1f5f9"}`,
                                        background: focusedField === "password" ? "#fff" : "#f8fafc",
                                        fontSize: "15px", color: "#1e293b", outline: "none", transition: "all 0.2s"
                                    }}
                                    placeholder="••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                                        color: "#64748b", background: "none", border: "none", cursor: "pointer",
                                        display: "flex", alignItems: "center", padding: 0
                                    }}
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" disabled={isLoggingIn} style={{
                            padding: "18px", borderRadius: "16px", border: "none",
                            background: `linear-gradient(135deg, ${PURPLE_LIGHT} 0%, ${PURPLE} 100%)`,
                            color: "white", fontWeight: 700, cursor: isLoggingIn ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            boxShadow: "0 10px 25px -4px rgba(124, 58, 237, 0.3)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: isLoggingIn ? 0.7 : 1, transform: isLoggingIn ? "scale(0.98)" : "scale(1)",
                            marginTop: "10px"
                        }}>
                            {isLoggingIn ? "Bağlanıyor..." : "Sisteme Giriş Yap"} <FiArrowRight />
                        </button>
                    </form>

                </div>

                {/* Footer Info */}
                <div style={{ position: "absolute", bottom: "40px", left: "80px", right: "80px", textAlign: "center", opacity: 0.5, fontSize: "12px", color: "#64748b" }}>
                    © 2026 MediTrack Sağlık Sistemleri. Tüm hakları saklıdır.
                </div>
            </div>
        </div>
    );
}

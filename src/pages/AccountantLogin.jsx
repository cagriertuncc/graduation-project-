import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiMail, FiLock, FiArrowRight, FiTrendingUp,
    FiDollarSign, FiPieChart, FiFileText, FiShield,
} from "react-icons/fi";
import { useAccountantAuth } from "../context/AccountantAuthContext";

export default function AccountantLogin() {
    const navigate = useNavigate();
    const { login, isAccountantAuthenticated } = useAccountantAuth();
    const [email, setEmail] = useState("muhasebe@hastane.com");
    const [password, setPassword] = useState("123456");
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isAccountantAuthenticated) navigate("/muhasebe/panel", { replace: true });
    }, [isAccountantAuthenticated, navigate]);

    useEffect(() => {
        setTimeout(() => setMounted(true), 80);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            await login(email, password);
            navigate("/muhasebe/panel");
        } catch (err) {
            setError(err.message || "Giriş başarısız");
            setIsLoggingIn(false);
        }
    };

    const features = [
        { icon: <FiDollarSign size={20} />, title: "Gelir Takibi", desc: "Aylık & yıllık gelir analizi" },
        { icon: <FiTrendingUp size={20} />, title: "Trend Analizi", desc: "12 aylık finansal grafik" },
        { icon: <FiPieChart size={20} />, title: "Kategori Dağılımı", desc: "Hizmet bazlı gelir breakdown" },
        { icon: <FiFileText size={20} />, title: "İşlem Raporları", desc: "Detaylı muhasebe raporu" },
    ];

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "#020c14",
        }}>
            {/* ══════════════ LEFT PANEL ══════════════ */}
            <div style={{
                flex: "0 0 52%",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(145deg, #020c14 0%, #042630 50%, #053340 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "60px 64px",
                borderRight: "1px solid rgba(16,185,129,0.08)",
            }}>
                {/* Grid background */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    pointerEvents: "none",
                }} />

                {/* Glow orbs */}
                <div style={{
                    position: "absolute", top: "15%", left: "20%",
                    width: "300px", height: "300px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: "20%", right: "10%",
                    width: "200px", height: "200px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <div style={{ position: "relative", zIndex: 2 }}>
                    {/* Brand */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        marginBottom: "52px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateX(0)" : "translateX(-30px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s",
                    }}>
                        <div style={{
                            width: "52px", height: "52px",
                            background: "linear-gradient(135deg, #059669, #10b981)",
                            borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
                        }}>
                            <span style={{ fontSize: "26px", fontWeight: 800, color: "white" }}>₺</span>
                        </div>
                        <div>
                            <div style={{ fontSize: "20px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                                MediTrack Finance
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                                Muhasebe Yönetim Portalı
                            </div>
                        </div>
                    </div>

                    {/* Hero */}
                    <h1 style={{
                        fontSize: "44px", fontWeight: 800, lineHeight: 1.15,
                        color: "white", letterSpacing: "-0.03em",
                        marginBottom: "20px", maxWidth: "440px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s",
                    }}>
                        Finansal Verileri
                        <span style={{
                            display: "block",
                            background: "linear-gradient(135deg, #34d399, #10b981, #059669)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>
                            Güvenle Yönetin
                        </span>
                    </h1>

                    <p style={{
                        fontSize: "15px", color: "rgba(255,255,255,0.5)",
                        lineHeight: 1.75, maxWidth: "400px", marginBottom: "48px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(15px)",
                        transition: "all 0.7s ease 0.4s",
                    }}>
                        Gelir takibi, kategori analizleri ve finansal raporları tek ekrandan görüntüleyin.
                    </p>

                    {/* Feature cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {features.map((f, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(16,185,129,0.12)",
                                padding: "20px",
                                borderRadius: "16px",
                                backdropFilter: "blur(10px)",
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(20px)",
                                transition: `all 0.6s ease ${0.5 + i * 0.1}s`,
                            }}>
                                <div style={{ color: "#10b981", marginBottom: "10px" }}>{f.icon}</div>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "4px" }}>{f.title}</div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{f.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Stats strip */}
                    <div style={{
                        display: "flex", gap: "32px", marginTop: "40px",
                        paddingTop: "32px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        opacity: mounted ? 1 : 0,
                        transition: "opacity 0.7s ease 1.0s",
                    }}>
                        {[
                            { label: "Güvenli Erişim", val: "256-bit" },
                            { label: "Gerçek Zamanlı", val: "Anlık" },
                            { label: "Veri Güvenliği", val: "ISO 27001" },
                        ].map((s, i) => (
                            <div key={i}>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#10b981" }}>{s.val}</div>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════ RIGHT PANEL — Form ══════════════ */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                background: "#0a1628",
                position: "relative",
            }}>
                {/* Background accent */}
                <div style={{
                    position: "absolute",
                    top: "30%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "400px", height: "400px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <div style={{
                    width: "100%", maxWidth: "420px",
                    position: "relative", zIndex: 2,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(24px)",
                    transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s",
                }}>
                    {/* Card */}
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "24px",
                        padding: "48px 44px",
                        backdropFilter: "blur(24px)",
                        boxShadow: "0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}>
                        {/* Shield icon */}
                        <div style={{
                            width: "56px", height: "56px",
                            background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))",
                            border: "1px solid rgba(16,185,129,0.2)",
                            borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: "24px",
                            color: "#10b981",
                        }}>
                            <FiShield size={26} />
                        </div>

                        <h2 style={{
                            fontSize: "24px", fontWeight: 700, color: "white",
                            letterSpacing: "-0.02em", marginBottom: "8px",
                        }}>
                            Muhasebe Girişi
                        </h2>
                        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "36px" }}>
                            Yalnızca muhasebe personeli erişebilir
                        </p>

                        <form onSubmit={handleLogin}>
                            {/* Email */}
                            <div style={{ marginBottom: "18px" }}>
                                <label style={{
                                    display: "block", fontSize: "12px", fontWeight: 600,
                                    color: focusedField === "email" ? "#10b981" : "rgba(255,255,255,0.4)",
                                    marginBottom: "8px", transition: "color 0.2s",
                                    letterSpacing: "0.06em", textTransform: "uppercase",
                                }}>
                                    E-posta
                                </label>
                                <div style={{ position: "relative" }}>
                                    <FiMail style={{
                                        position: "absolute", left: "16px", top: "50%",
                                        transform: "translateY(-50%)",
                                        color: focusedField === "email" ? "#10b981" : "rgba(255,255,255,0.25)",
                                        fontSize: "16px", transition: "color 0.2s",
                                    }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="ornek@hastane.com"
                                        style={{
                                            width: "100%",
                                            padding: "14px 16px 14px 46px",
                                            background: focusedField === "email"
                                                ? "rgba(16,185,129,0.05)"
                                                : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${focusedField === "email"
                                                ? "rgba(16,185,129,0.4)"
                                                : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: "12px",
                                            fontSize: "14px", fontWeight: 500,
                                            color: "white", outline: "none",
                                            fontFamily: "'Inter', sans-serif",
                                            boxShadow: focusedField === "email"
                                                ? "0 0 0 3px rgba(16,185,129,0.08)"
                                                : "none",
                                            transition: "all 0.25s ease",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: "28px" }}>
                                <label style={{
                                    display: "block", fontSize: "12px", fontWeight: 600,
                                    color: focusedField === "password" ? "#10b981" : "rgba(255,255,255,0.4)",
                                    marginBottom: "8px", transition: "color 0.2s",
                                    letterSpacing: "0.06em", textTransform: "uppercase",
                                }}>
                                    Şifre
                                </label>
                                <div style={{ position: "relative" }}>
                                    <FiLock style={{
                                        position: "absolute", left: "16px", top: "50%",
                                        transform: "translateY(-50%)",
                                        color: focusedField === "password" ? "#10b981" : "rgba(255,255,255,0.25)",
                                        fontSize: "16px", transition: "color 0.2s",
                                    }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="••••••••"
                                        style={{
                                            width: "100%",
                                            padding: "14px 44px 14px 46px",
                                            background: focusedField === "password"
                                                ? "rgba(16,185,129,0.05)"
                                                : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${focusedField === "password"
                                                ? "rgba(16,185,129,0.4)"
                                                : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: "12px",
                                            fontSize: "14px", fontWeight: 500,
                                            color: "white", outline: "none",
                                            fontFamily: "'Inter', sans-serif",
                                            boxShadow: focusedField === "password"
                                                ? "0 0 0 3px rgba(16,185,129,0.08)"
                                                : "none",
                                            transition: "all 0.25s ease",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        style={{
                                            position: "absolute", right: "14px", top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none", border: "none",
                                            color: "rgba(255,255,255,0.3)", cursor: "pointer",
                                            fontSize: "11px", fontWeight: 600,
                                            fontFamily: "'Inter', sans-serif",
                                            padding: "4px",
                                        }}
                                    >
                                        {showPassword ? "GİZLE" : "GÖSTER"}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    padding: "12px 16px", marginBottom: "20px",
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    borderRadius: "10px",
                                    fontSize: "13px", color: "#fca5a5", fontWeight: 500,
                                    display: "flex", alignItems: "center", gap: "8px",
                                }}>
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                style={{
                                    width: "100%", padding: "15px",
                                    background: isLoggingIn
                                        ? "rgba(16,185,129,0.5)"
                                        : "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                                    border: "none", borderRadius: "12px",
                                    color: "white", fontSize: "15px", fontWeight: 700,
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: isLoggingIn ? "wait" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    boxShadow: isLoggingIn ? "none" : "0 8px 24px rgba(16,185,129,0.3)",
                                    transform: isLoggingIn ? "scale(0.99)" : "scale(1)",
                                    transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                                    letterSpacing: "0.01em",
                                }}
                                onMouseEnter={e => {
                                    if (!isLoggingIn) {
                                        e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(16,185,129,0.4)";
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isLoggingIn) {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.3)";
                                    }
                                }}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <span style={{
                                            width: "18px", height: "18px",
                                            border: "2px solid rgba(255,255,255,0.3)",
                                            borderTopColor: "white",
                                            borderRadius: "50%",
                                            animation: "spin 0.6s linear infinite",
                                            display: "inline-block",
                                        }} />
                                        Doğrulanıyor...
                                    </>
                                ) : (
                                    <>
                                        Güvenli Giriş Yap
                                        <FiArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo fill */}
                        <div style={{
                            marginTop: "24px", paddingTop: "24px",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                        }}>
                            <button
                                onClick={() => {
                                    setEmail("muhasebe@hastane.com");
                                    setPassword("123456");
                                }}
                                style={{
                                    width: "100%", padding: "11px",
                                    background: "rgba(16,185,129,0.05)",
                                    border: "1px solid rgba(16,185,129,0.12)",
                                    borderRadius: "10px",
                                    color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.2s",
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: "0.04em",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.05)"}
                            >
                                Demo Hesabını Doldur
                            </button>
                        </div>
                    </div>

                    {/* Footer note */}
                    <div style={{
                        textAlign: "center", marginTop: "20px",
                        fontSize: "12px", color: "rgba(255,255,255,0.2)",
                    }}>
                        <FiShield size={12} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Yetkisiz erişim girişimleri kayıt altına alınır
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.18); }
            `}</style>
        </div>
    );
}

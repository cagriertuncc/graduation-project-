import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiMail, FiLock, FiArrowRight, FiUsers,
    FiUserPlus, FiClipboard, FiAward, FiShield,
} from "react-icons/fi";
import { useIKAuth } from "../context/IKAuthContext";

export default function IKLogin() {
    const navigate = useNavigate();
    const { login, isIKAuthenticated } = useIKAuth();
    const [email, setEmail] = useState("ik@hastane.com");
    const [password, setPassword] = useState("123456");
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isIKAuthenticated) navigate("/ik/panel", { replace: true });
    }, [isIKAuthenticated, navigate]);

    useEffect(() => {
        setTimeout(() => setMounted(true), 80);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            await login(email, password);
            navigate("/ik/panel");
        } catch (err) {
            setError(err.message || "Giriş başarısız");
            setIsLoggingIn(false);
        }
    };

    const features = [
        { icon: <FiUserPlus size={20} />, title: "Personel Alımı", desc: "Doktor & personel işe alım süreci" },
        { icon: <FiClipboard size={20} />, title: "Başvuru Takibi", desc: "Adayları anlık takip edin" },
        { icon: <FiUsers size={20} />, title: "Çalışan Yönetimi", desc: "Tüm personel bilgileri merkezi" },
        { icon: <FiAward size={20} />, title: "Performans", desc: "Değerlendirme & gelişim takibi" },
    ];

    const BLUE = "#6366f1";
    const BLUE_MED = "#818cf8";
    const BLUE_LIGHT = "#a5b4fc";

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "#07080f",
        }}>
            {/* ══════════════ LEFT PANEL ══════════════ */}
            <div style={{
                flex: "0 0 52%",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(145deg, #070814 0%, #0d0f2a 50%, #111340 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "60px 64px",
                borderRight: "1px solid rgba(99,102,241,0.08)",
            }}>
                {/* Grid background */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    pointerEvents: "none",
                }} />

                {/* Glow orbs */}
                <div style={{
                    position: "absolute", top: "15%", left: "20%",
                    width: "320px", height: "320px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: "20%", right: "10%",
                    width: "200px", height: "200px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
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
                            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                            borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
                        }}>
                            <FiUsers size={26} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: "20px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                                MediTrack HR
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                                İnsan Kaynakları Yönetim Portalı
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
                        İnsan Kaynakları
                        <span style={{
                            display: "block",
                            background: "linear-gradient(135deg, #a5b4fc, #818cf8, #6366f1)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>
                            Akıllıca Yönetin
                        </span>
                    </h1>

                    <p style={{
                        fontSize: "15px", color: "rgba(255,255,255,0.5)",
                        lineHeight: 1.75, maxWidth: "400px", marginBottom: "48px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(15px)",
                        transition: "all 0.7s ease 0.4s",
                    }}>
                        Personel alımından performans değerlendirmesine, izin yönetiminden eğitim takibine kadar tüm İK süreçleri tek platformda.
                    </p>

                    {/* Feature cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {features.map((f, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(99,102,241,0.12)",
                                padding: "20px",
                                borderRadius: "16px",
                                backdropFilter: "blur(10px)",
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(20px)",
                                transition: `all 0.6s ease ${0.5 + i * 0.1}s`,
                            }}>
                                <div style={{ color: BLUE_MED, marginBottom: "10px" }}>{f.icon}</div>
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
                            { label: "Aktif Personel", val: "247" },
                            { label: "Açık Pozisyon", val: "12" },
                            { label: "Bu Ay Alınan", val: "8" },
                        ].map((s, i) => (
                            <div key={i}>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: BLUE_MED }}>{s.val}</div>
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
                background: "#0c0d1e",
                position: "relative",
            }}>
                {/* Background accent */}
                <div style={{
                    position: "absolute",
                    top: "30%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "400px", height: "400px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
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
                        {/* Icon */}
                        <div style={{
                            width: "56px", height: "56px",
                            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                            border: "1px solid rgba(99,102,241,0.2)",
                            borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: "24px",
                            color: BLUE_MED,
                        }}>
                            <FiShield size={26} />
                        </div>

                        <h2 style={{
                            fontSize: "24px", fontWeight: 700, color: "white",
                            letterSpacing: "-0.02em", marginBottom: "8px",
                        }}>
                            İK Girişi
                        </h2>
                        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "36px" }}>
                            Yalnızca İnsan Kaynakları personeli erişebilir
                        </p>

                        <form onSubmit={handleLogin}>
                            {/* Email */}
                            <div style={{ marginBottom: "18px" }}>
                                <label style={{
                                    display: "block", fontSize: "12px", fontWeight: 600,
                                    color: focusedField === "email" ? BLUE_LIGHT : "rgba(255,255,255,0.4)",
                                    marginBottom: "8px", transition: "color 0.2s",
                                    letterSpacing: "0.06em", textTransform: "uppercase",
                                }}>
                                    E-posta
                                </label>
                                <div style={{ position: "relative" }}>
                                    <FiMail style={{
                                        position: "absolute", left: "16px", top: "50%",
                                        transform: "translateY(-50%)",
                                        color: focusedField === "email" ? BLUE_MED : "rgba(255,255,255,0.25)",
                                        fontSize: "16px", transition: "color 0.2s",
                                    }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="ik@hastane.com"
                                        style={{
                                            width: "100%",
                                            padding: "14px 16px 14px 46px",
                                            background: focusedField === "email"
                                                ? "rgba(99,102,241,0.05)"
                                                : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${focusedField === "email"
                                                ? "rgba(99,102,241,0.4)"
                                                : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: "12px",
                                            fontSize: "14px", fontWeight: 500,
                                            color: "white", outline: "none",
                                            fontFamily: "'Inter', sans-serif",
                                            boxShadow: focusedField === "email"
                                                ? "0 0 0 3px rgba(99,102,241,0.08)"
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
                                    color: focusedField === "password" ? BLUE_LIGHT : "rgba(255,255,255,0.4)",
                                    marginBottom: "8px", transition: "color 0.2s",
                                    letterSpacing: "0.06em", textTransform: "uppercase",
                                }}>
                                    Şifre
                                </label>
                                <div style={{ position: "relative" }}>
                                    <FiLock style={{
                                        position: "absolute", left: "16px", top: "50%",
                                        transform: "translateY(-50%)",
                                        color: focusedField === "password" ? BLUE_MED : "rgba(255,255,255,0.25)",
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
                                                ? "rgba(99,102,241,0.05)"
                                                : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${focusedField === "password"
                                                ? "rgba(99,102,241,0.4)"
                                                : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: "12px",
                                            fontSize: "14px", fontWeight: 500,
                                            color: "white", outline: "none",
                                            fontFamily: "'Inter', sans-serif",
                                            boxShadow: focusedField === "password"
                                                ? "0 0 0 3px rgba(99,102,241,0.08)"
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
                                        ? "rgba(99,102,241,0.5)"
                                        : "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)",
                                    border: "none", borderRadius: "12px",
                                    color: "white", fontSize: "15px", fontWeight: 700,
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: isLoggingIn ? "wait" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    boxShadow: isLoggingIn ? "none" : "0 8px 24px rgba(99,102,241,0.35)",
                                    transform: isLoggingIn ? "scale(0.99)" : "scale(1)",
                                    transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                                    letterSpacing: "0.01em",
                                }}
                                onMouseEnter={e => {
                                    if (!isLoggingIn) {
                                        e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.45)";
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isLoggingIn) {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.35)";
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
                                    setEmail("ik@hastane.com");
                                    setPassword("123456");
                                }}
                                style={{
                                    width: "100%", padding: "11px",
                                    background: "rgba(99,102,241,0.05)",
                                    border: "1px solid rgba(99,102,241,0.12)",
                                    borderRadius: "10px",
                                    color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.2s",
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: "0.04em",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,0.05)"}
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

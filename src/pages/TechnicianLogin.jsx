import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiMail, FiLock, FiArrowRight, FiShield,
    FiActivity, FiCpu, FiCheckCircle, FiCpu as FiAtom, FiEye, FiEyeOff
} from "react-icons/fi";
import { useTechnicianAuth } from "../context/TechnicianAuthContext";

export default function TechnicianLogin() {
    const navigate = useNavigate();
    const { login, isTechnicianAuthenticated } = useTechnicianAuth();
    const [email, setEmail] = useState("tek@hastane.com");
    const [password, setPassword] = useState("123456");
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isTechnicianAuthenticated) {
            navigate("/teknisyen/panel", { replace: true });
        }
    }, [isTechnicianAuthenticated, navigate]);

    useEffect(() => {
        setTimeout(() => setMounted(true), 80);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            await login(email, password);
            navigate("/teknisyen/panel");
        } catch (err) {
            setError(err.message || "Giriş başarısız");
            setIsLoggingIn(false);
        }
    };

    const features = [
        { icon: <FiActivity size={20} />, title: "Dinamik Lab Analizleri", desc: "Tahlil parametrelerini girip referans aralıklarını anlık kontrol edin" },
        { icon: <FiAtom size={20} />, title: "Radyoloji Raporlama", desc: "Görüntüleme bulgularını ve radyolojik izlenimleri raporlayın" },
        { icon: <FiCheckCircle size={20} />, title: "Otomatik Senkronizasyon", desc: "Tamamlanan testleri anında doktor ve hasta ekranlarına iletin" },
        { icon: <FiCpu size={20} />, title: "Akıllı Bildirim Sistemi", desc: "Bulgular anormal olduğunda anında sistem geneli uyarı tetikleyin" },
    ];

    const TEAL = "#0ea5e9";
    const TEAL_MED = "#38bdf8";
    const TEAL_LIGHT = "#7dd3fc";

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "#030712",
        }}>
            {/* ══════════════ LEFT PANEL ══════════════ */}
            <div style={{
                flex: "0 0 52%",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(145deg, #030712 0%, #07192a 50%, #0c2b45 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "60px 64px",
                borderRight: "1px solid rgba(14,165,233,0.08)",
            }}>
                {/* Grid background */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    pointerEvents: "none",
                }} />

                {/* Glow orbs */}
                <div style={{
                    position: "absolute", top: "15%", left: "20%",
                    width: "320px", height: "320px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: "20%", right: "10%",
                    width: "200px", height: "200px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)",
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
                            background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                            borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 32px rgba(14,165,233,0.3)",
                        }}>
                            <FiActivity size={26} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: "20px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                                MediTrack Lab
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                                Laboratuvar & Radyoloji Portalı
                            </div>
                        </div>
                    </div>

                    {/* Hero */}
                    <h1 style={{
                        fontSize: "44px", fontWeight: 800, lineHeight: 1.15,
                        color: "white", letterSpacing: "-0.03em",
                        marginBottom: "20px", maxWidth: "460px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s",
                    }}>
                        Laboratuvar & Radyoloji
                        <span style={{
                            display: "block",
                            background: "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>
                            İş Listesini Yönetin
                        </span>
                    </h1>

                    <p style={{
                        fontSize: "15px", color: "rgba(255,255,255,0.5)",
                        lineHeight: 1.75, maxWidth: "420px", marginBottom: "48px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(15px)",
                        transition: "all 0.7s ease 0.4s",
                    }}>
                        Doktorların talep ettiği biyokimya ve görüntüleme isteklerini anlık görün, dinamik parametrelerle sonuçları sisteme işleyin ve onaylayın.
                    </p>

                    {/* Feature cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {features.map((f, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(14,165,233,0.12)",
                                padding: "20px",
                                borderRadius: "16px",
                                backdropFilter: "blur(10px)",
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(20px)",
                                transition: `all 0.6s ease ${0.5 + i * 0.1}s`,
                            }}>
                                <div style={{ color: TEAL_MED, marginBottom: "10px" }}>{f.icon}</div>
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
                            { label: "Günlük Bekleyen Test", val: "18 İstek" },
                            { label: "Ortalama Sonuç Süresi", val: "45 Dakika" },
                            { label: "Aktif Cihaz Entegrasyonu", val: "8 Sistem" },
                        ].map((s, i) => (
                            <div key={i}>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: TEAL_MED }}>{s.val}</div>
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
                background: "#080b18",
                position: "relative",
            }}>
                {/* Background accent */}
                <div style={{
                    position: "absolute",
                    top: "30%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "400px", height: "400px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
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
                            background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(56,189,248,0.1))",
                            border: "1px solid rgba(14,165,233,0.2)",
                            borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: "24px",
                            color: TEAL_MED,
                        }}>
                            <FiShield size={26} />
                        </div>

                        <h2 style={{
                            fontSize: "24px", fontWeight: 700, color: "white",
                            letterSpacing: "-0.02em", marginBottom: "8px",
                        }}>
                            Teknisyen Girişi
                        </h2>
                        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "32px" }}>
                            MediTrack Laboratuvar ve Radyoloji paneline güvenle erişin.
                        </p>

                        {error && (
                            <div style={{
                                background: "rgba(239,68,68,0.08)",
                                border: "1px solid rgba(239,68,68,0.15)",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                color: "#f87171",
                                fontSize: "13px",
                                marginBottom: "24px",
                                lineHeight: "1.4",
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Email */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.03em" }}>
                                    E-POSTA ADRESİ
                                </label>
                                <div style={{
                                    position: "relative",
                                    transition: "all 0.2s",
                                }}>
                                    <span style={{
                                        position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                                        color: focusedField === "email" ? TEAL_MED : "rgba(255,255,255,0.3)",
                                        transition: "color 0.2s",
                                        display: "flex", alignItems: "center",
                                    }}>
                                        <FiMail size={18} />
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        style={{
                                            width: "100%",
                                            background: "rgba(255,255,255,0.03)",
                                            border: focusedField === "email" ? `1px solid ${TEAL}` : "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "14px",
                                            padding: "14px 16px 14px 48px",
                                            color: "white",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxShadow: focusedField === "email" ? "0 0 16px rgba(14,165,233,0.15)" : "none",
                                            transition: "all 0.2s",
                                        }}
                                        placeholder="ornek@hastane.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.03em" }}>
                                        ŞİFRE
                                    </label>
                                </div>
                                <div style={{
                                    position: "relative",
                                    transition: "all 0.2s",
                                }}>
                                    <span style={{
                                        position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                                        color: focusedField === "password" ? TEAL_MED : "rgba(255,255,255,0.3)",
                                        transition: "color 0.2s",
                                        display: "flex", alignItems: "center",
                                    }}>
                                        <FiLock size={18} />
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        style={{
                                            width: "100%",
                                            background: "rgba(255,255,255,0.03)",
                                            border: focusedField === "password" ? `1px solid ${TEAL}` : "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "14px",
                                            padding: "14px 44px 14px 48px",
                                            color: "white",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxShadow: focusedField === "password" ? "0 0 16px rgba(14,165,233,0.15)" : "none",
                                            transition: "all 0.2s",
                                        }}
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                                            color: "rgba(255,255,255,0.4)",
                                            background: "none", border: "none", cursor: "pointer",
                                            display: "flex", alignItems: "center",
                                            padding: 0,
                                        }}
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                style={{
                                    width: "100%",
                                    background: isLoggingIn ? "rgba(14,165,233,0.5)" : `linear-gradient(135deg, ${TEAL}, ${TEAL_MED})`,
                                    border: "none",
                                    borderRadius: "14px",
                                    padding: "16px",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    cursor: isLoggingIn ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                    boxShadow: isLoggingIn ? "none" : "0 8px 24px rgba(14,165,233,0.25)",
                                    transition: "all 0.2s",
                                    marginTop: "12px",
                                }}
                            >
                                {isLoggingIn ? "Bağlanıyor..." : "Giriş Yap"}
                                {!isLoggingIn && <FiArrowRight size={18} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

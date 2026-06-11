import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiShield, FiSliders, FiDollarSign, FiActivity } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

export default function IdareLogin() {
    const navigate = useNavigate();
    const { login, logout, isAuthenticated, user } = useAuth();
    const [email, setEmail] = useState("idare@hastane.com");
    const [password, setPassword] = useState("123456");
    const [mounted, setMounted] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isAuthenticated && (user?.role === "director" || user?.role === "staff" || user?.role === "admin")) {
            navigate("/idare/panel", { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            const loggedInUser = await login(email, password);
            if (loggedInUser?.role !== "director" && loggedInUser?.role !== "staff" && loggedInUser?.role !== "admin") {
                setError("Erişim reddedildi. Bu portal sadece Başhekim, Müdür, Müdür Yardımcıları & İdari Personel yetkililerine aittir.");
                logout();
                setIsLoggingIn(false);
                return;
            }
            navigate("/idare/panel");
        } catch (err) {
            setError(err.message || "Giriş başarısız");
            setIsLoggingIn(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex",
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "#090202", // Dark base with crimson accent
        }}>
            {/* ══════════════ LEFT PANEL — Chief/Executive Visual ══════════════ */}
            <div style={{
                flex: "0 0 50%", position: "relative", overflow: "hidden",
                background: "linear-gradient(135deg, #050000 0%, #1a0505 40%, #2d0b0b 100%)",
                display: "flex", flexDirection: "column", justifyContent: "center",
                padding: "60px", borderRight: "1px solid rgba(239, 68, 68, 0.08)",
            }}>
                {/* mesh gradient */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 60%)",
                    pointerEvents: "none",
                }} />

                {/* Content */}
                <div style={{ position: "relative", zIndex: 2 }}>
                    {/* Brand */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        marginBottom: "48px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateX(0)" : "translateX(-30px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s",
                    }}>
                        <div style={{
                            width: "52px", height: "52px",
                            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                            borderRadius: "14px", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 32px rgba(239, 68, 68, 0.3)",
                        }}>
                            <RiHospitalLine style={{ fontSize: "28px", color: "white" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: "22px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                                MediTrack Executive
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
                                İdari Yönetim & Başhekim Portalı
                            </div>
                        </div>
                    </div>

                    {/* Hero text */}
                    <h1 style={{
                        fontSize: "44px", fontWeight: 800, lineHeight: 1.15,
                        color: "white", letterSpacing: "-0.03em",
                        marginBottom: "24px", maxWidth: "480px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s",
                    }}>
                        Hastane Kaynak ve
                        <span style={{
                            display: "block",
                            background: "linear-gradient(135deg, #f87171, #ef4444, #dc2626)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            Performans Kontrolü
                        </span>
                    </h1>

                    <p style={{
                        fontSize: "16px", color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.7, maxWidth: "420px", marginBottom: "48px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(15px)",
                        transition: "all 0.7s ease 0.6s",
                    }}>
                        Tıbbi kadro performans puanları, idari izin onay süreçleri ve anlık hastane finansal göstergeleri tek bir kumanda merkezinde.
                    </p>

                    {/* Feature Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {[
                            { icon: <FiSliders size={22} />, title: "Kadro Ayarları", desc: "Hekim limit & maaş kontrolü", delay: "0.8s" },
                            { icon: <FiDollarSign size={22} />, title: "Finansal Ciro", desc: "Canlı hastane bütçe akışı", delay: "0.9s" },
                            { icon: <FiActivity size={22} />, title: "İzin Yönetimi", desc: "Canlı personel onay masası", delay: "1.0s" },
                            { icon: <FiShield size={22} />, title: "Yetki Kumandası", desc: "Lockdown & Bakım anahtarları", delay: "1.1s" },
                        ].map((feature, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(239, 68, 68, 0.08)",
                                padding: "20px", borderRadius: "16px",
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(20px)",
                                transition: `all 0.7s ease ${feature.delay}`,
                                backdropFilter: "blur(10px)",
                            }}>
                                <div style={{ color: "#f87171", marginBottom: "12px" }}>{feature.icon}</div>
                                <div style={{ fontSize: "15px", fontWeight: 600, color: "white", marginBottom: "4px" }}>{feature.title}</div>
                                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{feature.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════ RIGHT PANEL — Login Form ══════════════ */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "40px", position: "relative",
            }}>
                <div style={{
                    width: "100%", maxWidth: "420px",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(24px)",
                    transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s",
                    background: "rgba(15, 23, 42, 0.4)",
                    padding: "48px 40px",
                    borderRadius: "24px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(20px)",
                }}>
                    <div style={{ marginBottom: "36px", textAlign: "center" }}>
                        <h2 style={{
                            fontSize: "26px", fontWeight: 700, color: "white",
                            letterSpacing: "-0.025em", marginBottom: "8px",
                        }}>
                            İdari Yönetim & Başhekim Girişi
                        </h2>
                        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
                            Güvenli idari yönetim portalına giriş yapın
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {/* Email */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{
                                display: "block", fontSize: "13px", fontWeight: 500,
                                color: focusedField === "email" ? "#f87171" : "#94a3b8",
                                marginBottom: "8px", transition: "color 0.2s ease",
                            }}>
                                Yönetici E-posta Adresi
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{
                                    position: "absolute", left: "16px", top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "36px", height: "36px", borderRadius: "10px",
                                    background: focusedField === "email" ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.05)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}>
                                    <FiMail style={{
                                        color: focusedField === "email" ? "#f87171" : "#64748b",
                                        fontSize: "16px", transition: "color 0.3s ease",
                                    }} />
                                </div>
                                <input
                                    type="email" value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{
                                        width: "100%", padding: "16px 16px 16px 64px",
                                        background: "rgba(15, 23, 42, 0.6)",
                                        border: `1px solid ${focusedField === "email" ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                                        borderRadius: "14px", fontSize: "14px", fontWeight: 500,
                                        color: "white", outline: "none",
                                        fontFamily: "'Inter', sans-serif",
                                        boxShadow: focusedField === "email"
                                            ? "0 0 0 4px rgba(239, 68, 68, 0.1)"
                                            : "none",
                                        transition: "all 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: "32px" }}>
                            <label style={{
                                display: "block", fontSize: "13px", fontWeight: 500,
                                color: focusedField === "password" ? "#f87171" : "#94a3b8",
                                marginBottom: "8px", transition: "color 0.2s ease",
                            }}>
                                Güvenlik Şifresi
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{
                                    position: "absolute", left: "16px", top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "36px", height: "36px", borderRadius: "10px",
                                    background: focusedField === "password" ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.05)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}>
                                    <FiLock style={{
                                        color: focusedField === "password" ? "#f87171" : "#64748b",
                                        fontSize: "16px", transition: "color 0.3s ease",
                                    }} />
                                </div>
                                <input
                                    type="password" value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{
                                        width: "100%", padding: "16px 16px 16px 64px",
                                        background: "rgba(15, 23, 42, 0.6)",
                                        border: `1px solid ${focusedField === "password" ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                                        borderRadius: "14px", fontSize: "14px", fontWeight: 500,
                                        color: "white", outline: "none",
                                        fontFamily: "'Inter', sans-serif",
                                        boxShadow: focusedField === "password"
                                            ? "0 0 0 4px rgba(239, 68, 68, 0.1)"
                                            : "none",
                                        transition: "all 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div style={{
                                padding: "12px 16px", marginBottom: "20px",
                                background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "12px", fontSize: "13px",
                                color: "#fca5a5", fontWeight: 500,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: "100%", padding: "16px",
                                background: isLoggingIn
                                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
                                backgroundSize: "200% 200%",
                                border: "none", borderRadius: "14px",
                                color: "white", fontSize: "15px", fontWeight: 600,
                                fontFamily: "'Inter', sans-serif",
                                cursor: isLoggingIn ? "wait" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(239, 68, 68, 0.2)",
                                transform: isLoggingIn ? "scale(0.98)" : "scale(1)",
                                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                            }}
                        >
                            {isLoggingIn ? (
                                <>
                                    <span style={{
                                        width: "20px", height: "20px",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        borderTopColor: "white",
                                        borderRadius: "50%",
                                        animation: "spin 0.6s linear infinite",
                                    }} />
                                    Doğrulanıyor...
                                </>
                            ) : (
                                <>
                                    İdari Giriş Yap
                                    <FiArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Login */}
                    <div style={{
                        marginTop: "24px", paddingTop: "24px",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            marginBottom: "12px",
                        }}>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>DEMO HESAPLAR</span>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <button
                                disabled={isLoggingIn}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setEmail("idare@hastane.com");
                                    setPassword("123456");
                                }}
                                style={{
                                    padding: "10px 8px", borderRadius: "12px",
                                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                    color: "#94a3b8", fontSize: "12px", fontWeight: 500,
                                    cursor: "pointer", transition: "all 0.2s",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            >
                                <FiShield size={12} /> Başhekim
                            </button>
                            <button
                                disabled={isLoggingIn}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setEmail("personel@hastane.com");
                                    setPassword("123456");
                                }}
                                style={{
                                    padding: "10px 8px", borderRadius: "12px",
                                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                    color: "#94a3b8", fontSize: "12px", fontWeight: 500,
                                    cursor: "pointer", transition: "all 0.2s",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            >
                                <FiShield size={12} /> İdari Personel
                            </button>
                            <button
                                disabled={isLoggingIn}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setEmail("it.mudur@hastane.com");
                                    setPassword("123456");
                                }}
                                style={{
                                    padding: "10px 8px", borderRadius: "12px",
                                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                    color: "#818cf8", fontSize: "12px", fontWeight: 500,
                                    cursor: "pointer", transition: "all 0.2s",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            >
                                <FiShield size={12} /> Hastane Müdürü
                            </button>
                            <button
                                disabled={isLoggingIn}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setEmail("it.muduryrd@hastane.com");
                                    setPassword("123456");
                                }}
                                style={{
                                    padding: "10px 8px", borderRadius: "12px",
                                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                    color: "#c084fc", fontSize: "12px", fontWeight: 500,
                                    cursor: "pointer", transition: "all 0.2s",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(168, 85, 247, 0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            >
                                <FiShield size={12} /> Müdür Yrd.
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

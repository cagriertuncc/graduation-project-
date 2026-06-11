import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiShield, FiServer, FiSettings, FiActivity, FiEye, FiEyeOff, FiCpu, FiTrendingUp } from "react-icons/fi";
import { RiAdminLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();
    const [email, setEmail] = useState("admin@hastane.com");
    const [password, setPassword] = useState("123456");
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");

    // Live Server Metrics Simulation
    const [metrics, setMetrics] = useState({ cpu: 12, ram: 44, ping: 8 });

    // Simulated terminal logs
    const logTemplates = [
        "[SYS] Core health checks: 100% OK",
        "[DB] Buffer pool replication completed",
        "[SEC] Active session keys validated",
        "[NET] Mainframe uplink ping: 8ms",
        "[SYS] Cache layer memory synchronized",
        "[SEC] Intrusion detection signature safe",
        "[DB] Database replica synced with cluster"
    ];

    const [terminalLogs, setTerminalLogs] = useState([
        "[SYS] Core security initialization...",
        "[DB] Database connectivity established.",
        "[SEC] Advanced shield protocol active."
    ]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);

        // Fluctuate metrics
        const interval = setInterval(() => {
            setMetrics(prev => ({
                cpu: Math.min(60, Math.max(4, Math.floor(prev.cpu + (Math.random() * 4 - 2)))),
                ram: Math.min(80, Math.max(30, Math.floor(prev.ram + (Math.random() * 2 - 1)))),
                ping: Math.min(45, Math.max(4, Math.floor(prev.ping + (Math.random() * 4 - 2))))
            }));
        }, 2500);

        // Simulated console logger
        const logInterval = setInterval(() => {
            const randomLog = logTemplates[Math.floor(Math.random() * logTemplates.length)];
            const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setTerminalLogs(prev => [...prev.slice(-2), `[${timestamp}] ${randomLog}`]);
        }, 4000);

        return () => {
            clearInterval(interval);
            clearInterval(logInterval);
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            const loggedInUser = await login(email, password);
            navigate(loggedInUser?.role === "admin" ? "/admin" : "/dashboard");
        } catch (err) {
            setError(err.message || "Giriş başarısız");
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="login-container" style={{
            minHeight: "100vh",
            display: "flex",
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "#020617",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* ══════════════ DYNAMIC GLOW BACKGROUNDS ══════════════ */}
            <div style={{
                position: "absolute",
                top: "-10%",
                left: "10%",
                width: "500px",
                height: "500px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
                filter: "blur(100px)",
                animation: "floatOrb 18s ease-in-out infinite",
                pointerEvents: "none",
                zIndex: 1,
            }} />
            <div style={{
                position: "absolute",
                bottom: "-5%",
                right: "30%",
                width: "600px",
                height: "600px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)",
                filter: "blur(110px)",
                animation: "floatOrbOpposite 24s ease-in-out infinite",
                pointerEvents: "none",
                zIndex: 1,
            }} />
            <div style={{
                position: "absolute",
                top: "40%",
                left: "40%",
                width: "350px",
                height: "350px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(236, 72, 153, 0.04) 0%, transparent 70%)",
                filter: "blur(90px)",
                pointerEvents: "none",
                zIndex: 1,
            }} />

            {/* ══════════════ LEFT PANEL — Tech/Admin Visual ══════════════ */}
            <div className="left-panel" style={{
                flex: "0 0 50%",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, #020617 0%, #080c16 45%, #0e0d22 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "60px",
                borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                zIndex: 2,
            }}>
                {/* Panning grid background */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                    animation: "panGrid 40s linear infinite",
                    pointerEvents: "none",
                }} />

                {/* Content */}
                <div style={{ position: "relative", zIndex: 3 }}>
                    {/* Brand */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "36px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateX(0)" : "translateX(-30px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s",
                    }}>
                        <div className="brand-logo-glow" style={{
                            width: "56px",
                            height: "56px",
                            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                            borderRadius: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 30px rgba(99, 102, 241, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)",
                        }}>
                            <RiAdminLine style={{ fontSize: "30px", color: "white" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: "24px", fontWeight: 850, color: "white", letterSpacing: "-0.03em" }}>
                                MediTrack <span style={{ color: "#818cf8" }}>Admin</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                Bilgi İşlem ve Yönetim
                            </div>
                        </div>
                    </div>

                    {/* Hero text */}
                    <h1 style={{
                        fontSize: "48px",
                        fontWeight: 800,
                        lineHeight: 1.15,
                        color: "white",
                        letterSpacing: "-0.03em",
                        marginBottom: "20px",
                        maxWidth: "480px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s",
                    }}>
                        Sistem Altyapısını
                        <span style={{
                            display: "block",
                            background: "linear-gradient(135deg, #a5b4fc, #818cf8, #6366f1)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>
                            Güvenle Yönetin
                        </span>
                    </h1>

                    <p style={{
                        fontSize: "16px",
                        color: "#94a3b8",
                        lineHeight: 1.7,
                        maxWidth: "440px",
                        marginBottom: "32px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(15px)",
                        transition: "all 0.7s ease 0.6s",
                    }}>
                        Tüm hastane donanım performansı, veri tabanı yedekleri, acil durum kilit anahtarları ve personel yetki ayarları elinizin altında.
                    </p>

                    {/* Feature Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
                        {[
                            { icon: <FiSettings size={20} />, title: "Sistem Ayarları", desc: "Acil durum kilit ve bakım modu", color: "#6366f1", bgGlow: "rgba(99, 102, 241, 0.15)", delay: "0.7s" },
                            { icon: <FiServer size={20} />, title: "Yedekleme & IT", desc: "Tüm veritabanını tek tıkla indirme", color: "#38bdf8", bgGlow: "rgba(56, 189, 248, 0.15)", delay: "0.8s" },
                            { icon: <FiActivity size={20} />, title: "Canlı Performans", desc: "CPU, RAM ve kaynak sağlığı", color: "#10b981", bgGlow: "rgba(16, 185, 129, 0.15)", delay: "0.9s" },
                            { icon: <FiShield size={20} />, title: "Güvenlik Duvarı", desc: "Kullanıcı yetki ve rol kumandası", color: "#a855f7", bgGlow: "rgba(168, 85, 247, 0.15)", delay: "1.0s" },
                        ].map((feature, i) => (
                            <div key={i} className="hover-feature" style={{
                                background: "rgba(255,255,255,0.01)",
                                border: "1px solid rgba(255,255,255,0.04)",
                                padding: "18px",
                                borderRadius: "16px",
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(20px)",
                                transition: `all 0.7s ease ${feature.delay}, border-color 0.3s ease, background-color 0.3s ease`,
                                backdropFilter: "blur(12px)",
                                position: "relative",
                                overflow: "hidden",
                            }}>
                                <div style={{
                                    position: "absolute",
                                    top: "-20px",
                                    right: "-20px",
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    background: feature.bgGlow,
                                    filter: "blur(18px)",
                                    pointerEvents: "none",
                                    opacity: 0.4,
                                }} />
                                <div style={{ color: feature.color, marginBottom: "10px", display: "flex", alignItems: "center" }}>{feature.icon}</div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "white", marginBottom: "4px" }}>{feature.title}</div>
                                <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>{feature.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Simulated Live Monitor Card ── */}
                    <div style={{
                        background: "rgba(15, 23, 42, 0.4)",
                        border: "1px solid rgba(99, 102, 241, 0.15)",
                        borderRadius: "20px",
                        padding: "20px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 1.1s",
                        backdropFilter: "blur(10px)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pingGlow 1.5s infinite" }} />
                                <span style={{ fontSize: "11px", color: "#818cf8", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>SİSTEM DURUMU: ÇEVRİMİÇİ</span>
                            </div>
                            <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.35)", fontFamily: "monospace" }}>IT_CORE_v2.0</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.02)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", color: "#818cf8", marginBottom: "6px" }}><FiCpu size={14} /></div>
                                <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>CPU Yükü</div>
                                <div style={{ fontSize: "15px", fontWeight: 800, color: "white", fontFamily: "monospace" }}>%{metrics.cpu}</div>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.02)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", color: "#10b981", marginBottom: "6px" }}><FiActivity size={14} /></div>
                                <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>RAM Doluluk</div>
                                <div style={{ fontSize: "15px", fontWeight: 800, color: "white", fontFamily: "monospace" }}>%{metrics.ram}</div>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.02)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", color: "#f59e0b", marginBottom: "6px" }}><FiTrendingUp size={14} /></div>
                                <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>Gecikme</div>
                                <div style={{ fontSize: "15px", fontWeight: 800, color: "white", fontFamily: "monospace" }}>{metrics.ping}ms</div>
                            </div>
                        </div>

                        {/* Simulated Live Console Logs */}
                        <div style={{
                            marginTop: "16px",
                            background: "rgba(2, 6, 23, 0.75)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "14px",
                            padding: "14px 16px",
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: "11px",
                            color: "#4ade80",
                            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#eab308" }} />
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                                <span style={{ marginLeft: "6px", color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>console.log_</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {terminalLogs.map((log, index) => (
                                    <div key={index} style={{ opacity: index === 2 ? 1 : index === 1 ? 0.65 : 0.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        <span style={{ color: "#38bdf8" }}>$</span> {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════ RIGHT PANEL — Login Form ══════════════ */}
            <div className="right-panel" style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                position: "relative",
                zIndex: 2,
            }}>
                {/* Glowing orb behind login card */}
                <div style={{
                    position: "absolute",
                    width: "480px",
                    height: "480px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, transparent 70%)",
                    filter: "blur(60px)",
                    zIndex: 0,
                    pointerEvents: "none",
                }} />

                {/* Login Card */}
                <div className="login-card" style={{
                    width: "100%",
                    maxWidth: "430px",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(24px)",
                    transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s",
                    background: "rgba(10, 15, 30, 0.45)",
                    padding: "48px 40px",
                    borderRadius: "24px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(32px)",
                    position: "relative",
                    zIndex: 1,
                }}>
                    {/* Welcome header */}
                    <div style={{ marginBottom: "36px", textAlign: "center" }}>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "rgba(99, 102, 241, 0.1)",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            borderRadius: "100px",
                            color: "#818cf8",
                            fontSize: "12px",
                            fontWeight: 700,
                            marginBottom: "16px",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase"
                        }}>
                            <FiShield size={12} /> Bilgi İşlem Portalı
                        </div>
                        <h2 style={{
                            fontSize: "28px",
                            fontWeight: 800,
                            color: "white",
                            letterSpacing: "-0.03em",
                            marginBottom: "8px",
                        }}>
                            Yönetici Girişi
                        </h2>
                        <p style={{ fontSize: "14px", color: "#64748b" }}>
                            MediTrack sistem sunucusuna yetkili erişim
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {/* Email */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: focusedField === "email" ? "#818cf8" : "#94a3b8",
                                marginBottom: "8px",
                                transition: "color 0.2s ease",
                            }}>
                                E-posta Adresi
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{
                                    position: "absolute",
                                    left: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "10px",
                                    background: focusedField === "email" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}>
                                    <FiMail style={{
                                        color: focusedField === "email" ? "#818cf8" : "#475569",
                                        fontSize: "16px",
                                        transition: "color 0.3s ease",
                                    }} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{
                                        width: "100%",
                                        padding: "16px 16px 16px 64px",
                                        background: "rgba(10, 15, 30, 0.6)",
                                        border: `1px solid ${focusedField === "email" ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                                        borderRadius: "14px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "white",
                                        outline: "none",
                                        fontFamily: "'Inter', sans-serif",
                                        boxShadow: focusedField === "email"
                                            ? "0 0 0 4px rgba(99, 102, 241, 0.15), 0 4px 12px rgba(99, 102, 241, 0.1)"
                                            : "none",
                                        transition: "all 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: "32px" }}>
                            <label style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: focusedField === "password" ? "#818cf8" : "#94a3b8",
                                marginBottom: "8px",
                                transition: "color 0.2s ease",
                            }}>
                                Şifre
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{
                                    position: "absolute",
                                    left: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "10px",
                                    background: focusedField === "password" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}>
                                    <FiLock style={{
                                        color: focusedField === "password" ? "#818cf8" : "#475569",
                                        fontSize: "16px",
                                        transition: "color 0.3s ease",
                                    }} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{
                                        width: "100%",
                                        padding: "16px 48px 16px 64px",
                                        background: "rgba(10, 15, 30, 0.6)",
                                        border: `1px solid ${focusedField === "password" ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                                        borderRadius: "14px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "white",
                                        outline: "none",
                                        fontFamily: "'Inter', sans-serif",
                                        boxShadow: focusedField === "password"
                                            ? "0 0 0 4px rgba(99, 102, 241, 0.15), 0 4px 12px rgba(99, 102, 241, 0.1)"
                                            : "none",
                                        transition: "all 0.3s ease",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: showPassword ? "#818cf8" : "#475569",
                                        padding: "4px",
                                        borderRadius: "6px",
                                        transition: "color 0.2s ease",
                                    }}
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div style={{
                                padding: "12px 16px",
                                marginBottom: "20px",
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                borderRadius: "12px",
                                fontSize: "13px",
                                color: "#fca5a5",
                                fontWeight: 500,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: "100%",
                                padding: "16px",
                                background: isLoggingIn
                                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                                    : "linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #3730a3 100%)",
                                backgroundSize: "200% 200%",
                                border: "none",
                                borderRadius: "14px",
                                color: "white",
                                fontSize: "15px",
                                fontWeight: 700,
                                fontFamily: "'Inter', sans-serif",
                                cursor: isLoggingIn ? "wait" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3), 0 2px 8px rgba(79, 70, 229, 0.15)",
                                transform: isLoggingIn ? "scale(0.98)" : "scale(1)",
                                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                                animation: !isLoggingIn ? "gradientShift 4s ease infinite" : "none",
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoggingIn) {
                                    e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(79, 70, 229, 0.4), 0 4px 12px rgba(79, 70, 229, 0.2)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoggingIn) {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.3), 0 2px 8px rgba(79, 70, 229, 0.15)";
                                }
                            }}
                        >
                            {isLoggingIn ? (
                                <>
                                    <span style={{
                                        width: "20px",
                                        height: "20px",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        borderTopColor: "white",
                                        borderRadius: "50%",
                                        animation: "spin 0.6s linear infinite",
                                    }} />
                                    Doğrulanıyor...
                                </>
                            ) : (
                                <>
                                    Sisteme Giriş Yap
                                    <FiArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Login - Admin Only */}
                    <div style={{
                        marginTop: "24px",
                        paddingTop: "24px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}>
                        {/* Divider */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: "16px",
                            marginBottom: "16px",
                        }}>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>DEMO HESAPLAR</span>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {[
                                { name: "Müdür", email: "it.mudur@hastane.com", bg: "rgba(99, 102, 241, 0.1)", borderCol: "rgba(99, 102, 241, 0.2)", col: "#818cf8" },
                                { name: "Müdür Yrd.", email: "it.muduryrd@hastane.com", bg: "rgba(168, 85, 247, 0.1)", borderCol: "rgba(168, 85, 247, 0.2)", col: "#c084fc" },
                                { name: "IT Uzmanı", email: "admin@hastane.com", bg: "rgba(16, 185, 129, 0.1)", borderCol: "rgba(16, 185, 129, 0.2)", col: "#34d399" },
                            ].map((adminUser, idx) => (
                                <button
                                    key={idx}
                                    disabled={isLoggingIn}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setEmail(adminUser.email);
                                        setPassword("123456");
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "12px 8px",
                                        borderRadius: "12px",
                                        border: email === adminUser.email ? `1px solid ${adminUser.col}` : "1px solid rgba(255,255,255,0.05)",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        background: email === adminUser.email ? adminUser.bg : "rgba(255,255,255,0.02)",
                                        color: email === adminUser.email ? adminUser.col : "#94a3b8",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={e => {
                                        if (email !== adminUser.email) {
                                            e.currentTarget.style.background = adminUser.bg;
                                            e.currentTarget.style.borderColor = adminUser.borderCol;
                                            e.currentTarget.style.color = adminUser.col;
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (email !== adminUser.email) {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                                            e.currentTarget.style.color = "#94a3b8";
                                        }
                                    }}
                                >
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "8px",
                                        background: adminUser.bg, color: adminUser.col,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 700, fontSize: "12px", border: `1px solid ${adminUser.borderCol}`
                                    }}>
                                        {adminUser.name.charAt(0)}
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: 700, textAlign: "center" }}>{adminUser.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes panGrid {
                    0% { background-position: 0 0; }
                    100% { background-position: 40px 40px; }
                }
                @keyframes floatOrb {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-30px) scale(1.08); }
                }
                @keyframes floatOrbOpposite {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(30px) scale(1.1); }
                }
                @keyframes pingGlow {
                    0% { transform: scale(0.95); opacity: 0.6; }
                    50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 6px #10b981); }
                    100% { transform: scale(0.95); opacity: 0.6; }
                }
                @keyframes brandPulse {
                    0%, 100% { box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4); }
                    50% { box-shadow: 0 8px 40px rgba(99, 102, 241, 0.7), 0 0 15px rgba(99, 102, 241, 0.4); }
                }
                .brand-logo-glow {
                    animation: brandPulse 4s infinite ease-in-out;
                }
                .hover-feature {
                    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                }
                .hover-feature:hover {
                    transform: translateY(-4px);
                    background: rgba(255, 255, 255, 0.03) !important;
                    border-color: rgba(99, 102, 241, 0.25) !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }
                .login-card {
                    position: relative;
                }
                .login-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 24px;
                    padding: 1.5px;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.45) 0%, rgba(168, 85, 247, 0.15) 30%, rgba(255, 255, 255, 0.03) 60%, rgba(99, 102, 241, 0.35) 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                    z-index: 2;
                }
                @media (max-width: 992px) {
                    .login-container {
                        flex-direction: column !important;
                    }
                    .left-panel {
                        flex: 0 0 auto !important;
                        padding: 40px 30px !important;
                        border-right: none !important;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    }
                    .right-panel {
                        padding: 60px 20px !important;
                    }
                }
            `}</style>
        </div>
    );
}

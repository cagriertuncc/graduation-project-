import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiShield, FiUsers, FiActivity } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

/* ─── animated ECG/heartbeat SVG path ─── */
const ECG_PATH = "M0,50 L30,50 L35,50 L40,20 L45,80 L50,10 L55,90 L60,50 L65,50 L100,50 L130,50 L135,50 L140,20 L145,80 L150,10 L155,90 L160,50 L165,50 L200,50 L230,50 L235,50 L240,20 L245,80 L250,10 L255,90 L260,50 L265,50 L300,50";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();
    const [email, setEmail] = useState("ahmet.yilmaz@hastane.com");
    const [password, setPassword] = useState("123456");
    const [mounted, setMounted] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const [counter, setCounter] = useState({ patients: 0, diseases: 0, recovery: 0 });
    const [selectedDemoDept, setSelectedDemoDept] = useState("Dahiliye");

    const demoDepts = [
        {
            name: "Dahiliye",
            bg: "#dbeafe",
            col: "#1e40af",
            doctors: [
                { name: "Dr. Ahmet Yılmaz", email: "ahmet.yilmaz@hastane.com" },
                { name: "Dr. Canan Öz", email: "canan.oz@hastane.com" }
            ]
        },
        {
            name: "Kardiyoloji",
            bg: "#fce7f3",
            col: "#9d174d",
            doctors: [
                { name: "Dr. Ayşe Kaya", email: "ayse.kaya@hastane.com" },
                { name: "Dr. Murat Kılıç", email: "murat.kilic@hastane.com" }
            ]
        },
        {
            name: "Nöroloji",
            bg: "#e0e7ff",
            col: "#3730a3",
            doctors: [
                { name: "Dr. Mehmet Öz", email: "mehmet.oz@hastane.com" },
                { name: "Dr. Zeynep Aksoy", email: "zeynep.aksoy@hastane.com" }
            ]
        },
        {
            name: "Çocuk Sağ.",
            bg: "#dcfce7",
            col: "#15803d",
            doctors: [
                { name: "Dr. Fatma Şahin", email: "fatma.sahin@hastane.com" },
                { name: "Dr. Kerem Arslan", email: "kerem.arslan@hastane.com" }
            ]
        },
        {
            name: "Ortopedi",
            bg: "#fef3c7",
            col: "#b45309",
            doctors: [
                { name: "Dr. Serkan Yılmaz", email: "serkan.yilmaz@hastane.com" },
                { name: "Dr. Elif Yurt", email: "elif.yurt@hastane.com" }
            ]
        },
        {
            name: "Göz Hast.",
            bg: "#fae8ff",
            col: "#a21caf",
            doctors: [
                { name: "Dr. Selin Aydın", email: "selin.aydin@hastane.com" },
                { name: "Dr. Hakan Demir", email: "hakan.demir@hastane.com" }
            ]
        },
        {
            name: "Dermatoloji",
            bg: "#fee2e2",
            col: "#991b1b",
            doctors: [
                { name: "Dr. Yasemin Yalçın", email: "yasemin.yalcin@hastane.com" },
                { name: "Dr. Hakan Yıldız", email: "hakan.yildiz@hastane.com" }
            ]
        },
        {
            name: "Fiziksel Tıp",
            bg: "#ffedd5",
            col: "#9a3412",
            doctors: [
                { name: "Dr. Merve Şen", email: "merve.sen@hastane.com" },
                { name: "Dr. Kemal Koç", email: "kemal.koc@hastane.com" }
            ]
        },
        {
            name: "Genel Cerr.",
            bg: "#f3e8ff",
            col: "#6b21a8",
            doctors: [
                { name: "Dr. Serdar Polat", email: "serdar.polat@hastane.com" },
                { name: "Dr. Ebru Çelik", email: "ebru.celik@hastane.com" }
            ]
        },
        {
            name: "KBB",
            bg: "#e0f2fe",
            col: "#075985",
            doctors: [
                { name: "Dr. Emre Kurt", email: "emre.kurt@hastane.com" },
                { name: "Dr. Deniz Aslan", email: "deniz.aslan@hastane.com" }
            ]
        }
    ];

    useEffect(() => {
        if (isAuthenticated) {
            navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);
        // Animated counters
        const target = { patients: 2847, diseases: 1563, recovery: 94 };
        const duration = 2000;
        const steps = 60;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = Math.min(step / steps, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCounter({
                patients: Math.round(target.patients * ease),
                diseases: Math.round(target.diseases * ease),
                recovery: Math.round(target.recovery * ease),
            });
            if (step >= steps) clearInterval(timer);
        }, duration / steps);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            const loggedInDoctor = await login(email, password);
            navigate(loggedInDoctor?.role === "admin" ? "/admin" : "/dashboard");
        } catch (err) {
            setError(err.message || "Giriş başarısız");
            setIsLoggingIn(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex",
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "#ffffff",
        }}>

            {/* ══════════════ LEFT PANEL — Rich Visual ══════════════ */}
            <div style={{
                flex: "0 0 48%", position: "relative", overflow: "hidden",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
                display: "flex", flexDirection: "column", justifyContent: "center",
                padding: "60px",
            }}>
                {/* Animated mesh gradient overlay */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: `
            radial-gradient(ellipse at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(185,28,28,0.08) 0%, transparent 50%)
          `,
                    animation: "meshFloat 10s ease-in-out infinite",
                    pointerEvents: "none",
                }} />

                {/* Dot pattern */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                    pointerEvents: "none",
                }} />

                {/* ECG Lines - multiple animated */}
                <svg style={{
                    position: "absolute", bottom: "30%", left: 0, width: "100%", height: "100px",
                    opacity: 0.15, pointerEvents: "none",
                }} viewBox="0 0 300 100" preserveAspectRatio="none">
                    <path d={ECG_PATH} fill="none" stroke="#ef4444" strokeWidth="2"
                        strokeDasharray="600" strokeDashoffset="600"
                        style={{ animation: "ecgDraw 3s ease-in-out infinite" }} />
                </svg>
                <svg style={{
                    position: "absolute", top: "25%", left: 0, width: "100%", height: "80px",
                    opacity: 0.08, pointerEvents: "none",
                }} viewBox="0 0 300 100" preserveAspectRatio="none">
                    <path d={ECG_PATH} fill="none" stroke="#ef4444" strokeWidth="1.5"
                        strokeDasharray="600" strokeDashoffset="600"
                        style={{ animation: "ecgDraw 4s ease-in-out infinite 1s" }} />
                </svg>

                {/* Floating circles */}
                {[
                    { size: 200, top: "-5%", right: "-5%", opacity: 0.04, dur: "15s" },
                    { size: 150, bottom: "10%", left: "-3%", opacity: 0.05, dur: "12s" },
                    { size: 80, top: "40%", right: "20%", opacity: 0.06, dur: "8s" },
                ].map((c, i) => (
                    <div key={i} style={{
                        position: "absolute", width: c.size, height: c.size,
                        border: `1px solid rgba(239,68,68,${c.opacity * 5})`,
                        borderRadius: "50%",
                        top: c.top, right: c.right, bottom: c.bottom, left: c.left,
                        animation: `circleFloat ${c.dur} ease-in-out infinite`,
                        pointerEvents: "none",
                    }} />
                ))}

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
                            boxShadow: "0 8px 32px rgba(239,68,68,0.3)",
                        }}>
                            <RiHospitalLine style={{ fontSize: "26px", color: "white" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: "22px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                                MediTrack
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
                                Sağlık Bilgi Sistemi
                            </div>
                        </div>
                    </div>

                    {/* Hero text */}
                    <h1 style={{
                        fontSize: "42px", fontWeight: 800, lineHeight: 1.15,
                        color: "white", letterSpacing: "-0.03em",
                        marginBottom: "18px", maxWidth: "440px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s",
                    }}>
                        Hastalarınızı
                        <span style={{
                            display: "block",
                            background: "linear-gradient(135deg, #f87171, #ef4444, #dc2626)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            akıllıca takip edin.
                        </span>
                    </h1>

                    <p style={{
                        fontSize: "16px", color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.7, maxWidth: "400px", marginBottom: "44px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(15px)",
                        transition: "all 0.7s ease 0.6s",
                    }}>
                        MediTrack ile hasta bilgilerini güvenle yönetin, hastalık süreçlerini takip edin ve tedavi planlarını optimize edin.
                    </p>

                    {/* Stats row */}
                    <div style={{
                        display: "flex", gap: "32px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.7s ease 0.8s",
                    }}>
                        {[
                            { icon: <FiUsers size={18} />, value: counter.patients.toLocaleString() + "+", label: "Hasta Kaydı" },
                            { icon: <FiActivity size={18} />, value: counter.diseases.toLocaleString() + "+", label: "Hastalık Takibi" },
                            { icon: <FiShield size={18} />, value: `%${counter.recovery}`, label: "İyileşme Oranı" },
                        ].map((stat, i) => (
                            <div key={i} style={{ textAlign: "left" }}>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "8px",
                                    marginBottom: "4px",
                                }}>
                                    <span style={{ color: "#ef4444" }}>{stat.icon}</span>
                                    <span style={{
                                        fontSize: "24px", fontWeight: 800, color: "white",
                                        letterSpacing: "-0.02em",
                                        fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {stat.value}
                                    </span>
                                </div>
                                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom badge */}
                <div style={{
                    position: "absolute", bottom: "32px", left: "60px",
                    display: "flex", alignItems: "center", gap: "8px",
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 0.7s ease 1.2s",
                }}>
                    <FiShield style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }} />
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                        256-bit SSL ile güvenli bağlantı
                    </span>
                </div>
            </div>

            {/* ══════════════ RIGHT PANEL — Login Form ══════════════ */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "40px", position: "relative",
                background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
            }}>
                {/* Subtle corner decoration */}
                <div style={{
                    position: "absolute", top: 0, right: 0,
                    width: "300px", height: "300px",
                    background: "radial-gradient(circle at top right, rgba(239,68,68,0.03) 0%, transparent 60%)",
                    pointerEvents: "none",
                }} />

                <div style={{
                    width: "100%", maxWidth: "400px",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(24px)",
                    transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s",
                }}>
                    {/* Welcome text */}
                    <div style={{ marginBottom: "36px" }}>
                        <h2 style={{
                            fontSize: "28px", fontWeight: 700, color: "#111827",
                            letterSpacing: "-0.025em", marginBottom: "8px",
                        }}>
                            Hoş Geldiniz 👋
                        </h2>
                        <p style={{ fontSize: "15px", color: "#6b7280" }}>
                            Hesabınıza giriş yaparak devam edin
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {/* Email */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{
                                display: "block", fontSize: "13px", fontWeight: 600,
                                color: focusedField === "email" ? "#dc2626" : "#374151",
                                marginBottom: "8px", transition: "color 0.2s ease",
                            }}>
                                E-posta Adresi
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{
                                    position: "absolute", left: "16px", top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "36px", height: "36px", borderRadius: "10px",
                                    background: focusedField === "email" ? "#fef2f2" : "#f3f4f6",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}>
                                    <FiMail style={{
                                        color: focusedField === "email" ? "#dc2626" : "#9ca3af",
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
                                        background: "#ffffff",
                                        border: `2px solid ${focusedField === "email" ? "#ef4444" : "#e5e7eb"}`,
                                        borderRadius: "14px", fontSize: "14px", fontWeight: 500,
                                        color: "#111827", outline: "none",
                                        fontFamily: "'Inter', sans-serif",
                                        boxShadow: focusedField === "email"
                                            ? "0 0 0 4px rgba(239,68,68,0.08), 0 4px 16px rgba(239,68,68,0.06)"
                                            : "0 1px 3px rgba(0,0,0,0.04)",
                                        transition: "all 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: "28px" }}>
                            <label style={{
                                display: "block", fontSize: "13px", fontWeight: 600,
                                color: focusedField === "password" ? "#dc2626" : "#374151",
                                marginBottom: "8px", transition: "color 0.2s ease",
                            }}>
                                Şifre
                            </label>
                            <div style={{ position: "relative" }}>
                                <div style={{
                                    position: "absolute", left: "16px", top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "36px", height: "36px", borderRadius: "10px",
                                    background: focusedField === "password" ? "#fef2f2" : "#f3f4f6",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}>
                                    <FiLock style={{
                                        color: focusedField === "password" ? "#dc2626" : "#9ca3af",
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
                                        background: "#ffffff",
                                        border: `2px solid ${focusedField === "password" ? "#ef4444" : "#e5e7eb"}`,
                                        borderRadius: "14px", fontSize: "14px", fontWeight: 500,
                                        color: "#111827", outline: "none",
                                        fontFamily: "'Inter', sans-serif",
                                        boxShadow: focusedField === "password"
                                            ? "0 0 0 4px rgba(239,68,68,0.08), 0 4px 16px rgba(239,68,68,0.06)"
                                            : "0 1px 3px rgba(0,0,0,0.04)",
                                        transition: "all 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div style={{
                                padding: "12px 16px", marginBottom: "16px",
                                background: "#fef2f2", border: "1px solid #fecaca",
                                borderRadius: "12px", fontSize: "13px",
                                color: "#dc2626", fontWeight: 500,
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
                                    ? "linear-gradient(135deg, #f87171, #ef4444)"
                                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
                                backgroundSize: "200% 200%",
                                border: "none", borderRadius: "14px",
                                color: "white", fontSize: "15px", fontWeight: 700,
                                fontFamily: "'Inter', sans-serif",
                                cursor: isLoggingIn ? "wait" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                boxShadow: "0 8px 24px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.15)",
                                transform: isLoggingIn ? "scale(0.98)" : "scale(1)",
                                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                                animation: !isLoggingIn ? "gradientShift 3s ease infinite" : "none",
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoggingIn) {
                                    e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(220,38,38,0.3), 0 4px 12px rgba(220,38,38,0.2)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoggingIn) {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.15)";
                                }
                            }}
                        >
                            {isLoggingIn ? (
                                <>
                                    <span style={{
                                        width: "20px", height: "20px",
                                        border: "2.5px solid rgba(255,255,255,0.3)",
                                        borderTopColor: "white",
                                        borderRadius: "50%",
                                        animation: "spin 0.6s linear infinite",
                                    }} />
                                    Giriş Yapılıyor...
                                </>
                            ) : (
                                <>
                                    Giriş Yap
                                    <FiArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        margin: "28px 0 16px 0",
                    }}>
                        <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                        <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>DEMO HESAPLAR</span>
                        <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                    </div>

                    {/* Department Tabs */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                        {demoDepts.map((dept) => (
                            <button
                                key={dept.name}
                                type="button"
                                onClick={() => setSelectedDemoDept(dept.name)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    border: `1.5px solid ${selectedDemoDept === dept.name ? dept.col : "#e5e7eb"}`,
                                    background: selectedDemoDept === dept.name ? dept.bg : "white",
                                    color: selectedDemoDept === dept.name ? dept.col : "#4b5563",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {dept.name}
                            </button>
                        ))}
                    </div>

                    {/* Doctors for Selected Department */}
                    <div style={{ display: "flex", gap: "10px" }}>
                        {demoDepts.find(d => d.name === selectedDemoDept)?.doctors.map((doc, idx) => {
                            const deptData = demoDepts.find(d => d.name === selectedDemoDept);
                            const isSelected = email === doc.email;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={isLoggingIn}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setEmail(doc.email);
                                        setPassword("123456");
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "12px 14px",
                                        borderRadius: "14px",
                                        border: `1.5px solid ${isSelected ? deptData.col : "#e5e7eb"}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        background: isSelected ? deptData.bg : "white",
                                        color: isSelected ? deptData.col : "#1f2937",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        textAlign: "left"
                                    }}
                                >
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        background: isSelected ? "white" : deptData.bg,
                                        color: deptData.col,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800,
                                        fontSize: "13px",
                                        border: isSelected ? `1px solid ${deptData.col}30` : "none"
                                    }}>
                                        {doc.name.split(" ").pop()?.charAt(0) || "D"}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", fontWeight: 700 }}>{doc.name}</div>
                                        <div style={{ fontSize: "10px", opacity: 0.7 }}>Tıkla ve Doldur</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <p style={{
                        textAlign: "center", marginTop: "32px",
                        fontSize: "12px", color: "#9ca3af",
                    }}>
                        © 2025 MediTrack • Tüm hakları saklıdır
                    </p>
                </div>
            </div>

            {/* ══════════════ KEYFRAMES ══════════════ */}
            <style>{`
        @keyframes ecgDraw {
          0% { stroke-dashoffset: 600; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -600; }
        }
        @keyframes meshFloat {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes circleFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15px, -10px) scale(1.05); }
          66% { transform: translate(-10px, 8px) scale(0.95); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
        </div>
    );
}

import { useState, useEffect, useMemo } from "react";
import { analyticsApi } from "../services/api";
import {
    FiUsers, FiCalendar, FiFileText, FiDroplet,
    FiMonitor, FiClipboard, FiScissors, FiTrendingUp,
    FiTrendingDown, FiActivity, FiCpu, FiCompass, FiHash
} from "react-icons/fi";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, Tooltip as RechartsTooltip
} from 'recharts';

// Refined color palette for dark mode (Red/Neon centric)
const DARK_COLORS = [
    "#ef4444", "#a855f7", "#10b981", "#fbbf24", "#3b82f6",
    "#ec4899", "#06b6d4", "#f43f5e", "#6366f1", "#0ea5e9",
];

export default function AnalyticsPage() {
    const [overview, setOverview] = useState(null);
    const [monthlyPatients, setMonthlyPatients] = useState([]);
    const [topDiagnoses, setTopDiagnoses] = useState([]);
    const [medDist, setMedDist] = useState([]);
    const [demographics, setDemographics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setLoading(true);
        Promise.all([
            analyticsApi.getOverview(),
            analyticsApi.getMonthlyPatients(),
            analyticsApi.getTopDiagnoses(),
            analyticsApi.getMedicationDistribution(),
            analyticsApi.getPatientDemographics(),
        ]).then(([ov, mp, td, md, demo]) => {
            setOverview(ov);
            setMonthlyPatients(mp);
            setTopDiagnoses(td);
            setMedDist(md);
            setDemographics(demo);
            setLoading(false);
        }).catch(err => {
            console.error("Analytics overhaul load failed:", err);
            setLoading(false);
        });
    }, []);

    const genderData = useMemo(() => {
        if (!demographics?.genderDist) return [];
        return demographics.genderDist.map(g => ({
            name: g.gender === "Male" ? "Erkek" : g.gender === "Female" ? "Kadın" : g.gender,
            value: g.count
        }));
    }, [demographics]);

    const ageData = useMemo(() => demographics?.ageDist || [], [demographics]);

    if (loading) {
        return (
            <div style={{
                display: "flex", flexDirection: "column", gap: "24px", padding: "40px",
                justifyContent: "center", alignItems: "center", minHeight: "100vh",
                background: "#020617"
            }}>
                <div style={{
                    width: "50px", height: "50px", border: "3px solid rgba(255,255,255,0.05)",
                    borderTop: "3px solid #ef4444", borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>VERİLER İŞLENİYOR</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const patientChange = overview?.lastMonthPatients > 0
        ? Math.round(((overview.thisMonthPatients - overview.lastMonthPatients) / overview.lastMonthPatients) * 100)
        : overview?.thisMonthPatients > 0 ? 100 : 0;

    const apptChange = overview?.lastMonthAppointments > 0
        ? Math.round(((overview.thisMonthAppointments - overview.lastMonthAppointments) / overview.lastMonthAppointments) * 100)
        : overview?.thisMonthAppointments > 0 ? 100 : 0;

    const cardStyle = (color = "#ef4444") => ({
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        padding: "24px",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
    });

    return (
        <div style={{
            minHeight: "100vh", background: "transparent", color: "white",
            position: "relative", overflow: "hidden",
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            {/* ═══ SOFT LIGHT GRADIENTS ═══ */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `
                    radial-gradient(circle at 10% 10%, rgba(239, 68, 68, 0.06) 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(99, 102, 241, 0.06) 0%, transparent 40%)
                `,
                zIndex: 0, pointerEvents: "none"
            }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: "1600px", margin: "0 auto" }}>
                {/* ═══ HEADER ═══ */}
                <header style={{ marginBottom: "48px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
                            <FiCpu /> SİSTEM ANALİZİ
                        </div>
                        <h1 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "8px", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.04em" }}>
                            İstatistik Terminali
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "15px", fontWeight: 500 }}>Global klinik verileri ve operasyonel performans metrikleri.</p>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{
                            padding: "10px 20px", background: "rgba(0, 0, 0, 0.2)",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px",
                            fontSize: "13px", fontWeight: 700, color: "#cbd5e1"
                        }}>
                            Durum: <span style={{ color: "#10b981" }}>Aktif</span>
                        </div>
                    </div>
                </header>

                {/* ═══ STAT CARDS ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "40px" }}>
                    {[
                        { label: "Hasta Filosu", value: overview?.totalPatients, icon: <FiUsers />, color: "#ef4444", change: patientChange },
                        { label: "Randevu Dağılımı", value: overview?.totalAppointments, icon: <FiCalendar />, color: "#10b981", change: apptChange },
                        { label: "Reçete Yığını", value: overview?.totalPrescriptions, icon: <FiFileText />, color: "#f59e0b", change: 12 },
                        { label: "Veri Bütünlüğü", value: "99.8%", icon: <FiHash />, color: "#06b6d4", change: 0.2 },
                    ].map((stat, i) => (
                        <div key={i} style={cardStyle()}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                <div style={{
                                    width: "44px", height: "44px", borderRadius: "12px",
                                    background: `${stat.color}15`, color: stat.color, display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: "20px",
                                    border: `1px solid ${stat.color}30`
                                }}>
                                    {stat.icon}
                                </div>
                                <div style={{
                                    color: stat.change >= 0 ? "#10b981" : "#ef4444",
                                    fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px"
                                }}>
                                    {stat.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                                    {stat.change}%
                                </div>
                            </div>
                            <div style={{ fontSize: "32px", fontWeight: 800, color: "white", marginBottom: "4px" }}>
                                {stat.value?.toLocaleString() || 0}
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ═══ PRIMARY CHARTS SECTION ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "40px" }}>
                    <div style={cardStyle()}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "32px", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiActivity style={{ color: "#ef4444" }} /> Zamansal Büyüme Analizi
                        </h3>
                        <div style={{ height: "340px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyPatients}>
                                    <defs>
                                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                                    <Tooltip
                                        contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                                        itemStyle={{ color: "#ef4444", fontWeight: 700 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        fill="url(#redGradient)"
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={cardStyle()}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "32px", color: "white" }}>Cinsiyet Dağılımı</h3>
                        <div style={{ height: "240px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderData}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {genderData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={DARK_COLORS[index % DARK_COLORS.length]}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: "24px", display: "grid", gap: "8px" }}>
                            {genderData.map((g, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: DARK_COLORS[i % DARK_COLORS.length] }} />
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1" }}>{g.name}</span>
                                    </div>
                                    <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>{g.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ BOTTOM ROW CHARTS ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
                    <div style={cardStyle()}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "32px", color: "white" }}>Tanı Yaygınlığı</h3>
                        <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={topDiagnoses.slice(0, 5)} margin={{ left: 40 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="diagnosis"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                                    />
                                    <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={18}>
                                        {topDiagnoses.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DARK_COLORS[(index + 2) % DARK_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={cardStyle()}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "32px", color: "white" }}>Yaş Grubu Dağılımı</h3>
                        <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} hide />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={28}>
                                        {ageData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DARK_COLORS[(index + 4) % DARK_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ═══ SYSTEM FOOTER ═══ */}
                <footer style={{
                    marginTop: "40px", padding: "32px",
                    background: "rgba(30, 41, 59, 0.7)", borderRadius: "32px",
                    border: "1px solid rgba(255,255,255,0.08)", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    boxShadow: "none"
                }}>
                    <div>
                        <h4 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px", color: "white" }}>Öngörü Motoru v2.4</h4>
                        <p style={{ color: "#cbd5e1", fontSize: "14px", maxWidth: "600px", margin: 0 }}>
                            Tanı akış modellerinin izlenmesi sonucunda mevcut döngüde <span style={{ color: "#ef4444", fontWeight: 800 }}>%{patientChange} performans artışı</span> tespit edilmiştir.
                        </p>
                    </div>
                    <button style={{
                        padding: "14px 28px", background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", color: "white", fontWeight: 700,
                        border: "none", borderRadius: "14px", cursor: "pointer", fontSize: "13px",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)"
                    }}>
                        Analiz İndir
                    </button>
                </footer>
            </div>

            <style>{`
                ::-webkit-scrollbar {
                    width: 7px;
                }
                ::-webkit-scrollbar-track {
                    background: #020617;
                }
                ::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </div>
    );
}

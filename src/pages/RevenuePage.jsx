import { useState, useEffect } from "react";
import { analyticsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    FiDollarSign, FiCalendar, FiDroplet, FiMonitor,
    FiClipboard, FiScissors, FiTrendingUp, FiBarChart2, FiCpu
} from "react-icons/fi";

const CATEGORY_CONFIG = {
    appointments: { label: "Muayene", icon: <FiCalendar size={16} />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
    labResults: { label: "Laboratuvar", icon: <FiDroplet size={16} />, color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" },
    radiology: { label: "Radyoloji", icon: <FiMonitor size={16} />, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
    reports: { label: "Raporlar", icon: <FiClipboard size={16} />, color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)" },
    procedures: { label: "İşlemler", icon: <FiScissors size={16} />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
};

const PROC_TYPE_COLORS = {
    "Ameliyat": "#ef4444",
    "Küçük Cerrahi": "#f97316",
    "Biyopsi": "#8b5cf6",
    "Endoskopi": "#06b6d4",
    "Enjeksiyon": "#10b981",
    "Pansuman": "#f59e0b",
    "Diğer": "#6b7280",
};

const formatCurrency = (val) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);

export default function RevenuePage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyticsApi.getRevenue().then(d => {
            setData(d);
            setLoading(false);
        }).catch(err => {
            console.error("Gelir verileri yüklenemedi:", err);
            setLoading(false);
        });
    }, []);

    if (user?.specialty !== "Bilgi İşlem Müdürü") {
        return (
            <div style={{
                color: "white",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "20px",
                background: "#020617",
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                <div style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "24px",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    padding: "40px",
                    maxWidth: "500px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
                }}>
                    <FiDollarSign size={64} color="#ef4444" style={{ marginBottom: "20px" }} />
                    <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>Yetkisiz Erişim</h2>
                    <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                        Bu sayfa sadece <strong>Bilgi İşlem Müdürü</strong> yetkisine sahip kullanıcıların erişimine açıktır. Mevcut ünvanınız (<strong>{user?.specialty || "Belirsiz"}</strong>) ile finansal verileri görüntüleyemezsiniz.
                    </p>
                    <button
                        onClick={() => window.location.href = "/admin"}
                        style={{
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "10px",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Panele Geri Dön
                    </button>
                </div>
            </div>
        );
    }

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
                <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>GELİR VERİLERİ YÜKLENİYOR</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{
                display: "flex", flexDirection: "column", gap: "24px", padding: "40px",
                justifyContent: "center", alignItems: "center", minHeight: "100vh",
                background: "#020617"
            }}>
                <div style={{ fontSize: "16px", color: "#ef4444", fontWeight: 700 }}>Veriler yüklenemedi.</div>
            </div>
        );
    }

    const { monthlyRevenue, thisMonthSummary, procByType, prices } = data;

    const maxMonthlyTotal = Math.max(...monthlyRevenue.map(m => m.total), 1);
    const totalAllTime = monthlyRevenue.reduce((s, m) => s + m.total, 0);
    const avgMonthly = Math.round(totalAllTime / 12);

    // Most revenue month
    const bestMonth = monthlyRevenue.reduce((best, m) => m.total > best.total ? m : best, monthlyRevenue[0]);

    const cardStyle = {
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        padding: "24px",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
    };

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
                            <FiCpu /> FİNANSAL YÖNETİM
                        </div>
                        <h1 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "8px", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.04em" }}>
                            Gelir Takip Terminali
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "15px", fontWeight: 500 }}>Muayene ve işlem bazlı klinik gelir analizi ve fiyatlandırma verileri.</p>
                    </div>
                </header>

                {/* ═══ TOP SUMMARY ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                    {[
                        { label: "Bu Ay Toplam", value: formatCurrency(thisMonthSummary.total), icon: <FiDollarSign size={20} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
                        { label: "12 Ay Toplam", value: formatCurrency(totalAllTime), icon: <FiTrendingUp size={20} />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
                        { label: "Aylık Ortalama", value: formatCurrency(avgMonthly), icon: <FiBarChart2 size={20} />, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
                        { label: "En İyi Ay", value: bestMonth ? bestMonth.month : "-", icon: <FiCalendar size={20} />, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", subtitle: bestMonth ? formatCurrency(bestMonth.total) : "" },
                    ].map((stat, i) => (
                        <div key={i} className="animate-fade-in" style={{
                            ...cardStyle,
                            animationDelay: `${i * 60}ms`,
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                <div style={{
                                    width: "44px", height: "44px", borderRadius: "12px",
                                    background: stat.bg, color: stat.color, display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: "20px",
                                    border: `1px solid ${stat.color}30`
                                }}>
                                    {stat.icon}
                                </div>
                                {stat.subtitle && (
                                    <div style={{ fontSize: "11px", fontWeight: 700, color: stat.color, marginTop: "4px" }}>
                                        {stat.subtitle}
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "4px" }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ═══ THIS MONTH CATEGORY BREAKDOWN ═══ */}
                <div className="animate-fade-in" style={{ ...cardStyle, marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                        📋 Bu Ay Kategori Bazlı Gelir
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg], i) => {
                            const cat = thisMonthSummary[key];
                            if (!cat) return null;
                            const pct = thisMonthSummary.total > 0 ? Math.round((cat.revenue / thisMonthSummary.total) * 100) : 0;
                            return (
                                <div key={key} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: "10px", background: cfg.bg,
                                                display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color,
                                                border: `1px solid ${cfg.color}30`
                                            }}>
                                                {cfg.icon}
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#cbd5e1" }}>{cfg.label}</span>
                                                <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "10px" }}>{cat.count} adet</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <span style={{ fontSize: "15px", fontWeight: 800, color: cfg.color }}>{formatCurrency(cat.revenue)}</span>
                                            <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>{pct}%</span>
                                        </div>
                                    </div>
                                    <div style={{ width: "100%", height: "8px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.05)" }}>
                                        <div style={{
                                            width: `${pct}%`, height: "100%", borderRadius: "4px",
                                            background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`,
                                            transition: "width 0.5s ease",
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ═══ MONTHLY REVENUE CHART ═══ */}
                <div className="animate-fade-in" style={{ ...cardStyle, marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white", margin: "0 0 24px" }}>
                        📈 Aylık Gelir Trendi (Son 12 Ay)
                    </h3>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "180px", paddingBottom: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        {monthlyRevenue.map((m, i) => {
                            const pct = (m.total / maxMonthlyTotal) * 140;
                            return (
                                <div key={i} style={{
                                    flex: 1, display: "flex", flexDirection: "column",
                                    alignItems: "center", gap: "6px",
                                }}>
                                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1" }}>
                                        {m.total > 0 ? `${Math.round(m.total / 1000)}K` : ""}
                                    </span>
                                    <div style={{ position: "relative", width: "100%", height: `${Math.max(pct, 4)}px`, minWidth: "16px" }}>
                                        {/* Stacked bars */}
                                        {(() => {
                                            const segments = [
                                                { val: m.appointments, color: "#3b82f6" },
                                                { val: m.labResults, color: "#06b6d4" },
                                                { val: m.radiology, color: "#8b5cf6" },
                                                { val: m.reports, color: "#ec4899" },
                                                { val: m.procedures, color: "#ef4444" },
                                            ];
                                            let offset = 0;
                                            return segments.map((s, si) => {
                                                const h = m.total > 0 ? (s.val / m.total) * Math.max(pct, 4) : 0;
                                                const el = (
                                                    <div key={si} style={{
                                                        position: "absolute", bottom: offset, left: 0, right: 0,
                                                        height: `${h}px`, background: s.color,
                                                        borderRadius: si === segments.length - 1 ? "4px 4px 0 0" : "0",
                                                    }} />
                                                );
                                                offset += h;
                                                return el;
                                            });
                                        })()}
                                    </div>
                                    <span style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", marginTop: "4px" }}>
                                        {m.month.split(" ")[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "18px", marginTop: "16px", flexWrap: "wrap" }}>
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: 10, height: 10, borderRadius: "3px", background: cfg.color }} />
                                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{cfg.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ PROCEDURE TYPE REVENUE & PRICE TABLE ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px", marginBottom: "20px" }}>
                    {/* Procedure type breakdown */}
                    <div className="animate-fade-in" style={cardStyle}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white", margin: "0 0 24px" }}>
                            ✂️ İşlem Türü Bazlı Gelir
                        </h3>
                        {Object.keys(procByType).length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {Object.entries(procByType)
                                    .sort((a, b) => b[1].revenue - a[1].revenue)
                                    .map(([type, info], i) => {
                                        const maxRev = Math.max(...Object.values(procByType).map(v => v.revenue), 1);
                                        const color = PROC_TYPE_COLORS[type] || "#6b7280";
                                        return (
                                            <div key={type}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1" }}>
                                                        {type} <span style={{ fontSize: "11px", color: "#64748b" }}>({info.count})</span>
                                                    </span>
                                                    <span style={{ fontSize: "13px", fontWeight: 700, color }}>{formatCurrency(info.revenue)}</span>
                                                </div>
                                                <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.05)" }}>
                                                    <div style={{
                                                        width: `${(info.revenue / maxRev) * 100}%`,
                                                        height: "100%", borderRadius: "3px", background: color,
                                                        transition: "width 0.5s ease",
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        ) : (
                            <div style={{ fontSize: "13px", color: "#64748b", textAlign: "center", padding: "20px" }}>
                                Henüz işlem verisi yok
                            </div>
                        )}
                    </div>

                    {/* Price Table */}
                    <div className="animate-fade-in" style={{ ...cardStyle, animationDelay: "100ms" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white", margin: "0 0 24px" }}>
                            📝 Birim Fiyat Tablosu
                        </h3>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                            <thead>
                                <tr>
                                    <th style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textAlign: "left", padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hizmet</th>
                                    <th style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textAlign: "right", padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Birim Fiyat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: "Muayene", price: prices.appointment },
                                    { name: "Laboratuvar Testi", price: prices.labResult },
                                    { name: "Radyoloji", price: prices.radiology },
                                    { name: "Tıbbi Rapor", price: prices.medicalReport },
                                ].map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", borderLeft: "1px solid rgba(255, 255, 255, 0.04)", borderTop: "1px solid rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", borderRadius: "10px 0 0 10px" }}>
                                            {item.name}
                                        </td>
                                        <td style={{ fontSize: "13px", fontWeight: 700, color: "#10b981", textAlign: "right", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", borderRight: "1px solid rgba(255, 255, 255, 0.04)", borderTop: "1px solid rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", borderRadius: "0 10px 10px 0" }}>
                                            {formatCurrency(item.price)}
                                        </td>
                                    </tr>
                                ))}
                                {Object.entries(prices.procedure).map(([type, price], i) => (
                                    <tr key={`proc-${i}`}>
                                        <td style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", padding: "10px 12px", background: "rgba(239, 68, 68, 0.04)", borderLeft: "1px solid rgba(239, 68, 68, 0.08)", borderTop: "1px solid rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.08)", borderRadius: "10px 0 0 10px" }}>
                                            ✂️ {type}
                                        </td>
                                        <td style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", textAlign: "right", padding: "10px 12px", background: "rgba(239, 68, 68, 0.04)", borderRight: "1px solid rgba(239, 68, 68, 0.08)", borderTop: "1px solid rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.08)", borderRadius: "0 10px 10px 0" }}>
                                            {formatCurrency(price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
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


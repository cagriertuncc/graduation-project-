import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar,
    FiUsers, FiLogOut, FiRefreshCw, FiBarChart2, FiActivity,
    FiDroplet, FiMonitor, FiClipboard, FiScissors,
    FiArrowUp, FiArrowDown, FiClock, FiCheckCircle,
    FiXCircle, FiAlertCircle, FiChevronRight, FiFilter,
    FiFileText, FiAlertOctagon, FiShield,
} from "react-icons/fi";
import { useAccountantAuth } from "../context/AccountantAuthContext";

const BASE = "/api";
const fmt = (v) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v || 0);
const fmtShort = (v) => {
    if (!v && v !== 0) return "—";
    if (Math.abs(v) >= 1000000) return `₺${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `₺${(v / 1000).toFixed(0)}K`;
    return `₺${v}`;
};

const CATS = {
    appointments: { label: "Muayene", icon: <FiCalendar size={14} />, color: "#3b82f6" },
    labResults: { label: "Laboratuvar", icon: <FiDroplet size={14} />, color: "#06b6d4" },
    radiology: { label: "Radyoloji", icon: <FiMonitor size={14} />, color: "#a78bfa" },
    reports: { label: "Raporlar", icon: <FiClipboard size={14} />, color: "#f472b6" },
    procedures: { label: "İşlemler", icon: <FiScissors size={14} />, color: "#fb923c" },
};

const STATUS_MAP = {
    confirmed: { label: "Onaylı", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <FiCheckCircle size={10} /> },
    pending: { label: "Bekliyor", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <FiAlertCircle size={10} /> },
    cancelled: { label: "İptal", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <FiXCircle size={10} /> },
    completed: { label: "Tamamlandı", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", icon: <FiCheckCircle size={10} /> },
};

/* Animated counter */
function AnimNum({ value }) {
    const [d, setD] = useState(0);
    const ref = useRef();
    useEffect(() => {
        const n = parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;
        let t = null;
        const step = (ts) => {
            if (!t) t = ts;
            const p = Math.min((ts - t) / 1100, 1);
            setD(Math.floor((1 - Math.pow(1 - p, 3)) * n));
            if (p < 1) ref.current = requestAnimationFrame(step);
        };
        ref.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(ref.current);
    }, [value]);
    return <>{d.toLocaleString("tr-TR")}</>;
}

/* SVG Line Chart */
function LineChart({ data }) {
    if (!data || data.length < 2) return null;
    const W = 100, H = 60;
    const vals = data.map(d => d.total);
    const min = Math.min(...vals), max = Math.max(...vals, 1);
    const pts = data.map((d, i) => `${(i / (data.length - 1)) * W},${H - ((d.total - min) / (max - min || 1)) * H}`);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
            <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M${pts[0]} L${pts.join(" L")} L${W},${H} L0,${H} Z`} fill="url(#lg)" />
            <polyline points={pts.join(" ")} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/* Stacked bar */
function StackedBar({ data, height = 180 }) {
    const maxVal = Math.max(...data.map(d => d.total), 1);
    const keys = ["appointments", "labResults", "radiology", "reports", "procedures"];
    const colors = ["#3b82f6", "#06b6d4", "#a78bfa", "#f472b6", "#fb923c"];
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: data.length > 8 ? 5 : 8, height }}>
            {data.map((m, i) => {
                const barH = (m.total / maxVal) * (height - 28);
                const isLast = i === data.length - 1;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{ width: "100%", height: Math.max(barH, 3), borderRadius: "4px 4px 0 0", overflow: "hidden", cursor: "default" }} title={`${m.month}: ${fmt(m.total)}`}>
                            {keys.map((k, j) => (
                                <div key={j} style={{ width: "100%", height: `${m.total > 0 ? (m[k] || 0) / m.total * 100 : 0}%`, background: isLast ? colors[j] : colors[j] + "88" }} />
                            ))}
                        </div>
                        <span style={{ fontSize: 8, color: isLast ? "#10b981" : "rgba(255,255,255,0.28)", fontWeight: isLast ? 800 : 500, whiteSpace: "nowrap" }}>
                            {m.shortMonth || m.month?.split(" ")[0]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* Donut */
function Donut({ breakdown }) {
    if (!breakdown?.total) return <div style={{ color: "rgba(255,255,255,0.25)", textAlign: "center", padding: 20, fontSize: 13 }}>Bu dönemde veri yok</div>;
    const total = breakdown.total;
    const items = Object.entries(CATS).map(([k, c]) => ({ ...c, k, rev: breakdown.categories[k]?.revenue || 0 })).filter(i => i.rev > 0);
    const R = 38, cx = 50, cy = 50;
    let cum = -90;
    const segs = items.map(it => {
        const pct = it.rev / total, ang = pct * 360;
        const s = ((cum) * Math.PI / 180), e = ((cum + ang) * Math.PI / 180);
        const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s), x2 = cx + R * Math.cos(e), y2 = cy + R * Math.sin(e);
        const path = `M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 ${ang > 180 ? 1 : 0} 1 ${x2} ${y2}Z`;
        cum += ang;
        return { ...it, path, pct };
    });
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg viewBox="0 0 100 100" style={{ width: 120, height: 120, flexShrink: 0 }}>
                {segs.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.9" />)}
                <circle cx={cx} cy={cy} r={22} fill="#0a1628" />
                <text x={cx} y={cy - 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="800">Toplam</text>
                <text x={cx} y={cy + 7} textAnchor="middle" fill="#10b981" fontSize="6.5" fontWeight="700">{fmtShort(total)}</text>
            </svg>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                {segs.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{s.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{Math.round(s.pct * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Hero KPI Card ─────────────────────────────────────────────── */
function HeroCard({ emoji, label, mainValue, mainIsAmount, subLabel, subValue, subIsAmount, change, changePct, accentColor, bottomLabel, bottomValue, loading }) {
    const isUp = changePct > 0;
    const isDown = changePct < 0;
    return (
        <div style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))`,
            border: `1px solid ${accentColor}30`,
            borderTop: `2px solid ${accentColor}`,
            borderRadius: 20,
            padding: "24px 22px",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", gap: 0,
            backdropFilter: "blur(16px)",
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "default",
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${accentColor}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
            {/* Glow */}
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${accentColor}20 0%, transparent 70%)`, pointerEvents: "none" }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 13,
                    background: `${accentColor}18`, border: `1px solid ${accentColor}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                }}>
                    {emoji}
                </div>
                {changePct !== undefined && changePct !== 0 && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", borderRadius: 20,
                        background: isUp ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)",
                        color: isUp ? "#10b981" : "#f87171",
                        fontSize: 11, fontWeight: 800,
                    }}>
                        {isUp ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />}
                        {Math.abs(changePct)}%
                    </div>
                )}
            </div>

            {/* Label */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                {label}
            </div>

            {/* Main value */}
            <div style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>
                {loading ? <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 20 }}>—</span>
                    : mainIsAmount ? fmt(mainValue)
                        : <><AnimNum value={mainValue} /></>
                }
            </div>

            {/* Sub value */}
            {subLabel && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginBottom: 12 }}>
                    {subLabel}:{" "}
                    <span style={{ color: accentColor, fontWeight: 700 }}>
                        {subIsAmount ? fmt(subValue) : subValue}
                    </span>
                </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />

            {/* Bottom */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{bottomLabel}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>{bottomValue}</span>
            </div>
        </div>
    );
}

/* ─── Data hook ─────────────────────────────────────────────────── */
function useFinance(token) {
    const [kpi, setKpi] = useState(null);
    const [summary, setSummary] = useState(null);
    const [monthly, setMonthly] = useState([]);
    const [breakdown, setBreakdown] = useState(null);
    const [recent, setRecent] = useState([]);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [kpiLoading, setKpiLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(false);
    const [error, setError] = useState(null);
    const h = { Authorization: `Bearer ${token}` };

    const loadKpi = useCallback(async (period) => {
        setKpiLoading(true);
        try {
            const d = await fetch(`${BASE}/finance/kpi?period=${period}`, { headers: h }).then(r => r.json());
            if (d.error) throw new Error(d.error);
            setKpi(d);
        } catch (e) { setError(e.message); }
        finally { setKpiLoading(false); }
    }, [token]);

    const loadCharts = useCallback(async () => {
        setChartsLoading(true);
        try {
            const d = await fetch(`${BASE}/finance/charts`, { headers: h }).then(r => r.json());
            if (d.error) throw new Error(d.error);
            setCharts(d);
        } catch (e) { setError(e.message); }
        finally { setChartsLoading(false); }
    }, [token]);

    const loadAll = useCallback(async (period = "month") => {
        setLoading(true); setError(null);
        try {
            const [s, m, b, r] = await Promise.all([
                fetch(`${BASE}/finance/summary`, { headers: h }).then(r => r.json()),
                fetch(`${BASE}/finance/monthly-revenue`, { headers: h }).then(r => r.json()),
                fetch(`${BASE}/finance/category-breakdown`, { headers: h }).then(r => r.json()),
                fetch(`${BASE}/finance/recent-appointments`, { headers: h }).then(r => r.json()),
            ]);
            setSummary(s); setMonthly(Array.isArray(m) ? m : []); setBreakdown(b); setRecent(Array.isArray(r) ? r : []);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [token]);

    return { kpi, summary, monthly, breakdown, recent, charts, loading, kpiLoading, chartsLoading, error, loadAll, loadKpi, loadCharts };
}

/* ─── Mini bar chart for any data array ─────────────────────────── */
function MiniBarChart({ data, color = "#10b981", height = 140, labelKey = "label", valueKey = "total" }) {
    if (!data?.length) return <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Veri yok</div>;
    const maxV = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, paddingTop: 8 }}>
            {data.map((d, i) => {
                const h2 = Math.max((d[valueKey] || 0) / maxV * (height - 28), 2);
                return (
                    <div key={i} title={`${d[labelKey]}: ${fmt(d[valueKey] || 0)}`}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "default" }}
                    >
                        <div style={{ width: "100%", height: h2, borderRadius: "3px 3px 0 0", background: `linear-gradient(to top,${color}cc,${color})`, boxShadow: `0 0 6px ${color}33`, transition: "height 0.4s ease" }} />
                        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", textAlign: "center" }}>{d[labelKey]}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Big area line chart ────────────────────────────────────────── */
function AreaChart({ data, color = "#10b981", height = 140, labelKey = "label", valueKey = "total" }) {
    if (!data?.length) return null;
    const W = 400, H = height;
    const vals = data.map(d => d[valueKey] || 0);
    const min = 0, max = Math.max(...vals, 1);
    const pts = vals.map((v, i) => `${(i / (vals.length - 1 || 1)) * W},${H - ((v - min) / (max - min || 1)) * (H - 12)}`);
    return (
        <div style={{ width: "100%", height, overflow: "hidden" }}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                <defs>
                    <linearGradient id={`ag${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`M${pts[0]} L${pts.join(" L")} L${W},${H} L0,${H}Z`} fill={`url(#ag${color.replace("#", "")})`} />
                <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {vals.map((v, i) => (
                    <circle key={i} cx={(i / (vals.length - 1 || 1)) * W} cy={H - ((v - min) / (max - min || 1)) * (H - 12)} r={3.5} fill={color} stroke="#0a1628" strokeWidth="2" />
                ))}
            </svg>
        </div>
    );
}

/* ─── Main Dashboard ────────────────────────────────────────────── */
export default function AccountantDashboard() {
    const { user, token, logout } = useAccountantAuth();
    const navigate = useNavigate();
    const [period, setPeriod] = useState("month");
    const [activeTab, setTab] = useState("overview");
    const [spinning, setSpinning] = useState(false);
    const { kpi, summary, monthly, breakdown, recent, charts, loading, kpiLoading, chartsLoading, error, loadAll, loadKpi, loadCharts } = useFinance(token);

    useEffect(() => { loadAll(period); }, []);
    useEffect(() => { loadKpi(period); }, [period]);
    useEffect(() => { if (activeTab === "charts") loadCharts(); }, [activeTab]);

    const refresh = async () => {
        setSpinning(true);
        const promises = [loadAll(period), loadKpi(period)];
        if (activeTab === "charts") promises.push(loadCharts());
        await Promise.all(promises);
        setTimeout(() => setSpinning(false), 600);
    };

    const k = kpi?.kpis;
    const M = monthly;
    const allTime = M.reduce((s, m) => s + m.total, 0);
    const avgMo = M.length ? Math.round(allTime / M.length) : 0;
    const best = M.reduce((b, m) => m.total > b.total ? m : b, M[0] || { total: 0 });

    const PERIOD_LABELS = { today: "Bugün", month: "Bu Ay", year: "Bu Yıl" };

    const HERO_CARDS = k ? [
        {
            emoji: "💰", label: "Günlük / Aylık Gelir", mainValue: k.dailyRevenue.value, mainIsAmount: true,
            subLabel: "Önceki dönem", subValue: k.dailyRevenue.prev, subIsAmount: true,
            changePct: k.dailyRevenue.change,
            bottomLabel: "Trend", bottomValue: k.dailyRevenue.change >= 0 ? "▲ Artış" : "▼ Düşüş",
            accentColor: "#10b981"
        },
        {
            emoji: "📅", label: "Dönem Geliri", mainValue: k.monthlyRevenue.value, mainIsAmount: true,
            subLabel: "Randevu bazlı", subValue: k.invoiceCount.value, subIsAmount: false,
            changePct: k.monthlyRevenue.change,
            bottomLabel: "Önceki dönem", bottomValue: fmt(k.monthlyRevenue.prev),
            accentColor: "#3b82f6"
        },
        {
            emoji: "🧾", label: "Kesilen Fatura", mainValue: k.invoiceCount.value, mainIsAmount: false,
            subLabel: "Tutar", subValue: k.invoiceCount.amount, subIsAmount: true,
            changePct: k.invoiceCount.change,
            bottomLabel: "Önceki dönem", bottomValue: `${k.invoiceCount.prev} adet`,
            accentColor: "#a78bfa"
        },
        {
            emoji: "⏳", label: "Ödenmemiş Faturalar", mainValue: k.unpaidInvoices.value, mainIsAmount: false,
            subLabel: "Tutar", subValue: k.unpaidInvoices.amount, subIsAmount: true,
            changePct: undefined,
            bottomLabel: "Durum", bottomValue: k.unpaidInvoices.value > 0 ? "⚠️ Takip gerekli" : "✅ Temiz",
            accentColor: "#f59e0b"
        },
        {
            emoji: "🏦", label: "Tahsil Edilen Tutar", mainValue: k.collectedAmount.value, mainIsAmount: true,
            subLabel: "Adet", subValue: k.collectedAmount.count, subIsAmount: false,
            changePct: undefined,
            bottomLabel: "Tahsilat oranı", bottomValue: `%${k.collectedAmount.change}`,
            accentColor: "#34d399"
        },
        {
            emoji: "🏥", label: "SGK / Sigorta Bekleyen", mainValue: k.sgkPending.value, mainIsAmount: true,
            subLabel: "Kayıt", subValue: k.sgkPending.count, subIsAmount: false,
            changePct: undefined,
            bottomLabel: "Durum", bottomValue: "İşlem bekliyor",
            accentColor: "#f472b6"
        },
    ] : [];

    const TABS = [
        { key: "overview", label: "Genel Bakış", icon: <FiActivity size={13} /> },
        { key: "charts", label: "Grafikler", icon: <FiTrendingUp size={13} /> },
        { key: "monthly", label: "Aylık Trend", icon: <FiBarChart2 size={13} /> },
        { key: "transactions", label: "İşlemler", icon: <FiClipboard size={13} /> },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(155deg,#020c14 0%,#031a24 60%,#020e18 100%)", fontFamily: "'Inter',-apple-system,sans-serif", color: "#f1f5f9" }}>

            {/* ══ NAV ══ */}
            <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 60, background: "rgba(2,12,20,0.88)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", position: "sticky", top: 0, zIndex: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#059669,#10b981)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "white", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}>₺</div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>MediTrack <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>Finance</span></span>
                    <div style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 9px", borderRadius: 20 }}>MUHASEBECİ</div>
                </div>

                <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif", background: activeTab === t.key ? "rgba(16,185,129,0.15)" : "transparent", color: activeTab === t.key ? "#10b981" : "rgba(255,255,255,0.38)", transition: "all 0.2s" }}>
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{user?.name || "Muhasebe"}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{user?.email}</div>
                    </div>
                    <button onClick={refresh} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", animation: spinning ? "spin 0.6s linear infinite" : "none" }}>
                        <FiRefreshCw size={13} />
                    </button>
                    <button onClick={() => { logout(); navigate("/muhasebe/giris"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.12)", color: "#fca5a5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                    >
                        <FiLogOut size={13} /> Çıkış
                    </button>
                </div>
            </nav>

            <main style={{ padding: "24px 28px", maxWidth: 1440, margin: "0 auto" }}>

                {/* ── Page Header ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 900, color: "white", letterSpacing: "-0.025em", margin: 0, marginBottom: 3 }}>Finansal Dashboard</h1>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                            <FiClock size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                            {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Canlı badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.14)", padding: "6px 14px", borderRadius: 20 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>Canlı</span>
                        </div>
                        {/* Period filter */}
                        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                                <button key={key} onClick={() => setPeriod(key)} style={{ padding: "6px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif", background: period === key ? "rgba(16,185,129,0.18)" : "transparent", color: period === key ? "#10b981" : "rgba(255,255,255,0.4)", boxShadow: period === key ? "0 0 12px rgba(16,185,129,0.15)" : "none", transition: "all 0.2s" }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                    HERO KPI SECTION — 6 cards
                ══════════════════════════════════════════════════════ */}
                <section style={{ marginBottom: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                            {PERIOD_LABELS[period]} Finansal Göstergeler
                        </span>
                        <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
                        {kpiLoading
                            ? Array(6).fill(0).map((_, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, display: "flex", alignItems: "center", justifyContent: "center", height: 180 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(16,185,129,0.15)", borderTopColor: "#10b981", animation: "spin 0.8s linear infinite" }} />
                                </div>
                            ))
                            : HERO_CARDS.map((c, i) => <HeroCard key={i} {...c} loading={kpiLoading} />)
                        }
                    </div>
                </section>

                {/* Loading / Error */}
                {loading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(16,185,129,0.1)", borderTopColor: "#10b981", animation: "spin 0.75s linear infinite" }} />
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Veriler yükleniyor…</span>
                    </div>
                )}
                {!loading && error && (
                    <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.17)", borderRadius: 16, padding: 28, textAlign: "center" }}>
                        <FiXCircle size={28} color="#f87171" style={{ marginBottom: 10 }} />
                        <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 4 }}>Bağlantı hatası</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>{error}</div>
                        <button onClick={refresh} style={{ padding: "7px 20px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 8, color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Tekrar Dene</button>
                    </div>
                )}

                {/* ══ OVERVIEW TAB ══ */}
                {!loading && !error && activeTab === "overview" && (
                    <>
                        {/* Secondary quick stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
                            {[
                                { label: "12 Aylık Toplam", val: fmtShort(allTime), color: "#34d399" },
                                { label: "Aylık Ortalama", val: fmtShort(avgMo), color: "#60a5fa" },
                                { label: "En Yüksek Ay", val: best?.shortMonth || "—", sub: fmtShort(best?.total), color: "#f472b6" },
                            ].map((s, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${s.color}20`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>{s.val}</div>
                                        {s.sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.sub}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 3-col */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 18 }}>
                            {/* Donut */}
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 22 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 3 }}>Gelir Dağılımı</div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>Bu ay kategori bazlı</div>
                                <Donut breakdown={breakdown} />
                                {breakdown && (
                                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Bu Ay Toplam</span>
                                        <span style={{ fontSize: 17, fontWeight: 900, color: "#10b981" }}>{fmt(breakdown.total)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Category bars */}
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 22 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 3 }}>Hizmet Breakdown</div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>Gelir & adet</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {breakdown && Object.entries(CATS).map(([key, cfg]) => {
                                        const cat = breakdown.categories[key];
                                        if (!cat) return null;
                                        const pct = breakdown.total > 0 ? Math.round((cat.revenue / breakdown.total) * 100) : 0;
                                        return (
                                            <div key={key}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${cfg.color}18`, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{cfg.icon}</div>
                                                        <div>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{cfg.label}</div>
                                                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{cat.count} adet</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{fmt(cat.revenue)}</div>
                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{pct}%</div>
                                                    </div>
                                                </div>
                                                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                                                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${cfg.color},${cfg.color}88)`, transition: "width 0.7s ease", boxShadow: `0 0 6px ${cfg.color}44` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!breakdown && <div style={{ color: "rgba(255,255,255,0.25)", textAlign: "center", fontSize: 13, padding: "16px 0" }}>Veri yok</div>}
                                </div>
                            </div>

                            {/* Trend */}
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 22 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>Gelir Trendi</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.09)", padding: "2px 8px", borderRadius: 20 }}>Son 6 ay</div>
                                </div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Aylık gelir eğrisi</div>
                                <div style={{ height: 70, marginBottom: 8 }}><LineChart data={M.slice(-6)} /></div>
                                <div style={{ marginTop: 8 }}><StackedBar data={M.slice(-6)} height={90} /></div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10, justifyContent: "center" }}>
                                    {Object.entries(CATS).map(([k, c]) => (
                                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <div style={{ width: 7, height: 7, borderRadius: 2, background: c.color }} />
                                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{c.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent transactions */}
                        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 22 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>Son İşlemler</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>En son 5 randevu</div>
                                </div>
                                <button onClick={() => setTab("transactions")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.14)", borderRadius: 8, color: "#10b981", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                                    Tümü <FiChevronRight size={12} />
                                </button>
                            </div>
                            <TxTable rows={recent.slice(0, 5)} />
                        </div>
                    </>
                )}

                {/* ══ MONTHLY TAB ══ */}
                {!loading && !error && activeTab === "monthly" && (
                    <>
                        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 26, marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                                <div>
                                    <h2 style={{ fontSize: 15, fontWeight: 900, color: "white", margin: 0, marginBottom: 4 }}>Son 12 Ay Gelir Trendi</h2>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Kategori bazlı yığılmış</p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>{fmt(allTime)}</div>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>12 Aylık Toplam</div>
                                </div>
                            </div>
                            <div style={{ height: 100, marginBottom: 6 }}><LineChart data={M} /></div>
                            <StackedBar data={M} height={180} />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14, justifyContent: "center" }}>
                                {Object.entries(CATS).map(([k, c]) => (
                                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <div style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Monthly table */}
                        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 22, overflowX: "auto" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 16 }}>Aylık Detay Tablosu</div>
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 5px", minWidth: 680 }}>
                                <thead>
                                    <tr>{["Ay", "Muayene", "Laboratuvar", "Radyoloji", "Raporlar", "İşlemler", "TOPLAM"].map(h => (
                                        <th key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textAlign: h === "Ay" ? "left" : "right", padding: "6px 14px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody>
                                    {M.map((m, i) => {
                                        const isLast = i === M.length - 1, isBest = m === best;
                                        return (
                                            <tr key={i} style={{ background: isLast ? "rgba(16,185,129,0.06)" : isBest ? "rgba(244,114,182,0.04)" : "rgba(255,255,255,0.02)" }}>
                                                <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, color: isLast ? "#10b981" : isBest ? "#f472b6" : "white", borderRadius: "7px 0 0 7px" }}>
                                                    {m.month}{isBest && !isLast && <span style={{ marginLeft: 5, fontSize: 9, color: "#f472b6" }}>★</span>}
                                                </td>
                                                {[m.appointments, m.labResults, m.radiology, m.reports, m.procedures].map((v, j) => (
                                                    <td key={j} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 600, color: v > 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)", textAlign: "right" }}>{v > 0 ? fmt(v) : "—"}</td>
                                                ))}
                                                <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 800, color: isLast ? "#10b981" : "white", textAlign: "right", borderRadius: "0 7px 7px 0" }}>{fmt(m.total)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td style={{ padding: "13px 14px", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>TOPLAM</td>
                                        {["appointments", "labResults", "radiology", "reports", "procedures"].map(k => (
                                            <td key={k} style={{ padding: "13px 14px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textAlign: "right", borderTop: "1px solid rgba(255,255,255,0.07)" }}>{fmt(M.reduce((s, m) => s + (m[k] || 0), 0))}</td>
                                        ))}
                                        <td style={{ padding: "13px 14px", fontSize: 16, fontWeight: 900, color: "#10b981", textAlign: "right", borderTop: "1px solid rgba(255,255,255,0.07)" }}>{fmt(allTime)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}

                {/* ══ CHARTS TAB ══ */}
                {!loading && !error && activeTab === "charts" && (
                    <>
                        {chartsLoading && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 14 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(16,185,129,0.1)", borderTopColor: "#10b981", animation: "spin 0.75s linear infinite" }} />
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Grafik verileri yükleniyor…</span>
                            </div>
                        )}
                        {!chartsLoading && charts && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {/* ROW 1: Daily + Monthly */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    {/* Günlük */}
                                    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(59,130,246,0.18)", borderTop: "2px solid #3b82f6", borderRadius: 18, padding: 22 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 3 }}>📊 Günlük Gelir</div>
                                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: "#3b82f6" }}>{fmt(charts.daily.reduce((s, d) => s + d.total, 0))}</div>
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Bugün toplam</div>
                                            </div>
                                        </div>
                                        <AreaChart data={charts.daily} color="#3b82f6" height={130} />
                                        <div style={{ marginTop: 8 }}>
                                            <MiniBarChart data={charts.daily} color="#3b82f6" height={80} labelKey="label" valueKey="total" />
                                        </div>
                                        {charts.daily.every(d => d.total === 0) && (
                                            <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Bugün henüz işlem yok</div>
                                        )}
                                    </div>
                                    {/* Aylık haftalık */}
                                    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(16,185,129,0.18)", borderTop: "2px solid #10b981", borderRadius: 18, padding: 22 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 3 }}>📅 Aylık Gelir</div>
                                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} — Haftalık dağılım</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{fmt(charts.monthly.reduce((s, d) => s + d.total, 0))}</div>
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Bu ay toplam</div>
                                            </div>
                                        </div>
                                        <AreaChart data={charts.monthly} color="#10b981" height={130} labelKey="label" />
                                        <div style={{ marginTop: 8 }}>
                                            <MiniBarChart data={charts.monthly} color="#10b981" height={80} labelKey="label" />
                                        </div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                            {charts.monthly.map((w, i) => (
                                                <div key={i} style={{ flex: 1, background: "rgba(16,185,129,0.06)", borderRadius: 8, padding: "6px 10px", minWidth: 60 }}>
                                                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>{w.label} ({w.dayRange})</div>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", marginTop: 2 }}>{fmt(w.total) || "—"}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 2: Yearly trend */}
                                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(167,139,250,0.18)", borderTop: "2px solid #a78bfa", borderRadius: 18, padding: 22 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 3 }}>📈 Yıllık Trend</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Son 12 aylık gelir eğrisi</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: "#a78bfa" }}>{fmt(charts.yearly.reduce((s, d) => s + d.total, 0))}</div>
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>12 Aylık Toplam</div>
                                            </div>
                                        </div>
                                    </div>
                                    <AreaChart data={charts.yearly} color="#a78bfa" height={160} labelKey="shortLabel" />
                                    <div style={{ marginTop: 8 }}>
                                        <MiniBarChart data={charts.yearly} color="#a78bfa" height={90} labelKey="shortLabel" />
                                    </div>
                                    {/* Yearly summary row */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
                                        {(() => {
                                            const y = charts.yearly;
                                            const total = y.reduce((s, d) => s + d.total, 0);
                                            const avg = y.length ? Math.round(total / y.length) : 0;
                                            const bestM = y.reduce((b, d) => d.total > b.total ? d : b, y[0] || { total: 0 });
                                            const worstM = y.filter(d => d.total > 0).reduce((b, d) => d.total < b.total ? d : b, y.find(d => d.total > 0) || { total: 0 });
                                            return [
                                                { label: "Toplam Gelir", val: fmt(total), color: "#a78bfa" },
                                                { label: "Aylık Ortalama", val: fmt(avg), color: "#60a5fa" },
                                                { label: "En Yüksek Ay", val: `${bestM.shortLabel || "—"} — ${fmt(bestM.total)}`, color: "#34d399" },
                                                { label: "En Düşük Ay", val: `${worstM?.shortLabel || "—"} — ${fmt(worstM?.total || 0)}`, color: "#f87171" },
                                            ].map((s, i) => (
                                                <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${s.color}` }}>
                                                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                {/* ROW 3: Bu Ay vs Geçen Ay Karşılaştırma */}
                                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(251,146,60,0.18)", borderTop: "2px solid #fb923c", borderRadius: 18, padding: 22 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 3 }}>🔄 Önceki Ay Karşılaştırması</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{charts.comparison.lastMonth.name} → {charts.comparison.thisMonth.name}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: charts.comparison.pctChange >= 0 ? "#10b981" : "#f87171" }}>
                                                {charts.comparison.pctChange >= 0 ? "▲" : "▼"} {Math.abs(charts.comparison.pctChange)}%
                                            </div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>değişim</div>
                                        </div>
                                    </div>

                                    {/* Side-by-side totals */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", marginBottom: 20 }}>
                                        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 18, textAlign: "center" }}>
                                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{charts.comparison.lastMonth.name}</div>
                                            <div style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.5)" }}>{fmt(charts.comparison.lastMonth.total)}</div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: charts.comparison.pctChange >= 0 ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                                {charts.comparison.pctChange >= 0 ? "📈" : "📉"}
                                            </div>
                                        </div>
                                        <div style={{ background: charts.comparison.pctChange >= 0 ? "rgba(16,185,129,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${charts.comparison.pctChange >= 0 ? "rgba(16,185,129,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: 14, padding: 18, textAlign: "center" }}>
                                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{charts.comparison.thisMonth.name}</div>
                                            <div style={{ fontSize: 26, fontWeight: 900, color: charts.comparison.pctChange >= 0 ? "#10b981" : "#f87171" }}>{fmt(charts.comparison.thisMonth.total)}</div>
                                        </div>
                                    </div>

                                    {/* Category comparison bars */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {charts.comparison.categories.map((cat, i) => {
                                            const cfg = CATS[cat.key];
                                            if (!cfg) return null;
                                            const maxVal = Math.max(cat.thisValue, cat.lastValue, 1);
                                            const thisW = (cat.thisValue / maxVal * 100).toFixed(1);
                                            const lastW = (cat.lastValue / maxVal * 100).toFixed(1);
                                            return (
                                                <div key={i}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${cfg.color}18`, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{cfg.icon}</div>
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{cfg.label}</span>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmt(cat.lastValue)}</span>
                                                            <span style={{ fontSize: 11, fontWeight: 800, color: cat.pct >= 0 ? "#10b981" : "#f87171", background: cat.pct >= 0 ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)", padding: "2px 7px", borderRadius: 10 }}>
                                                                {cat.pct >= 0 ? "+" : ""}{cat.pct}%
                                                            </span>
                                                            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 800 }}>{fmt(cat.thisValue)}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                                        <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
                                                            <div style={{ width: `${lastW}%`, height: "100%", borderRadius: 3, background: "rgba(255,255,255,0.15)" }} />
                                                        </div>
                                                        <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
                                                            <div style={{ width: `${thisW}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${cfg.color}cc,${cfg.color})`, boxShadow: `0 0 5px ${cfg.color}44` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 5, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Önceki ay</span></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 5, borderRadius: 2, background: "#10b981" }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Bu ay</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ══ TRANSACTIONS TAB ══ */}
                {!loading && !error && activeTab === "transactions" && (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
                            {[
                                { label: "Toplam İşlem", val: recent.length, color: "#10b981" },
                                { label: "Toplam Gelir", val: fmt(recent.reduce((s, a) => s + a.amount, 0)), color: "#60a5fa" },
                                { label: "Onaylı / Tamamlanan", val: recent.filter(a => ["confirmed", "completed"].includes(a.status)).length, color: "#34d399" },
                                { label: "Bekleyen", val: recent.filter(a => a.status === "pending").length, color: "#f59e0b" },
                            ].map((s, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${s.color}22`, borderRadius: 14, padding: "15px 18px" }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: 21, fontWeight: 900, color: s.color }}>{s.val}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 22, overflowX: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>İşlem Kayıtları</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Son {recent.length} randevu</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                                    <FiFilter size={11} /> Filtrele
                                </div>
                            </div>
                            <TxTable rows={recent} />
                            {recent.length > 0 && (
                                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{recent.length} kayıt</span>
                                    <span style={{ fontSize: 16, fontWeight: 900, color: "#10b981" }}>{fmt(recent.reduce((s, a) => s + a.amount, 0))}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <style>{`
                @keyframes spin { to { transform:rotate(360deg); } }
                * { box-sizing:border-box; margin:0; }
                ::-webkit-scrollbar{width:5px;height:5px}
                ::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
                ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:3px}
            `}</style>
        </div>
    );
}

/* ─── Transaction table (shared) ────────────────────────────────── */
function TxTable({ rows }) {
    if (!rows.length) return <div style={{ textAlign: "center", padding: 36, color: "rgba(255,255,255,0.25)", fontSize: 13 }}>İşlem verisi bulunamadı</div>;
    return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", minWidth: 640 }}>
            <thead>
                <tr>{["Hasta", "Doktor / Uzmanlık", "Hizmet", "Tutar", "Durum"].map(h => (
                    <th key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textAlign: h === "Tutar" ? "right" : h === "Durum" ? "center" : "left", padding: "6px 14px", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</th>
                ))}</tr>
            </thead>
            <tbody>
                {rows.map((a, i) => {
                    const sc = STATUS_MAP[a.status] || STATUS_MAP.confirmed;
                    return (
                        <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.018)" : "transparent", transition: "background 0.15s", cursor: "default" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.018)" : "transparent"}
                        >
                            <td style={{ padding: "11px 14px", borderRadius: "7px 0 0 7px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#10b981", flexShrink: 0 }}>{(a.patientName || "?")[0]}</div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{a.patientName}</div>
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{new Date(a.date).toLocaleDateString("tr-TR")}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: "11px 14px" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{a.doctorName}</div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{a.specialty}</div>
                            </td>
                            <td style={{ padding: "11px 14px" }}>
                                <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(96,165,250,0.1)", color: "#93c5fd" }}>{a.type || "Muayene"}</span>
                            </td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 13, fontWeight: 900, color: "#10b981" }}>{fmt(a.amount)}</td>
                            <td style={{ padding: "11px 14px", textAlign: "center", borderRadius: "0 7px 7px 0" }}>
                                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    {sc.icon}{sc.label}
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

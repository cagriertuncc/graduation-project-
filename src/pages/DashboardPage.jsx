import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { patientsApi, appointmentsApi, analyticsApi, leaveRequestsApi, labResultsApi, radiologyApi, adminApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DiseaseTag from "../components/DiseaseTag";
import IzinTalebiModal from "../components/IzinTalebiModal";
import {
    FiUsers, FiCheckCircle, FiArrowRight, FiCalendar, FiTrendingUp, FiTrendingDown,
    FiActivity, FiPlus, FiClock, FiArrowUpRight, FiBarChart2, FiPieChart, FiHeart,
    FiFileText, FiAlertTriangle, FiShield, FiTarget, FiStar, FiZap, FiAward,
    FiPercent, FiChevronRight, FiCpu, FiMessageSquare, FiSettings, FiBriefcase, FiDroplet, FiBell
} from "react-icons/fi";
import {
    RiHeartPulseLine, RiAlertLine, RiCapsuleLine, RiStethoscopeLine,
    RiPulseLine, RiHospitalLine, RiMentalHealthLine
} from "react-icons/ri";

/* ══════════════════════════ HOOKS ══════════════════════════ */
function useCounter(end, duration = 1600, delay = 400) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const to = setTimeout(() => {
            let f;
            const s = performance.now();
            const tick = (n) => {
                const p = Math.min((n - s) / duration, 1);
                setVal(Math.round(end * (1 - Math.pow(1 - p, 4))));
                if (p < 1) f = requestAnimationFrame(tick);
            };
            f = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(f);
        }, delay);
        return () => clearTimeout(to);
    }, [end, duration, delay]);
    return val;
}

/* ══════════════════════════ AREA SPARK ══════════════════════════ */
function AreaSpark({ data, color = "#ef4444", w = 120, h = 48 }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 600); }, []);
    if (!data || data.length === 0) return null;
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const pts = data.map((v, i) => ({
        x: (i / (data.length - 1)) * w,
        y: h - 4 - ((v - min) / range) * (h - 8),
    }));
    const path = pts.map((p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const prev = pts[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    }).join(" ");
    const area = path + ` L${w},${h} L0,${h} Z`;

    return (
        <svg width={w} height={h} style={{ overflow: "visible" }}>
            <defs>
                <linearGradient id={`as-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#as-${color.replace("#", "")})`}
                opacity={m ? 1 : 0} style={{ transition: "opacity 0.6s ease 0.5s" }} />
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
                strokeDasharray="400" strokeDashoffset={m ? 0 : 400}
                style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1) 0.3s" }} />
        </svg>
    );
}

/* ══════════════════════════ LARGE RING (Hero) ══════════════════════════ */
function HeroRing({ value, max, size = 180, sw = 14, color = "#ef4444" }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 500); }, []);
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const pct = value / (max || 1);
    const displayPct = useCounter(Math.round(pct * 100), 1600, 500);

    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <defs>
                    <linearGradient id="heroLightGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="#f1f5f9" strokeWidth={sw} />
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="url(#heroLightGrad)" strokeWidth={sw}
                    strokeDasharray={circ} strokeDashoffset={m ? circ * (1 - pct) : circ}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1) 0.3s" }}
                />
            </svg>
            <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
            }}>
                <span style={{ fontSize: "38px", fontWeight: 900, color: "#1e293b", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    %{displayPct}
                </span>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "4px", textTransform: "uppercase" }}>İyileşme</span>
            </div>
        </div>
    );
}

/* ══════════════════════════ BAR CHART (Vertical) ══════════════════════════ */
function VBarChart({ data, height = 200 }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 700); }, []);
    const maxVal = Math.max(...data.map(d => d.value)) * 1.2 || 1;

    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height, paddingTop: "16px" }}>
            {data.map((d, i) => {
                const barH = (d.value / maxVal) * (height - 40);
                const isHighest = d.value === Math.max(...data.map(x => x.value));
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <div style={{
                            width: "100%", borderRadius: "6px 6px 2px 2px",
                            background: isHighest
                                ? "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)"
                                : "#e2e8f0",
                            height: m ? Math.max(barH, 4) : 0,
                            transition: `height 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
                            position: "relative",
                            boxShadow: isHighest ? "0 4px 12px rgba(239, 68, 68, 0.15)" : "none",
                        }} />
                        <span style={{
                            fontSize: "9px", color: "#94a3b8", fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.5px",
                        }}>{d.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════ SMOOTH AREA CHART ══════════════════════════ */
function SmoothAreaChart({ data, h = 200, w = 640 }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 600); }, []);
    if (!data || data.length === 0) return null;
    const pad = { t: 20, r: 20, b: 30, l: 36 };
    const cw = w - pad.l - pad.r;
    const ch = h - pad.t - pad.b;
    const maxVal = Math.max(...data.map(d => d.value)) * 1.25 || 1;
    const pts = data.map((d, i) => ({
        x: pad.l + (i / (data.length - 1)) * cw,
        y: pad.t + ch - (d.value / maxVal) * ch,
    }));
    const curve = pts.map((p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const prev = pts[i - 1]; const cx = (prev.x + p.x) / 2;
        return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    }).join(" ");
    const area = curve + ` L${pts[pts.length - 1].x},${pad.t + ch} L${pts[0].x},${pad.t + ch} Z`;

    return (
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
            <defs>
                <linearGradient id="lightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 0.5, 1].map((p, i) => {
                const y = pad.t + ch * (1 - p);
                return <line key={i} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
            })}
            <path d={area} fill="url(#lightAreaGrad)" opacity={m ? 1 : 0} style={{ transition: "opacity 0.8s ease 0.4s" }} />
            <path d={curve} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray="1200" strokeDashoffset={m ? 0 : 1200}
                style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1) 0.3s" }} />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="white" stroke="#ef4444" strokeWidth="2"
                        opacity={m ? 1 : 0} style={{ transition: `opacity 0.3s ease ${1.2 + i * 0.1}s` }} />
                    <text x={p.x} y={h - 6} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="700">{data[i].label}</text>
                </g>
            ))}
        </svg>
    );
}

/* ══════════════════════════ DONUT CHART ══════════════════════════ */
function DonutChart({ segments, size = 160, sw = 16, center, sub }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 600); }, []);
    const r = (size - sw) / 2, circ = 2 * Math.PI * r;
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    let off = 0;
    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f8fafc" strokeWidth={sw} />
                {segments.map((seg, i) => {
                    const dash = (seg.value / total) * circ; const o = off; off += dash;
                    return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color}
                        strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={m ? -o : circ} strokeLinecap="round"
                        style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1) ${300 + i * 150}ms` }} />;
                })}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#1e293b" }}>{center}</span>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>{sub}</span>
            </div>
        </div>
    );
}

/* ══════════════════════════ DASHBOARD PAGE ══════════════════════════ */
export default function DashboardPage() {
    const navigate = useNavigate();
    const { user: currentDoctor, token } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());
    const [patients, setPatients] = useState([]);
    const [todayStats, setTodayStats] = useState({ total: 0, waiting: 0, completed: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [showIzinModal, setShowIzinModal] = useState(false);
    const [monthlyData, setMonthlyData] = useState([]);
    const [topDiagnoses, setTopDiagnoses] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [pendingResults, setPendingResults] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);
        const t = setInterval(() => setTime(new Date()), 1000);

        Promise.all([
            patientsApi.getAll(),
            appointmentsApi.getStats("week"),
            analyticsApi.getMonthlyPatients(),
            analyticsApi.getTopDiagnoses(),
            leaveRequestsApi.getMine(),
            appointmentsApi.getAll(),
            labResultsApi.getAll(),
            radiologyApi.getAll(),
            adminApi.getActiveAnnouncements(),
        ]).then(([pData, sData, monthly, diagnoses, leaves, appointments, labs, radios, activeAnons]) => {
            setPatients(pData);
            setTodayStats(sData);
            // Son 6 ayı al, label kısalt
            const last6 = monthly.slice(-6).map(m => ({
                label: m.month.split(" ")[0],
                value: m.count,
            }));
            setMonthlyData(last6);
            // İlk 5 tanıyı kullan
            setTopDiagnoses(diagnoses.slice(0, 5).map((d, i) => ({
                label: `T${String(i + 1).padStart(2, "0")}`,
                fullLabel: d.diagnosis,
                value: d.count,
            })));
            // Onaylı ve beklemedeki izinler
            setMyLeaves(leaves.filter(l => l.durum !== "Reddedildi").slice(0, 4));

            // Bugunun randevulari
            const todayObj = new Date();
            const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
            const normalized = appointments.map(a => {
                const patient = a.patientId && typeof a.patientId === 'object' ? a.patientId : null;
                return {
                    ...a,
                    id: a._id,
                    patientId: patient ? patient._id : a.patientId,
                    patientName: patient ? patient.name : (a.patientName || 'Bilinmeyen'),
                    age: patient ? patient.age : (a.age || ''),
                    gender: patient ? patient.gender : (a.gender || ''),
                    bloodType: patient ? patient.bloodType : (a.bloodType || ''),
                    date: a.date ? a.date.split('T')[0] : a.date,
                };
            }).filter(a => a.date === todayStr)
              .sort((a, b) => a.time.localeCompare(b.time));
            setTodayAppointments(normalized);

            // Sonuçlanan tahlil ve görüntüleme sonuçları
            const dismissedIds = JSON.parse(localStorage.getItem("dismissed_results") || "[]");

            const normalizedLabs = labs
                .filter(l => (l.status === "tamamlandı" || l.status === "anormal") && !dismissedIds.includes(l._id))
                .map(l => ({
                    ...l,
                    type: "lab",
                    patientName: l.patientId && typeof l.patientId === 'object' ? l.patientId.name : 'Bilinmeyen',
                    patientIdVal: l.patientId && typeof l.patientId === 'object' ? l.patientId._id : l.patientId,
                }));

            const normalizedRadios = radios
                .filter(r => (r.status === "tamamlandı" || r.status === "anormal") && !dismissedIds.includes(r._id))
                .map(r => ({
                    ...r,
                    type: "radiology",
                    patientName: r.patientId && typeof r.patientId === 'object' ? r.patientId.name : 'Bilinmeyen',
                    patientIdVal: r.patientId && typeof r.patientId === 'object' ? r.patientId._id : r.patientId,
                }));

            const combinedResults = [...normalizedLabs, ...normalizedRadios]
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

            setPendingResults(combinedResults);
            setAnnouncements(activeAnons || []);

            setLoading(false);
        }).catch(err => {
            console.error("Data load failed:", err);
            setLoading(false);
        });

        return () => clearInterval(t);
    }, []);

    const allDiseases = useMemo(() => patients.flatMap(p => p.diseases || []), [patients]);
    const dStats = useMemo(() => ({
        total: patients.length,
        active: allDiseases.filter(d => d.status === "tedavi").length,
        recovered: allDiseases.filter(d => d.status === "iyileşti").length,
        serious: allDiseases.filter(d => d.severity === "ciddi" && d.status === "tedavi").length
    }), [patients, allDiseases]);

    const activeCases = useMemo(() => {
        return patients.flatMap(p =>
            (p.diseases || [])
                .filter(d => d.status === "tedavi")
                .map(d => ({ ...d, patientName: p.name, patientId: p._id }))
        ).sort((a, b) => ({ ciddi: 1, orta: 2, hafif: 3 })[a.severity] - ({ ciddi: 1, orta: 2, hafif: 3 })[b.severity]);
    }, [patients]);

    const cTotal = useCounter(dStats.total, 1400, 300);
    const cActive = useCounter(dStats.active, 1400, 400);
    const cRecovered = useCounter(dStats.recovered, 1400, 500);
    const cSerious = useCounter(dStats.serious, 1400, 600);

    const handleExportAnalysis = () => {
        const rows = [
            ["Metrik", "Değer"],
            ["Toplam Hasta", dStats.total],
            ["Aktif Tedavi", dStats.active],
            ["İyileşen", dStats.recovered],
            ["Ciddi Vaka", dStats.serious],
            ["Bu Hafta Randevu", todayStats.total],
            ["Tamamlanan", todayStats.completed],
            ["Bekleyen", todayStats.waiting],
            ["İptal", todayStats.cancelled],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `meditrack_analiz_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleUpdateStatus = async (aptId, newStatus) => {
        try {
            await appointmentsApi.update(aptId, { status: newStatus });
            const [data, stats] = await Promise.all([
                appointmentsApi.getAll(),
                appointmentsApi.getStats("week")
            ]);
            setTodayStats(stats);
            const todayObj = new Date();
            const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
            const normalized = data.map(a => {
                const patient = a.patientId && typeof a.patientId === 'object' ? a.patientId : null;
                return {
                    ...a,
                    id: a._id,
                    patientId: patient ? patient._id : a.patientId,
                    patientName: patient ? patient.name : (a.patientName || 'Bilinmeyen'),
                    age: patient ? patient.age : (a.age || ''),
                    gender: patient ? patient.gender : (a.gender || ''),
                    bloodType: patient ? patient.bloodType : (a.bloodType || ''),
                    date: a.date ? a.date.split('T')[0] : a.date,
                };
            }).filter(a => a.date === todayStr)
              .sort((a, b) => a.time.localeCompare(b.time));
            setTodayAppointments(normalized);
        } catch (err) {
            console.error("Durum güncellenemedi:", err);
        }
    };

    const handleDismissResult = (id) => {
        const dismissedIds = JSON.parse(localStorage.getItem("dismissed_results") || "[]");
        dismissedIds.push(id);
        localStorage.setItem("dismissed_results", JSON.stringify(dismissedIds));
        setPendingResults(prev => prev.filter(r => r._id !== id));
    };

    const cardStyle = (delay = 0) => ({
        background: "white",
        borderRadius: "24px",
        padding: "24px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
    });

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#ef4444", animation: "spin 0.8s linear infinite" }} />
                <div style={{ marginTop: "16px", color: "#ef4444", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", fontSize: "12px" }}>Güvenli Bağlantı Kuruluyor</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh", background: "#f8fafc", color: "#0f172a",
            padding: "32px", position: "relative", overflow: "hidden",
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* ═══ SOFT LIGHT GRADIENTS ═══ */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `
                    radial-gradient(circle at 10% 10%, rgba(239, 68, 68, 0.03) 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(220, 38, 38, 0.03) 0%, transparent 40%)
                `,
                zIndex: 0, pointerEvents: "none"
            }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: "1500px", margin: "0 auto" }}>

                {/* ═══ HEADER ═══ */}
                <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
                            <FiCpu /> SİSTEM: KLİNİK YÖNETİMİ
                        </div>
                        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px", color: "#1e293b", letterSpacing: "-0.03em" }}>
                            Hoş Geldiniz, <span style={{ color: "#ef4444" }}>Dr. {currentDoctor.name.split(" ").slice(1).join(" ")}</span>
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                            Bu hafta <span style={{ color: "#334155", fontWeight: 700 }}>{todayStats.total} randevu</span> planlandı
                            {todayStats.completed > 0 && <>, <span style={{ color: "#10b981", fontWeight: 700 }}>{todayStats.completed} tamamlandı</span></>}.
                            {dStats.serious > 0 && <> <span style={{ color: "#ef4444", fontWeight: 700 }}>{dStats.serious} kritik vaka</span> takipte.</>}
                        </p>
                    </div>
                    <div style={{
                        padding: "10px 20px", background: "white",
                        borderRadius: "16px", border: "1px solid #f1f5f9",
                        display: "flex", alignItems: "center", gap: "10px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)"
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.3)" }} />
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                </header>

                {/* ═══ STAT CARDS ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" }}>
                    {[
                        { label: "Toplam Hasta", val: cTotal, icon: <FiUsers />, color: "#ef4444" },
                        { label: "Aktif Tedavi", val: cActive, icon: <RiHeartPulseLine />, color: "#10b981" },
                        { label: "İyileşen", val: cRecovered, icon: <FiCheckCircle />, color: "#ec4899" },
                        { label: "Ciddi Vaka", val: cSerious, icon: <RiAlertLine />, color: "#f43f5e" },
                    ].map((s, i) => (
                        <div key={i} style={cardStyle(i * 80)}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                <div style={{
                                    width: "40px", height: "40px", borderRadius: "12px",
                                    background: `${s.color}08`, color: s.color, display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: "18px",
                                    border: `1px solid ${s.color}15`
                                }}>
                                    {s.icon}
                                </div>
                                <AreaSpark data={[4, 6, 5, 8, 7, 9, 8, 10]} color={s.color} w={70} h={30} />
                            </div>
                            <div style={{ fontSize: "32px", fontWeight: 800, color: "#1e293b", fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ═══ MAIN SECTION ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.3fr 1.2fr", gap: "20px", marginBottom: "24px" }}>
                    <div style={cardStyle(350)}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "32px", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiActivity style={{ color: "#ef4444" }} /> Hasta Kayıt İstatistiği
                        </h3>
                        <div style={{ height: "280px" }}>
                            <SmoothAreaChart data={monthlyData} />
                        </div>
                    </div>

                    <div style={cardStyle(400, { display: "flex", flexDirection: "column" })}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <FiCalendar style={{ color: "#ef4444" }} /> Bugünün Programı
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "8px" }}>
                                {todayAppointments.length} Randevu
                            </span>
                        </h3>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "280px", paddingRight: "4px" }}>
                            {todayAppointments.length > 0 ? (
                                todayAppointments.map((apt) => {
                                    const isWaiting = apt.status === "bekliyor";
                                    const isCompleted = apt.status === "tamamlandı";
                                    const isCancelled = apt.status === "iptal";
                                    
                                    const statusBg = isCompleted ? "#ecfdf5" : isCancelled ? "#fef2f2" : "#fffbeb";
                                    const statusColor = isCompleted ? "#10b981" : isCancelled ? "#ef4444" : "#d97706";
                                    const statusLabel = isCompleted ? "Tamamlandı" : isCancelled ? "İptal" : "Bekliyor";

                                    return (
                                        <div key={apt.id} style={{
                                            padding: "12px 14px", background: "#f8fafc",
                                            borderRadius: "16px", border: "1px solid #f1f5f9",
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            transition: "all 0.2s ease"
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span 
                                                        onClick={() => navigate(`/patients/${apt.patientId}`)}
                                                        style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}
                                                    >
                                                        {apt.patientName}
                                                    </span>
                                                    <span style={{
                                                        padding: "2px 6px", borderRadius: "6px", fontSize: "9px", fontWeight: 700,
                                                        background: "#eff6ff", color: "#3b82f6"
                                                    }}>{apt.type}</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                                                    <FiClock size={11} style={{ color: "#ef4444" }} />
                                                    <strong style={{ color: "#ef4444" }}>{apt.time}</strong>
                                                    <span>• {apt.duration} dk</span>
                                                    {apt.room && <span>• {apt.room}</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{
                                                    padding: "4px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: 700,
                                                    background: statusBg, color: statusColor
                                                }}>{statusLabel}</span>
                                                {isWaiting && (
                                                    <div style={{ display: "flex", gap: "4px" }}>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(apt.id, "tamamlandı")}
                                                            title="Tamamla"
                                                            style={{
                                                                width: "26px", height: "26px", borderRadius: "50%", background: "#ecfdf5", border: "1px solid #a7f3d0",
                                                                color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px"
                                                            }}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(apt.id, "iptal")}
                                                            title="İptal Et"
                                                            style={{
                                                                width: "26px", height: "26px", borderRadius: "50%", background: "#fef2f2", border: "1px solid #fecaca",
                                                                color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px"
                                                            }}
                                                        >
                                                            ✗
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                                    <span style={{ fontSize: "36px", marginBottom: "8px" }}>📅</span>
                                    <div style={{ fontSize: "13px", fontWeight: 600 }}>Bugün randevunuz bulunmuyor</div>
                                    <div style={{ fontSize: "11px", marginTop: "2px" }}>Kayıtlı randevularınız burada listelenecektir</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={cardStyle(450, { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" })}>
                        <h3 style={{ width: "100%", fontSize: "16px", fontWeight: 700, marginBottom: "32px", color: "#1e293b" }}>İyileşme Başarısı</h3>
                        <HeroRing value={dStats.recovered} max={allDiseases.length} size={180} />
                        <div style={{ marginTop: "32px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "4px" }}>TAMAMLANAN</div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: "#10b981" }}>{dStats.recovered}</div>
                            </div>
                            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "4px" }}>GÜNCEL</div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: "#ef4444" }}>{dStats.active}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ LOWER SECTION ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr", gap: "20px" }}>
                    <div style={cardStyle(550)}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiAlertTriangle style={{ color: "#f43f5e" }} /> Kritik Hastalar
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {activeCases.slice(0, 4).map((d, i) => (
                                <div key={i} style={{
                                    padding: "14px", background: "#f8fafc",
                                    borderRadius: "16px", border: "1px solid #f1f5f9",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    cursor: "pointer", transition: "all 0.2s ease"
                                }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "#f1f5f9"}
                                    onClick={() => navigate(`/patients/${d.patientId}`)}
                                >
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#334155" }}>{d.patientName}</div>
                                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{d.name}</div>
                                    </div>
                                    <div style={{
                                        padding: "4px 8px", borderRadius: "6px",
                                        fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
                                        background: d.severity === "ciddi" ? "#fef2f2" : "#fffbeb",
                                        color: d.severity === "ciddi" ? "#ef4444" : "#f59e0b"
                                    }}>
                                        {d.severity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={cardStyle(650)}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <FiDroplet style={{ color: "#6366f1" }} /> Sonuçlanan Testler
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "8px" }}>
                                {pendingResults.length} Yeni
                            </span>
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "250px", paddingRight: "4px" }}>
                            {pendingResults.length > 0 ? (
                                pendingResults.map((res) => {
                                    const isLab = res.type === "lab";
                                    const isAbnormal = res.status === "anormal";
                                    const dateStr = new Date(res.date || res.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

                                    return (
                                        <div key={res._id} style={{
                                            padding: "12px 14px", background: isAbnormal ? "#fff5f5" : "#f8fafc",
                                            borderRadius: "16px", border: `1px solid ${isAbnormal ? "#fecaca" : "#f1f5f9"}`,
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            transition: "all 0.2s ease"
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{res.patientName}</span>
                                                    <span style={{
                                                        padding: "1px 5px", borderRadius: "4px", fontSize: "8px", fontWeight: 700,
                                                        background: isLab ? "#e0e7ff" : "#fae8ff",
                                                        color: isLab ? "#4f46e5" : "#d946ef"
                                                    }}>{isLab ? "Lab" : "Radyoloji"}</span>
                                                </div>
                                                <div style={{ fontSize: "12px", fontWeight: 600, color: isAbnormal ? "#dc2626" : "#475569", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {isLab ? res.testName : `${res.imagingType} - ${res.bodyPart}`}
                                                </div>
                                                <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                                                    {dateStr} • {isLab ? `${res.results?.length || 0} Parametre` : (res.impression ? `${res.impression.substring(0, 20)}...` : "Bulgu girildi")}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                {isAbnormal && (
                                                    <span style={{
                                                        padding: "3px 6px", borderRadius: "6px", fontSize: "8px", fontWeight: 800,
                                                        background: "#fee2e2", color: "#ef4444"
                                                    }}>ANORMAL</span>
                                                )}
                                                <button
                                                    onClick={() => handleDismissResult(res._id)}
                                                    title="İnceledim"
                                                    style={{
                                                        background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
                                                        padding: "6px", borderRadius: "8px", transition: "all 0.2s",
                                                        display: "flex", alignItems: "center", justifyContent: "center"
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = "#10b981"; e.currentTarget.style.background = "#ecfdf5"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "none"; }}
                                                >
                                                    <FiCheckCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", textAlign: "center", padding: "30px 20px" }}>
                                    <span style={{ fontSize: "36px", marginBottom: "8px" }}>🔬</span>
                                    <div style={{ fontSize: "13px", fontWeight: 600 }}>İnceleme bekleyen test yok</div>
                                    <div style={{ fontSize: "11px", marginTop: "2px" }}>Tüm sonuçlar incelenmiş ve onaylanmış durumda</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={cardStyle(750)}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", color: "#1e293b" }}>Hızlı Eylemler</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {[
                                { icon: <FiPlus />, label: "Hasta", path: "/patients", color: "#ef4444" },
                                { icon: <FiCalendar />, label: "Takvim", path: "/appointments", color: "#10b981" },
                                { icon: <FiFileText />, label: "Raporlar", path: "/medical-reports", color: "#f87171" },
                                { icon: <FiSettings />, label: "Profil", path: "/profile", color: "#64748b" },
                            ].map((t, i) => (
                                <div key={i} onClick={() => navigate(t.path)} style={{
                                    aspectRatio: "1/1", background: "#f8fafc",
                                    borderRadius: "16px", display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", gap: "10px",
                                    border: "1px solid #f1f5f9", cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none"; }}
                                >
                                    <div style={{ fontSize: "20px", color: t.color }}>{t.icon}</div>
                                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{t.label}</span>
                                </div>
                            ))}
                        </div>
                        {/* İzin Talebi Butonu */}
                        <div onClick={() => setShowIzinModal(true)} style={{
                            marginTop: 12, padding: "14px 16px",
                            background: "linear-gradient(135deg,#fef2f2,#fff7ed)",
                            border: "1px solid #fecaca", borderRadius: 16,
                            display: "flex", alignItems: "center", gap: 10,
                            cursor: "pointer", transition: "all 0.2s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.12)"}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                        >
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏖️</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>İzin Talebi Oluştur</div>
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>İK birimine ilet</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ LEAVE / SCHEDULE SECTION ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.3fr 1.3fr", gap: "20px", marginTop: "24px" }}>
                    <div style={cardStyle(850)}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiClock style={{ color: "#8b5cf6" }} /> İzin Taleplerim
                        </h3>
                        {myLeaves.length > 0 ? (
                            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px" }}>
                                {myLeaves.map((lv, i) => {
                                    const statusColor = lv.durum === "Onaylı" ? "#10b981" : "#f59e0b";
                                    const bas = new Date(lv.baslangic).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                                    const bit = new Date(lv.bitis).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                                    return (
                                        <div key={i} style={{
                                            minWidth: "220px", padding: "16px", borderRadius: "16px",
                                            border: `1px solid ${statusColor}30`,
                                            background: `linear-gradient(135deg, white, ${statusColor}05)`,
                                            position: "relative", overflow: "hidden", flexShrink: 0
                                        }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: statusColor }} />
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>{lv.tip}</div>
                                                <span style={{ padding: "3px 8px", borderRadius: "8px", background: `${statusColor}15`, color: statusColor, fontSize: "10px", fontWeight: 700 }}>
                                                    {lv.durum}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                                <FiClock size={11} /> {bas} — {bit}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{lv.gun} gün</div>
                                            {lv.aciklama && <div style={{ fontSize: "11px", color: "#64748b", marginTop: 6, fontStyle: "italic" }}>{lv.aciklama}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8" }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🏖️</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>Aktif izin talebiniz bulunmuyor</div>
                                <div style={{ fontSize: 11, marginTop: 4 }}>Yeni talep için aşağıdaki butonu kullanın</div>
                            </div>
                        )}
                    </div>

                    <div style={cardStyle(865)}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <FiBell style={{ color: "#ef4444" }} /> Hastane Duyuruları
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "8px" }}>
                                {announcements.length} Aktif
                            </span>
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "170px", paddingRight: "4px" }}>
                            {announcements.length > 0 ? (
                                announcements.map((anon) => {
                                    const isCritical = anon.type === "critical";
                                    const isWarning = anon.type === "warning";
                                    const dateStr = new Date(anon.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

                                    const typeBg = isCritical ? "#fef2f2" : isWarning ? "#fffbeb" : "#eff6ff";
                                    const typeColor = isCritical ? "#ef4444" : isWarning ? "#d97706" : "#3b82f6";
                                    const typeBorder = isCritical ? "#fecaca" : isWarning ? "#fef3c7" : "#bfdbfe";
                                    const typeLabel = isCritical ? "Kritik" : isWarning ? "Uyarı" : "Bilgi";

                                    return (
                                        <div 
                                            key={anon._id} 
                                            onClick={() => setSelectedAnnouncement(anon)}
                                            style={{
                                                padding: "10px 12px", background: "#f8fafc",
                                                borderRadius: "14px", border: "1px solid #f1f5f9",
                                                cursor: "pointer", transition: "all 0.2s ease"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "white"; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "#f8fafc"; }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "6px" }}>{anon.title}</span>
                                                <span style={{
                                                    padding: "1px 5px", borderRadius: "4px", fontSize: "8px", fontWeight: 800,
                                                    background: typeBg, color: typeColor, border: `1px solid ${typeBorder}`, flexShrink: 0
                                                }}>{typeLabel}</span>
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.4" }}>
                                                {anon.message}
                                            </div>
                                            <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px", textAlign: "right" }}>
                                                {dateStr}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "130px", color: "#94a3b8", textAlign: "center", padding: "10px" }}>
                                    <span style={{ fontSize: "24px", marginBottom: "6px" }}>📢</span>
                                    <div style={{ fontSize: "12px", fontWeight: 600 }}>Duyuru bulunmuyor</div>
                                    <div style={{ fontSize: "10px", marginTop: "2px" }}>Aktif duyuru yok</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={cardStyle(880)}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>Tanı Dağılımı</h3>
                        {topDiagnoses.length > 0 ? (
                            <>
                                <VBarChart data={topDiagnoses} height={160} />
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                                    {topDiagnoses.map((d, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                                            <span style={{ fontWeight: 600 }}>{d.label}</span>
                                            <span style={{ color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.fullLabel}</span>
                                            <span style={{ fontWeight: 700, color: "#ef4444" }}>{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>Reçete verisi yok</div>
                        )}
                    </div>
                </div>

                {/* ═══ FOOTER ═══ */}
                <footer style={{
                    marginTop: "40px", padding: "24px 32px",
                    background: "white", borderRadius: "24px",
                    border: "1px solid #f1f5f9", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                }}>
                    <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>MediTrack v2.4 Premium</h4>
                        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                            HIPAA standartlarında veri güvenliği. Son kontrol: {time.toLocaleDateString()}.
                        </p>
                    </div>
                    <button onClick={handleExportAnalysis} style={{
                        padding: "10px 24px", background: "#ef4444", color: "white", fontWeight: 700,
                        border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "13px",
                        boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.2)",
                        display: "flex", alignItems: "center", gap: 6
                    }}>
                        📊 Analiz İndir (CSV)
                    </button>
                </footer>
            </div>
            {showIzinModal && <IzinTalebiModal token={token} onClose={() => setShowIzinModal(false)} />}
            
            {/* ═══ ANNOUNCEMENT DETAIL MODAL ═══ */}
            {selectedAnnouncement && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.3)",
                    backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 1000,
                    animation: "fadeIn 0.2s ease-out"
                }} onClick={() => setSelectedAnnouncement(null)}>
                    <div style={{
                        background: "white", borderRadius: "24px", padding: "32px",
                        width: "100%", maxWidth: "500px", border: "1px solid #f1f5f9",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        position: "relative", transform: "scale(1)", transition: "transform 0.2s"
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div>
                                <span style={{
                                    padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800,
                                    background: selectedAnnouncement.type === "critical" ? "#fef2f2" : selectedAnnouncement.type === "warning" ? "#fffbeb" : "#eff6ff",
                                    color: selectedAnnouncement.type === "critical" ? "#ef4444" : selectedAnnouncement.type === "warning" ? "#d97706" : "#3b82f6",
                                    border: `1px solid ${selectedAnnouncement.type === "critical" ? "#fecaca" : selectedAnnouncement.type === "warning" ? "#fef3c7" : "#bfdbfe"}`
                                }}>
                                    {selectedAnnouncement.type === "critical" ? "Kritik Duyuru" : selectedAnnouncement.type === "warning" ? "Önemli Uyarı" : "Duyuru"}
                                </span>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginTop: "12px" }}>{selectedAnnouncement.title}</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedAnnouncement(null)}
                                style={{
                                    border: "none", background: "#f1f5f9", width: "32px", height: "32px",
                                    borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center",
                                    justifyContent: "center", color: "#64748b", transition: "all 0.2s"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", marginBottom: "24px" }}>
                            {selectedAnnouncement.message}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "16px", fontSize: "11px", color: "#94a3b8" }}>
                            <span>Yayınlayan: Başhekimlik</span>
                            <span>{new Date(selectedAnnouncement.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

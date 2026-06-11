import { useState, useMemo, useRef } from "react";
import {
    FiTrendingUp, FiTrendingDown, FiActivity, FiHeart, FiDroplet,
    FiAlertTriangle, FiCheckCircle, FiDownload, FiFilter, FiCalendar,
    FiBarChart2, FiPieChart, FiInfo, FiAward, FiZap, FiPlus, FiX
} from "react-icons/fi";
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, ReferenceLine
} from "recharts";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { patientPortalApi } from "../../services/patientPortalApi";

// ─── Vital type metadata ────────────────────────────────────────────────
const VITAL_META = {
    blood_pressure: { label: "Tansiyon", unit: "mmHg", color: "#e11d48", refMin: "90/60", refMax: "120/80", icon: "❤️" },
    blood_sugar: { label: "Kan Şekeri", unit: "mg/dL", color: "#f59e0b", refMin: 70, refMax: 100, icon: "🩸" },
    weight: { label: "Kilo", unit: "kg", color: "#8b5cf6", refMin: null, refMax: null, icon: "⚖️" },
    pulse: { label: "Nabız", unit: "bpm", color: "#ef4444", refMin: 60, refMax: 100, icon: "💓" },
    oxygen: { label: "Oksijen Satürasyonu", unit: "%", color: "#06b6d4", refMin: 95, refMax: 100, icon: "🫁" },
    temperature: { label: "Vücut Isısı", unit: "°C", color: "#f97316", refMin: 36.1, refMax: 37.2, icon: "🌡️" },
    cholesterol: { label: "Kolesterol", unit: "mg/dL", color: "#84cc16", refMin: null, refMax: 200, icon: "🧪" },
};

const VITAL_LABELS_EN = {
    blood_pressure: "Blood Pressure", blood_sugar: "Blood Sugar", weight: "Weight",
    pulse: "Heart Rate", oxygen: "Oxygen Saturation", temperature: "Body Temperature", cholesterol: "Cholesterol"
};

// ─── Helpers ────────────────────────────────────────────────────────────
function parseVitalValue(v) {
    if (!v) return null;
    if (typeof v === "number") return v;
    const s = v.toString().replace(",", ".");
    // For blood pressure, take systolic
    if (s.includes("/")) return parseFloat(s.split("/")[0]);
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
}

function getStatusColor(type, value) {
    const meta = VITAL_META[type];
    if (!meta || value === null) return "#64748b";
    if (type === "blood_pressure") {
        if (value < 90) return "#3b82f6";
        if (value <= 120) return "#10b981";
        if (value <= 140) return "#f59e0b";
        return "#ef4444";
    }
    if (meta.refMax !== null && value > meta.refMax) return "#ef4444";
    if (meta.refMin !== null && value < meta.refMin) return "#3b82f6";
    return "#10b981";
}

function getStatusLabel(type, value, lang) {
    const meta = VITAL_META[type];
    if (!meta || value === null) return lang === "tr" ? "Bilinmiyor" : "Unknown";
    if (type === "blood_pressure") {
        if (value < 90) return lang === "tr" ? "Düşük" : "Low";
        if (value <= 120) return lang === "tr" ? "Normal" : "Normal";
        if (value <= 140) return lang === "tr" ? "Yüksek Sınır" : "Elevated";
        return lang === "tr" ? "Yüksek" : "High";
    }
    if (meta.refMax !== null && value > meta.refMax) return lang === "tr" ? "Yüksek" : "High";
    if (meta.refMin !== null && value < meta.refMin) return lang === "tr" ? "Düşük" : "Low";
    return lang === "tr" ? "Normal" : "Normal";
}

function calcTrend(data) {
    if (data.length < 2) return 0;
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    if (!last || !prev) return 0;
    return ((last - prev) / Math.abs(prev || 1)) * 100;
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, theme }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: theme === "dark" ? "#1e293b" : "white",
            border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
            borderRadius: 12, padding: "12px 16px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)"
        }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ fontSize: 14, fontWeight: 800, color: p.color, margin: 0 }}>
                    {p.name}: <span style={{ color: theme === "dark" ? "white" : "#1e293b" }}>{p.value} {p.unit || ""}</span>
                </p>
            ))}
        </div>
    );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────
export default function HealthAnalytics({ historicalVitals, labResults, appointments, prescriptions, patientUser, theme, lang, onRefreshVitals }) {
    const [selectedVital, setSelectedVital] = useState("blood_pressure");
    const [timeRange, setTimeRange] = useState("all"); // "1m" | "3m" | "6m" | "all"
    const [chartType, setChartType] = useState("area"); // "area" | "line" | "bar"
    const [activeSection, setActiveSection] = useState("vitals"); // "vitals" | "labs" | "overview"
    const [showAddModal, setShowAddModal] = useState(false);
    const [vitalForm, setVitalForm] = useState({
        type: "blood_pressure",
        value: "",
        unit: "mmHg",
        date: new Date().toISOString().substring(0, 10),
        notes: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const pdfRef = useRef(null);

    const t = (tr, en) => lang === "tr" ? tr : en;

    const handleOpenAddModal = () => {
        setVitalForm({
            type: selectedVital,
            value: "",
            unit: VITAL_META[selectedVital]?.unit || "mmHg",
            date: new Date().toISOString().substring(0, 10),
            notes: ""
        });
        setErrorMsg("");
        setShowAddModal(true);
    };

    const handleSaveVital = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");
        try {
            await patientPortalApi.addVital(vitalForm);
            setShowAddModal(false);
            if (onRefreshVitals) {
                await onRefreshVitals();
            }
        } catch (err) {
            setErrorMsg(err.error || err.message || t("Kayıt sırasında bir hata oluştu.", "An error occurred during save."));
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Filter vitals by time range ──────────────────────────────────
    const filterByTime = (arr, dateKey = "date") => {
        if (timeRange === "all") return arr;
        const now = new Date();
        const months = timeRange === "1m" ? 1 : timeRange === "3m" ? 3 : 6;
        const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
        return arr.filter(item => new Date(item[dateKey]) >= cutoff);
    };

    // ─── Per-vital chart data ─────────────────────────────────────────
    const vitalChartData = useMemo(() => {
        const filtered = filterByTime(historicalVitals || []);
        const byType = {};
        Object.keys(VITAL_META).forEach(type => {
            const items = filtered
                .filter(v => v.type === type)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(v => {
                    const numVal = parseVitalValue(v.value);
                    return {
                        date: new Date(v.date).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "2-digit" }),
                        fullDate: new Date(v.date).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US"),
                        value: numVal,
                        rawValue: v.value,
                        systolic: type === "blood_pressure" ? parseFloat(v.value?.split("/")[0] || 0) : undefined,
                        diastolic: type === "blood_pressure" ? parseFloat(v.value?.split("/")[1] || 0) : undefined,
                        notes: v.notes,
                    };
                });
            byType[type] = items;
        });
        return byType;
    }, [historicalVitals, timeRange, lang]);

    // ─── Summary cards ────────────────────────────────────────────────
    const summaryCards = useMemo(() => {
        return Object.keys(VITAL_META).map(type => {
            const data = vitalChartData[type] || [];
            const latest = data[data.length - 1];
            const latestVal = latest ? parseVitalValue(latest.rawValue || latest.value) : null;
            const values = data.map(d => d.value).filter(v => v !== null);
            const trend = calcTrend(values);
            const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
            const statusColor = getStatusColor(type, latestVal);
            const statusLabel = getStatusLabel(type, latestVal, lang);
            const meta = VITAL_META[type];
            return { type, meta, latestVal, latest, trend, avg, statusColor, statusLabel, count: data.length };
        });
    }, [vitalChartData, lang]);

    // ─── Lab trend data ───────────────────────────────────────────────
    const labChartData = useMemo(() => {
        const filtered = filterByTime(labResults || []);
        const params = {};
        filtered.forEach(lr => {
            (lr.results || []).forEach(r => {
                const num = parseFloat(r.value?.toString().replace(",", "."));
                if (isNaN(num)) return;
                if (!params[r.parameter]) params[r.parameter] = [];
                params[r.parameter].push({
                    date: new Date(lr.date).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "2-digit" }),
                    fullDate: new Date(lr.date).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US"),
                    value: num,
                    unit: r.unit,
                    status: r.status,
                });
            });
        });
        // Sort each param by date
        Object.keys(params).forEach(k => {
            params[k].sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
        });
        return params;
    }, [labResults, timeRange, lang]);

    // ─── Radar overview data ──────────────────────────────────────────
    const radarData = useMemo(() => {
        return summaryCards.map(card => ({
            subject: lang === "tr" ? card.meta.label : (VITAL_LABELS_EN[card.type] || card.meta.label),
            score: card.latestVal !== null
                ? (card.statusColor === "#10b981" ? 100 : card.statusColor === "#f59e0b" ? 60 : 30)
                : 0,
            fullMark: 100,
        }));
    }, [summaryCards, lang]);

    // ─── Appointment stats ────────────────────────────────────────────
    const apptStats = useMemo(() => {
        const filtered = filterByTime(appointments || []);
        const completed = filtered.filter(a => a.status === "tamamlandı").length;
        const pending = filtered.filter(a => a.status === "bekliyor").length;
        const cancelled = filtered.filter(a => a.status === "iptal").length;
        return { completed, pending, cancelled, total: filtered.length };
    }, [appointments, timeRange]);

    // ─── Specialty distribution ───────────────────────────────────────
    const specialtyDist = useMemo(() => {
        const map = {};
        (appointments || []).forEach(a => {
            const spec = a.doctorId?.specialty || (lang === "tr" ? "Diğer" : "Other");
            map[spec] = (map[spec] || 0) + 1;
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, count]) => ({ name, count }));
    }, [appointments, lang]);

    // ─── Wellness score ───────────────────────────────────────────────
    const wellnessScore = useMemo(() => {
        let score = 0;
        const normalCount = summaryCards.filter(c => c.statusColor === "#10b981" && c.count > 0).length;
        const trackedTypes = summaryCards.filter(c => c.count > 0).length;
        score += Math.min(normalCount * 15, 45);
        score += Math.min(trackedTypes * 8, 32);
        score += Math.min((apptStats.completed) * 6, 23);
        return Math.min(score, 100);
    }, [summaryCards, apptStats]);

    const scoreColor = wellnessScore >= 80 ? "#10b981" : wellnessScore >= 60 ? "#f59e0b" : "#ef4444";
    const scoreLabel = wellnessScore >= 80
        ? t("Mükemmel", "Excellent")
        : wellnessScore >= 60
            ? t("İyi", "Good")
            : t("Geliştirilmeli", "Needs Work");

    // ─── PDF Export ───────────────────────────────────────────────────
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const now = new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US");

        // Header
        doc.setFillColor(190, 18, 60);
        doc.rect(0, 0, 210, 36, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("MediTrack", 20, 18);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(t("Sağlık Analitik Raporu", "Health Analytics Report"), 20, 28);
        doc.text(now, 170, 18);

        // Patient info
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(t("Hasta Bilgileri", "Patient Info"), 20, 52);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`${t("Ad Soyad", "Name")}: ${patientUser?.name || "---"}`, 20, 62);
        doc.text(`${t("Yaş", "Age")}: ${patientUser?.age || "---"}`, 20, 70);
        doc.text(`${t("Kan Grubu", "Blood Type")}: ${patientUser?.bloodType || "---"}`, 100, 62);
        doc.text(`${t("Sağlık Skoru", "Wellness Score")}: ${wellnessScore}/100 (${scoreLabel})`, 100, 70);

        // Vital summary table
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(t("Vital Özeti", "Vitals Summary"), 20, 88);

        const vitalRows = summaryCards.filter(c => c.count > 0).map(c => [
            lang === "tr" ? c.meta.label : (VITAL_LABELS_EN[c.type] || c.meta.label),
            c.latest?.rawValue || c.latestVal || "---",
            c.meta.unit,
            c.avg || "---",
            c.statusLabel,
            c.count,
        ]);

        doc.autoTable({
            head: [[
                t("Ölçüm", "Metric"),
                t("Son Değer", "Latest"),
                t("Birim", "Unit"),
                t("Ortalama", "Average"),
                t("Durum", "Status"),
                t("Kayıt", "Records"),
            ]],
            body: vitalRows,
            startY: 95,
            theme: "grid",
            headStyles: { fillColor: [190, 18, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 20, right: 20 },
        });

        const afterVitals = doc.autoTable.previous.finalY + 16;

        // Appointment stats
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(t("Randevu İstatistikleri", "Appointment Stats"), 20, afterVitals);

        doc.autoTable({
            head: [[t("Tamamlanan", "Completed"), t("Bekleyen", "Pending"), t("İptal", "Cancelled"), t("Toplam", "Total")]],
            body: [[apptStats.completed, apptStats.pending, apptStats.cancelled, apptStats.total]],
            startY: afterVitals + 7,
            theme: "grid",
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            bodyStyles: { fontSize: 10, fontStyle: "bold" },
            margin: { left: 20, right: 20 },
        });

        // Footer
        const pageH = doc.internal.pageSize.height;
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`MediTrack © ${new Date().getFullYear()} — ${t("Bu rapor bilgilendirme amaçlıdır.", "This report is for informational purposes.")}`, 20, pageH - 10);

        doc.save(`MediTrack_SaglikRaporu_${patientUser?.name?.replace(/\s+/g, "_") || "Hasta"}_${now.replace(/\//g, "-")}.pdf`);
    };

    // ─── Current vital chart data ─────────────────────────────────────
    const currentData = vitalChartData[selectedVital] || [];
    const currentMeta = VITAL_META[selectedVital];
    const isBP = selectedVital === "blood_pressure";

    const SECTION_BG = theme === "dark" ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.9)";
    const BORDER_COL = theme === "dark" ? "#334155" : "#e2e8f0";
    const TEXT_COL = theme === "dark" ? "#f8fafc" : "#1e293b";
    const MUTED_COL = "#64748b";

    // ─── Render ───────────────────────────────────────────────────────
    return (
        <div style={{ animation: "fadeIn 0.5s ease", fontFamily: "'Outfit', sans-serif" }}>

            {/* ── Hero Banner ── */}
            <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                borderRadius: 32, padding: "40px 48px", marginBottom: 32,
                position: "relative", overflow: "hidden",
                boxShadow: "0 20px 40px -10px rgba(15,23,42,0.4)"
            }}>
                <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: "-30%", left: "20%", width: 300, height: 300, background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />

                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, background: "rgba(225,29,72,0.15)", width: "fit-content", padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(225,29,72,0.2)" }}>
                            <FiBarChart2 size={14} color="#f43f5e" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#f43f5e", letterSpacing: "1px", textTransform: "uppercase" }}>
                                {t("Sağlık Analitiği", "Health Analytics")}
                            </span>
                        </div>
                        <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-1px" }}>
                            {t("Sağlık Raporunuz", "Your Health Report")}
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>
                            {t("Tüm sağlık verileriniz tek ekranda — grafikler, trendler ve AI analizleri.", "All your health data in one screen — charts, trends and AI insights.")}
                        </p>
                    </div>

                    {/* Wellness Score Ring */}
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                width: 110, height: 110,
                                borderRadius: "50%",
                                background: `conic-gradient(${scoreColor} ${wellnessScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                position: "relative",
                                boxShadow: `0 0 30px ${scoreColor}40`
                            }}>
                                <div style={{
                                    width: 86, height: 86, borderRadius: "50%",
                                    background: "#0f172a",
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                                }}>
                                    <span style={{ fontSize: 26, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{wellnessScore}</span>
                                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>/100</span>
                                </div>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: scoreColor }}>{scoreLabel}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{t("Sağlık Skoru", "Wellness Score")}</div>
                        </div>

                        {/* Add Vital button */}
                        <button
                            onClick={handleOpenAddModal}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "14px 22px", borderRadius: 16,
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "white", border: "none", cursor: "pointer",
                                fontWeight: 700, fontSize: 14,
                                boxShadow: "0 8px 20px rgba(16,185,129,0.4)",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <FiPlus size={16} />
                            {t("Ölçüm Ekle", "Add Vital")}
                        </button>

                        {/* Export button */}
                        <button
                            onClick={handleExportPDF}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "14px 22px", borderRadius: 16,
                                background: "linear-gradient(135deg, #be123c 0%, #9f1239 100%)",
                                color: "white", border: "none", cursor: "pointer",
                                fontWeight: 700, fontSize: 14,
                                boxShadow: "0 8px 20px rgba(190,18,60,0.4)",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <FiDownload size={16} />
                            {t("PDF İndir", "Export PDF")}
                        </button>
                    </div>
                </div>

                {/* Summary pills */}
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
                    {[
                        { label: t("Toplam Kayıt", "Total Records"), value: (historicalVitals || []).length, color: "#8b5cf6", icon: "📊" },
                        { label: t("Tahlil Sonucu", "Lab Results"), value: (labResults || []).length, color: "#06b6d4", icon: "🧪" },
                        { label: t("Randevu", "Appointments"), value: apptStats.total, color: "#f59e0b", icon: "📅" },
                        { label: t("Reçete", "Prescriptions"), value: (prescriptions || []).length, color: "#10b981", icon: "💊" },
                    ].map((pill, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 18px", borderRadius: 14,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            backdropFilter: "blur(8px)"
                        }}>
                            <span style={{ fontSize: 18 }}>{pill.icon}</span>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: pill.color, lineHeight: 1 }}>{pill.value}</div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{pill.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Controls Row ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
                {/* Section tabs */}
                <div style={{ display: "flex", gap: 6, background: SECTION_BG, padding: 6, borderRadius: 16, border: `1px solid ${BORDER_COL}` }}>
                    {[
                        { id: "vitals", label: t("Vitaller", "Vitals"), icon: <FiActivity size={14} /> },
                        { id: "labs", label: t("Tahliller", "Labs"), icon: <FiDroplet size={14} /> },
                        { id: "overview", label: t("Genel Bakış", "Overview"), icon: <FiPieChart size={14} /> },
                    ].map(s => (
                        <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 12, border: "none",
                            background: activeSection === s.id ? "#be123c" : "transparent",
                            color: activeSection === s.id ? "white" : MUTED_COL,
                            fontWeight: 700, fontSize: 13, cursor: "pointer",
                            transition: "all 0.25s",
                            boxShadow: activeSection === s.id ? "0 4px 12px rgba(190,18,60,0.35)" : "none"
                        }}>
                            {s.icon} {s.label}
                        </button>
                    ))}
                </div>

                {/* Time range */}
                <div style={{ display: "flex", gap: 6, background: SECTION_BG, padding: 6, borderRadius: 16, border: `1px solid ${BORDER_COL}` }}>
                    <FiCalendar size={14} color={MUTED_COL} style={{ alignSelf: "center", marginLeft: 6 }} />
                    {[
                        { id: "1m", label: t("1 Ay", "1M") },
                        { id: "3m", label: t("3 Ay", "3M") },
                        { id: "6m", label: t("6 Ay", "6M") },
                        { id: "all", label: t("Tümü", "All") },
                    ].map(r => (
                        <button key={r.id} onClick={() => setTimeRange(r.id)} style={{
                            padding: "7px 14px", borderRadius: 10, border: "none",
                            background: timeRange === r.id ? (theme === "dark" ? "#334155" : "#f1f5f9") : "transparent",
                            color: timeRange === r.id ? TEXT_COL : MUTED_COL,
                            fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s"
                        }}>{r.label}</button>
                    ))}
                </div>

                {/* Chart type (only vitals) */}
                {activeSection === "vitals" && (
                    <div style={{ display: "flex", gap: 6, background: SECTION_BG, padding: 6, borderRadius: 16, border: `1px solid ${BORDER_COL}` }}>
                        {[
                            { id: "area", icon: <FiTrendingUp size={14} /> },
                            { id: "bar", icon: <FiBarChart2 size={14} /> },
                        ].map(ct => (
                            <button key={ct.id} onClick={() => setChartType(ct.id)} style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 34, height: 34, borderRadius: 10, border: "none",
                                background: chartType === ct.id ? (theme === "dark" ? "#334155" : "#f1f5f9") : "transparent",
                                color: chartType === ct.id ? TEXT_COL : MUTED_COL,
                                cursor: "pointer", transition: "all 0.2s"
                            }}>{ct.icon}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* VITALS SECTION                                            */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeSection === "vitals" && (
                <div>
                    {/* Vital type selector cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14, marginBottom: 28 }}>
                        {summaryCards.map(card => (
                            <button key={card.type} onClick={() => setSelectedVital(card.type)} style={{
                                padding: "18px 20px", borderRadius: 20, border: `2px solid`,
                                borderColor: selectedVital === card.type ? card.meta.color : BORDER_COL,
                                background: selectedVital === card.type
                                    ? `${card.meta.color}12`
                                    : SECTION_BG,
                                cursor: "pointer", textAlign: "left",
                                transition: "all 0.25s",
                                boxShadow: selectedVital === card.type ? `0 0 20px ${card.meta.color}25` : "none"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                    <span style={{ fontSize: 22 }}>{card.meta.icon}</span>
                                    {card.count > 0 && (
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 100,
                                            background: `${card.statusColor}18`, color: card.statusColor
                                        }}>{card.statusLabel}</span>
                                    )}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                                    {lang === "tr" ? card.meta.label : (VITAL_LABELS_EN[card.type] || card.meta.label)}
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: card.count > 0 ? TEXT_COL : MUTED_COL }}>
                                    {card.latestVal !== null ? (card.latest?.rawValue || card.latestVal) : "—"}
                                    <span style={{ fontSize: 11, fontWeight: 600, color: MUTED_COL, marginLeft: 4 }}>{card.meta.unit}</span>
                                </div>
                                {card.count > 1 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                                        {card.trend > 0
                                            ? <FiTrendingUp size={12} color="#ef4444" />
                                            : <FiTrendingDown size={12} color="#10b981" />}
                                        <span style={{ fontSize: 11, fontWeight: 700, color: card.trend > 0 ? "#ef4444" : "#10b981" }}>
                                            {Math.abs(card.trend).toFixed(1)}%
                                        </span>
                                        <span style={{ fontSize: 10, color: MUTED_COL }}>{t("son değişim", "last change")}</span>
                                    </div>
                                )}
                                <div style={{ fontSize: 10, color: MUTED_COL, marginTop: 4 }}>
                                    {card.count} {t("kayıt", "records")}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Main chart */}
                    <div style={{ background: SECTION_BG, borderRadius: 28, padding: "32px", border: `1px solid ${BORDER_COL}`, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: currentMeta.color, boxShadow: `0 0 8px ${currentMeta.color}` }} />
                                    <span style={{ fontSize: 18, fontWeight: 800, color: TEXT_COL }}>
                                        {lang === "tr" ? currentMeta.label : (VITAL_LABELS_EN[selectedVital] || currentMeta.label)}
                                    </span>
                                    <span style={{ fontSize: 13, color: MUTED_COL, fontWeight: 600 }}>({currentMeta.unit})</span>
                                </div>
                                {currentData.length > 0 && (
                                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 12, color: MUTED_COL }}>
                                            <b style={{ color: TEXT_COL }}>{t("Son:", "Latest:")} </b>
                                            {currentData[currentData.length - 1]?.rawValue || currentData[currentData.length - 1]?.value} {currentMeta.unit}
                                        </span>
                                        <span style={{ fontSize: 12, color: MUTED_COL }}>
                                            <b style={{ color: TEXT_COL }}>{t("Ort:", "Avg:")} </b>
                                            {summaryCards.find(c => c.type === selectedVital)?.avg} {currentMeta.unit}
                                        </span>
                                        {currentMeta.refMax && (
                                            <span style={{ fontSize: 12, color: MUTED_COL }}>
                                                <b style={{ color: TEXT_COL }}>{t("Referans:", "Reference:")} </b>
                                                {currentMeta.refMin || 0}–{currentMeta.refMax} {currentMeta.unit}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {currentData.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 0", color: MUTED_COL }}>
                                <FiInfo size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                                <div style={{ fontSize: 15, fontWeight: 600 }}>
                                    {t("Bu dönem için veri bulunamadı.", "No data found for this period.")}
                                </div>
                                <div style={{ fontSize: 13, marginTop: 8, opacity: 0.6 }}>
                                    {t("Dashboard'dan sağlık verisi ekleyebilirsiniz.", "You can add health data from the Dashboard.")}
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                {chartType === "bar" ? (
                                    <BarChart data={currentData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"} />
                                        <XAxis dataKey="date" tick={{ fill: MUTED_COL, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: MUTED_COL, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip theme={theme} />} />
                                        {isBP ? (
                                            <>
                                                <Bar dataKey="systolic" name={t("Sistolik", "Systolic")} fill="#e11d48" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="diastolic" name={t("Diastolik", "Diastolic")} fill="#f43f5e99" radius={[6, 6, 0, 0]} />
                                            </>
                                        ) : (
                                            <Bar dataKey="value" name={lang === "tr" ? currentMeta.label : VITAL_LABELS_EN[selectedVital]} fill={currentMeta.color} radius={[6, 6, 0, 0]} />
                                        )}
                                        {!isBP && currentMeta.refMax && (
                                            <ReferenceLine y={currentMeta.refMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: t("Üst Sınır", "Upper Limit"), fill: "#ef4444", fontSize: 10 }} />
                                        )}
                                        {!isBP && currentMeta.refMin && (
                                            <ReferenceLine y={currentMeta.refMin} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: t("Alt Sınır", "Lower Limit"), fill: "#3b82f6", fontSize: 10 }} />
                                        )}
                                        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                                    </BarChart>
                                ) : (
                                    <AreaChart data={currentData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="vitalGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={currentMeta.color} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={currentMeta.color} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="vitalGrad2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"} />
                                        <XAxis dataKey="date" tick={{ fill: MUTED_COL, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: MUTED_COL, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip theme={theme} />} />
                                        {isBP ? (
                                            <>
                                                <Area type="monotone" dataKey="systolic" name={t("Sistolik", "Systolic")} stroke="#e11d48" strokeWidth={2.5} fill="url(#vitalGrad)" dot={{ r: 4, fill: "#e11d48" }} activeDot={{ r: 6 }} />
                                                <Area type="monotone" dataKey="diastolic" name={t("Diastolik", "Diastolic")} stroke="#f43f5e99" strokeWidth={2} fill="url(#vitalGrad2)" dot={{ r: 3, fill: "#f43f5e" }} activeDot={{ r: 5 }} />
                                            </>
                                        ) : (
                                            <Area type="monotone" dataKey="value" name={lang === "tr" ? currentMeta.label : VITAL_LABELS_EN[selectedVital]} stroke={currentMeta.color} strokeWidth={2.5} fill="url(#vitalGrad)" dot={{ r: 4, fill: currentMeta.color }} activeDot={{ r: 7 }} />
                                        )}
                                        {!isBP && currentMeta.refMax && (
                                            <ReferenceLine y={currentMeta.refMax} stroke="#ef4444" strokeDasharray="5 5" label={{ value: t("Üst Sınır", "Upper Limit"), fill: "#ef4444", fontSize: 10, position: "right" }} />
                                        )}
                                        {!isBP && currentMeta.refMin && (
                                            <ReferenceLine y={currentMeta.refMin} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: t("Alt Sınır", "Lower Limit"), fill: "#3b82f6", fontSize: 10, position: "right" }} />
                                        )}
                                        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Status cards row */}
                    {currentData.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginTop: 20 }}>
                            {[
                                { label: t("Son Ölçüm", "Latest"), value: currentData[currentData.length - 1]?.rawValue || currentData[currentData.length - 1]?.value, unit: currentMeta.unit, icon: <FiZap size={16} />, color: "#8b5cf6" },
                                { label: t("Ortalama", "Average"), value: summaryCards.find(c => c.type === selectedVital)?.avg, unit: currentMeta.unit, icon: <FiActivity size={16} />, color: "#06b6d4" },
                                { label: t("En Yüksek", "Maximum"), value: Math.max(...currentData.map(d => d.value || 0)), unit: currentMeta.unit, icon: <FiTrendingUp size={16} />, color: "#ef4444" },
                                { label: t("En Düşük", "Minimum"), value: Math.min(...currentData.filter(d => d.value > 0).map(d => d.value || 99999)), unit: currentMeta.unit, icon: <FiTrendingDown size={16} />, color: "#10b981" },
                            ].map((stat, i) => (
                                <div key={i} style={{
                                    background: SECTION_BG, borderRadius: 20, padding: "20px 24px",
                                    border: `1px solid ${BORDER_COL}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <div style={{ color: stat.color }}>{stat.icon}</div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</span>
                                    </div>
                                    <div style={{ fontSize: 26, fontWeight: 900, color: TEXT_COL }}>
                                        {typeof stat.value === "number" && !isNaN(stat.value) && stat.value !== 99999
                                            ? stat.value.toFixed ? stat.value.toFixed(1) : stat.value
                                            : stat.value || "—"}
                                        <span style={{ fontSize: 12, color: MUTED_COL, fontWeight: 600, marginLeft: 4 }}>{stat.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* LABS SECTION                                              */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeSection === "labs" && (
                <div>
                    {Object.keys(labChartData).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED_COL, background: SECTION_BG, borderRadius: 28, border: `1px solid ${BORDER_COL}` }}>
                            <FiDroplet size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                            <div style={{ fontSize: 16, fontWeight: 600 }}>{t("Bu dönem için tahlil sonucu bulunamadı.", "No lab results found for this period.")}</div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
                            {Object.entries(labChartData).map(([param, data]) => {
                                const lastVal = data[data.length - 1];
                                const values = data.map(d => d.value);
                                const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
                                const trend = calcTrend(values);
                                const COLORS = ["#e11d48", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f97316", "#3b82f6", "#ec4899"];
                                const col = COLORS[Object.keys(labChartData).indexOf(param) % COLORS.length];

                                return (
                                    <div key={param} style={{
                                        background: SECTION_BG, borderRadius: 24, padding: "24px",
                                        border: `1px solid ${BORDER_COL}`,
                                        transition: "all 0.2s"
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_COL }}>{param}</div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                                    <span style={{ fontSize: 11, color: MUTED_COL }}>{t("Ort:", "Avg:")} <b style={{ color: TEXT_COL }}>{avg} {lastVal?.unit}</b></span>
                                                    {data.length > 1 && (
                                                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: trend > 0 ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                                                            {trend > 0 ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                                                            {Math.abs(trend).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 22, fontWeight: 900, color: col }}>{lastVal?.value}</div>
                                                <div style={{ fontSize: 10, color: MUTED_COL }}>{lastVal?.unit}</div>
                                            </div>
                                        </div>

                                        <ResponsiveContainer width="100%" height={120}>
                                            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id={`lg-${param}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={col} stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor={col} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#f8fafc"} />
                                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: MUTED_COL }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 9, fill: MUTED_COL }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip theme={theme} />} />
                                                <Area type="monotone" dataKey="value" stroke={col} strokeWidth={2} fill={`url(#lg-${param})`} dot={{ r: 3, fill: col }} activeDot={{ r: 5 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>

                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                                            <span style={{ fontSize: 10, color: MUTED_COL }}>{data.length} {t("sonuç", "results")}</span>
                                            <span style={{ fontSize: 10, color: MUTED_COL }}>{lastVal?.fullDate}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* OVERVIEW SECTION                                          */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeSection === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                    {/* Radar chart */}
                    <div style={{ background: SECTION_BG, borderRadius: 28, padding: "28px", border: `1px solid ${BORDER_COL}` }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT_COL, margin: "0 0 20px" }}>
                            {t("Sağlık Radar Haritası", "Health Radar Map")}
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke={theme === "dark" ? "#334155" : "#e2e8f0"} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: MUTED_COL, fontSize: 10, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={t("Sağlık", "Health")} dataKey="score" stroke="#e11d48" fill="#e11d48" fillOpacity={0.2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Appointment stats */}
                    <div style={{ background: SECTION_BG, borderRadius: 28, padding: "28px", border: `1px solid ${BORDER_COL}` }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT_COL, margin: "0 0 20px" }}>
                            {t("Randevu Özeti", "Appointment Summary")}
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                            {[
                                { label: t("Tamamlanan", "Completed"), value: apptStats.completed, color: "#10b981", bg: "#f0fdf4" },
                                { label: t("Bekleyen", "Pending"), value: apptStats.pending, color: "#f59e0b", bg: "#fffbeb" },
                                { label: t("İptal Edilen", "Cancelled"), value: apptStats.cancelled, color: "#ef4444", bg: "#fef2f2" },
                                { label: t("Toplam", "Total"), value: apptStats.total, color: "#8b5cf6", bg: "#f5f3ff" },
                            ].map((s, i) => (
                                <div key={i} style={{ padding: "16px", borderRadius: 16, background: theme === "dark" ? "rgba(255,255,255,0.04)" : s.bg, border: `1px solid ${s.color}22` }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Specialty bar chart */}
                        {specialtyDist.length > 0 && (
                            <>
                                <div style={{ fontSize: 13, fontWeight: 700, color: MUTED_COL, marginBottom: 12 }}>{t("Branş Dağılımı", "Specialty Distribution")}</div>
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={specialtyDist} layout="vertical" margin={{ left: 10, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: MUTED_COL }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: MUTED_COL }} width={80} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip theme={theme} />} />
                                        <Bar dataKey="count" name={t("Randevu", "Appointments")} fill="#be123c" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </div>

                    {/* Vital status grid */}
                    <div style={{ background: SECTION_BG, borderRadius: 28, padding: "28px", border: `1px solid ${BORDER_COL}`, gridColumn: "1 / -1" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT_COL, margin: "0 0 20px" }}>
                            {t("Vital Durum Tablosu", "Vital Status Table")}
                        </h3>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                <thead>
                                    <tr>
                                        {[t("Ölçüm", "Metric"), t("Son Değer", "Latest"), t("Ortalama", "Average"), t("Referans", "Reference"), t("Durum", "Status"), t("Trend", "Trend"), t("Kayıt", "Records")].map(h => (
                                            <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: MUTED_COL, textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: 8 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryCards.map(card => (
                                        <tr key={card.type} style={{ background: theme === "dark" ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                                            <td style={{ padding: "12px 16px", borderRadius: "12px 0 0 12px", fontWeight: 700, color: TEXT_COL, fontSize: 13 }}>
                                                {card.meta.icon} {lang === "tr" ? card.meta.label : (VITAL_LABELS_EN[card.type] || card.meta.label)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontWeight: 800, color: TEXT_COL, fontSize: 14 }}>
                                                {card.latestVal !== null ? (card.latest?.rawValue || card.latestVal) : "—"}
                                                <span style={{ fontSize: 10, color: MUTED_COL, marginLeft: 4 }}>{card.meta.unit}</span>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: MUTED_COL, fontSize: 13 }}>
                                                {card.avg || "—"} <span style={{ fontSize: 10 }}>{card.meta.unit}</span>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: MUTED_COL, fontSize: 12 }}>
                                                {card.meta.refMin !== null || card.meta.refMax !== null
                                                    ? `${card.meta.refMin ?? "—"} – ${card.meta.refMax ?? "—"} ${card.meta.unit}`
                                                    : "—"}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {card.count > 0 ? (
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 100,
                                                        background: `${card.statusColor}18`, color: card.statusColor
                                                    }}>{card.statusLabel}</span>
                                                ) : <span style={{ color: MUTED_COL, fontSize: 12 }}>—</span>}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {card.count > 1 ? (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: card.trend > 0 ? "#ef4444" : "#10b981" }}>
                                                        {card.trend > 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                                                        {Math.abs(card.trend).toFixed(1)}%
                                                    </span>
                                                ) : <span style={{ color: MUTED_COL, fontSize: 12 }}>—</span>}
                                            </td>
                                            <td style={{ padding: "12px 16px", borderRadius: "0 12px 12px 0", color: MUTED_COL, fontSize: 12 }}>
                                                {card.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Vital Modal ── */}
            {showAddModal && (
                <div 
                    style={{ 
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                        background: theme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)", 
                        backdropFilter: "blur(8px)", zIndex: 10005, 
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" 
                    }} 
                    onClick={() => setShowAddModal(false)}
                >
                    <div 
                        style={{ 
                            background: theme === "dark" ? "#1e293b" : "white", 
                            width: "100%", maxWidth: "450px", 
                            borderRadius: "24px", padding: "32px", 
                            border: `1px solid ${BORDER_COL}`,
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" 
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: TEXT_COL, margin: 0 }}>
                                {t("Sağlık Verisi Ekle", "Add Vital Data")}
                            </h2>
                            <button 
                                onClick={() => setShowAddModal(false)} 
                                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED_COL, display: "flex", alignItems: "center" }}
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {errorMsg && (
                            <div style={{ 
                                display: "flex", alignItems: "center", gap: 8, 
                                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", 
                                color: "#ef4444", padding: "12px 16px", borderRadius: "12px", 
                                fontSize: "13px", fontWeight: 600, marginBottom: "20px" 
                            }}>
                                <FiAlertTriangle size={16} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveVital} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                    {t("VERİ TÜRÜ", "VITAL TYPE")}
                                </label>
                                <select
                                    style={{
                                        width: "100%", padding: "12px 16px", borderRadius: "12px",
                                        border: `1px solid ${BORDER_COL}`,
                                        background: theme === "dark" ? "#0f172a" : "white",
                                        color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                    }}
                                    value={vitalForm.type}
                                    onChange={e => {
                                        const type = e.target.value;
                                        const unit = VITAL_META[type]?.unit || "";
                                        setVitalForm({ ...vitalForm, type, unit });
                                    }}
                                >
                                    {Object.entries(VITAL_META).map(([key, meta]) => (
                                        <option key={key} value={key}>
                                            {meta.icon} {lang === "tr" ? meta.label : (VITAL_LABELS_EN[key] || meta.label)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                    {t(`DEĞER (${vitalForm.unit})`, `VALUE (${vitalForm.unit})`)}
                                </label>
                                <input
                                    type="text"
                                    required
                                    style={{
                                        width: "100%", padding: "12px 16px", borderRadius: "12px",
                                        border: `1px solid ${BORDER_COL}`,
                                        background: theme === "dark" ? "#0f172a" : "white",
                                        color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                    }}
                                    placeholder={vitalForm.type === "blood_pressure" ? "120/80" : t("Değer girin", "Enter value")}
                                    value={vitalForm.value}
                                    onChange={e => setVitalForm({ ...vitalForm, value: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                    {t("ÖLÇÜM TARİHİ", "DATE OF MEASUREMENT")}
                                </label>
                                <input
                                    type="date"
                                    required
                                    style={{
                                        width: "100%", padding: "12px 16px", borderRadius: "12px",
                                        border: `1px solid ${BORDER_COL}`,
                                        background: theme === "dark" ? "#0f172a" : "white",
                                        color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                    }}
                                    value={vitalForm.date}
                                    onChange={e => setVitalForm({ ...vitalForm, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                    {t("AÇIKLAMA / NOT", "NOTES")}
                                </label>
                                <input
                                    type="text"
                                    style={{
                                        width: "100%", padding: "12px 16px", borderRadius: "12px",
                                        border: `1px solid ${BORDER_COL}`,
                                        background: theme === "dark" ? "#0f172a" : "white",
                                        color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                    }}
                                    placeholder={vitalForm.type === "blood_pressure" ? t("Açlık/Tokluk, Dinlenme vb.", "Fasting/Full, Rest etc.") : t("Örn: Aç karnına, Spordan sonra", "e.g. Fasting, After workout")}
                                    value={vitalForm.notes}
                                    onChange={e => setVitalForm({ ...vitalForm, notes: e.target.value })}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                style={{ 
                                    width: "100%", padding: "14px", borderRadius: "14px", 
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                                    color: "white", border: "none", fontWeight: 700, 
                                    cursor: isSubmitting ? "not-allowed" : "pointer", 
                                    marginTop: "10px", opacity: isSubmitting ? 0.7 : 1,
                                    boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
                                    transition: "all 0.2s"
                                }}
                            >
                                {isSubmitting ? t("Kaydediliyor...", "Saving...") : t("Kaydet", "Save")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useMemo } from "react";
import {
    FiCalendar, FiFileText, FiDroplet, FiActivity, FiAward, FiZap,
    FiCheckCircle, FiInfo, FiChevronDown, FiChevronUp, FiX, FiFilter,
    FiTrendingUp, FiAlertCircle
} from "react-icons/fi";

const VITAL_META = {
    blood_pressure: { label: "Tansiyon", unit: "mmHg", icon: "❤️", color: "#e11d48" },
    blood_sugar: { label: "Kan Şekeri", unit: "mg/dL", icon: "🩸", color: "#f59e0b" },
    weight: { label: "Kilo", unit: "kg", icon: "⚖️", color: "#8b5cf6" },
    pulse: { label: "Nabız", unit: "bpm", icon: "💓", color: "#ef4444" },
    oxygen: { label: "Oksijen Satürasyonu", unit: "%", icon: "🫁", color: "#06b6d4" },
    temperature: { label: "Vücut Isısı", unit: "°C", icon: "🌡️", color: "#f97316" },
    cholesterol: { label: "Kolesterol", unit: "mg/dL", icon: "🧪", color: "#84cc16" },
};

const VITAL_LABELS_EN = {
    blood_pressure: "Blood Pressure",
    blood_sugar: "Blood Sugar",
    weight: "Weight",
    pulse: "Heart Rate",
    oxygen: "Oxygen Saturation",
    temperature: "Body Temperature",
    cholesterol: "Cholesterol"
};

export default function HealthTimeline({
    appointments = [],
    prescriptions = [],
    labResults = [],
    radiology = [],
    medicalReports = [],
    procedures = [],
    historicalVitals = [],
    theme,
    lang
}) {
    const [selectedFilter, setSelectedFilter] = useState("all"); // "all" | "appointments" | "meds" | "tests" | "vitals" | "docs"
    const [expandedItem, setExpandedItem] = useState(null); // ID of expanded item

    const t = (tr, en) => lang === "tr" ? tr : en;

    // ─── Map and combine all items into a unified timeline format ───────────
    const timelineEvents = useMemo(() => {
        const events = [];

        // 1. Appointments
        appointments.forEach(item => {
            events.push({
                id: `appt-${item._id}`,
                rawId: item._id,
                type: "appointment",
                date: new Date(item.date),
                title: t(`${item.type || "Kontrol"} Muayenesi`, `${item.type || "Check-up"} Appointment`),
                subtitle: item.doctorId?.name ? `Dr. ${item.doctorId.name.replace(/^Dr\.\s+/i, "")}` : t("Doktor Atanmadı", "No Doctor Assigned"),
                source: item.doctorId?.specialty || "",
                status: item.status,
                icon: <FiCalendar size={18} />,
                color: "#e11d48", // Rose red
                details: {
                    time: item.time,
                    room: item.room,
                    notes: item.notes,
                    fee: item.fee,
                    isPaid: item.isPaid
                }
            });
        });

        // 2. Prescriptions
        prescriptions.forEach(item => {
            events.push({
                id: `rx-${item._id}`,
                rawId: item._id,
                type: "prescription",
                date: new Date(item.date || item.createdAt),
                title: t("Reçete Düzenlendi", "Prescription Issued"),
                subtitle: item.doctorId?.name ? `Dr. ${item.doctorId.name.replace(/^Dr\.\s+/i, "")}` : "",
                source: item.doctorId?.specialty || "",
                status: null,
                icon: <FiFileText size={18} />,
                color: "#10b981", // Emerald green
                details: {
                    medications: item.medications || [],
                    notes: item.notes,
                    diagnosis: item.diagnosis
                }
            });
        });

        // 3. Lab Results
        labResults.forEach(item => {
            events.push({
                id: `lab-${item._id}`,
                rawId: item._id,
                type: "lab",
                date: new Date(item.date || item.createdAt),
                title: item.testName || t("Laboratuvar Tahlili", "Lab Test"),
                subtitle: item.labName || t("Merkez Laboratuvarı", "Central Laboratory"),
                source: item.testType || t("Biyokimya", "Biochemistry"),
                status: item.status,
                icon: <FiDroplet size={18} />,
                color: "#06b6d4", // Cyan
                details: {
                    results: item.results || [],
                    notes: item.notes,
                    doctor: item.doctorId?.name
                }
            });
        });

        // 4. Radiology
        radiology.forEach(item => {
            events.push({
                id: `radio-${item._id}`,
                rawId: item._id,
                type: "radiology",
                date: new Date(item.date || item.createdAt),
                title: `${item.imagingType} - ${item.bodyPart}`,
                subtitle: item.doctorId?.name ? `Dr. ${item.doctorId.name.replace(/^Dr\.\s+/i, "")}` : "",
                source: item.doctorId?.specialty || t("Radyoloji", "Radiology"),
                status: item.status,
                icon: <FiActivity size={18} />,
                color: "#8b5cf6", // Purple
                details: {
                    findings: item.findings,
                    impression: item.impression,
                    notes: item.notes
                }
            });
        });

        // 5. Medical Reports
        medicalReports.forEach(item => {
            events.push({
                id: `rep-${item._id}`,
                rawId: item._id,
                type: "report",
                date: new Date(item.date || item.createdAt),
                title: item.reportType || t("Tıbbi Rapor", "Medical Report"),
                subtitle: item.doctorId?.name ? `Dr. ${item.doctorId.name.replace(/^Dr\.\s+/i, "")}` : "",
                source: item.doctorId?.specialty || "",
                status: null,
                icon: <FiAward size={18} />,
                color: "#f59e0b", // Amber
                details: {
                    diagnosis: item.diagnosis,
                    content: item.content,
                    startDate: item.startDate,
                    endDate: item.endDate
                }
            });
        });

        // 6. Procedures
        procedures.forEach(item => {
            events.push({
                id: `proc-${item._id}`,
                rawId: item._id,
                type: "procedure",
                date: new Date(item.date || item.createdAt),
                title: item.procedureName || t("Cerrahi / Girişimsel İşlem", "Surgical / Invasive Procedure"),
                subtitle: item.doctorId?.name ? `Dr. ${item.doctorId.name.replace(/^Dr\.\s+/i, "")}` : "",
                source: item.doctorId?.specialty || "",
                status: null,
                icon: <FiZap size={18} />,
                color: "#f97316", // Orange
                details: {
                    details: item.details,
                    complications: item.complications,
                    postOpInstructions: item.postOpInstructions
                }
            });
        });

        // 7. Vitals
        historicalVitals.forEach(item => {
            const meta = VITAL_META[item.type];
            events.push({
                id: `vital-${item._id}`,
                rawId: item._id,
                type: "vital",
                date: new Date(item.date),
                title: t(`Vital Ölçüm: ${meta?.label || item.type}`, `Vital Measurement: ${VITAL_LABELS_EN[item.type] || item.type}`),
                subtitle: `${item.value} ${item.unit}`,
                source: meta?.icon || "📊",
                status: null,
                icon: <FiTrendingUp size={18} />,
                color: meta?.color || "#ec4899", // Pink
                details: {
                    vitalType: item.type,
                    value: item.value,
                    unit: item.unit,
                    notes: item.notes
                }
            });
        });

        // Sort descending by date
        return events.sort((a, b) => b.date - a.date);
    }, [appointments, prescriptions, labResults, radiology, medicalReports, procedures, historicalVitals, lang]);

    // ─── Filter Events ──────────────────────────────────────────────────────
    const filteredEvents = useMemo(() => {
        if (selectedFilter === "all") return timelineEvents;
        if (selectedFilter === "appointments") return timelineEvents.filter(e => e.type === "appointment");
        if (selectedFilter === "meds") return timelineEvents.filter(e => e.type === "prescription");
        if (selectedFilter === "tests") return timelineEvents.filter(e => e.type === "lab" || e.type === "radiology");
        if (selectedFilter === "vitals") return timelineEvents.filter(e => e.type === "vital");
        if (selectedFilter === "docs") return timelineEvents.filter(e => e.type === "report" || e.type === "procedure");
        return timelineEvents;
    }, [timelineEvents, selectedFilter]);

    // Theme values
    const SECTION_BG = theme === "dark" ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.9)";
    const BORDER_COL = theme === "dark" ? "#334155" : "#e2e8f0";
    const TEXT_COL = theme === "dark" ? "#f8fafc" : "#1e293b";
    const MUTED_COL = "#64748b";

    return (
        <div style={{ animation: "fadeIn 0.5s ease", fontFamily: "'Outfit', sans-serif" }}>

            {/* ── Hero Banner ── */}
            <div style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: 32, padding: "40px 48px", marginBottom: 32,
                position: "relative", overflow: "hidden",
                boxShadow: "0 20px 40px -10px rgba(15,23,42,0.3)"
            }}>
                <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 350, height: 350, background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
                
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, background: "rgba(139,92,246,0.15)", width: "fit-content", padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(139,92,246,0.2)" }}>
                        <FiActivity size={14} color="#a78bfa" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "1px", textTransform: "uppercase" }}>
                            {t("Sağlık Geçmişi", "Health History")}
                        </span>
                    </div>
                    <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-1px" }}>
                        {t("Sağlık Zaman Çizelgesi", "Health Timeline")}
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>
                        {t("Tüm doktor ziyaretleriniz, tahlilleriniz, reçeteleriniz ve ölçümleriniz tek bir kronolojik akışta.", "All your doctor visits, tests, prescriptions, and measurements in a single chronological stream.")}
                    </p>
                </div>
            </div>

            {/* ── Filters Row ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap", background: SECTION_BG, padding: 8, borderRadius: 20, border: `1px solid ${BORDER_COL}` }}>
                {[
                    { id: "all", label: t("Tümü", "All Events"), icon: <FiFilter size={13} /> },
                    { id: "appointments", label: t("Randevular", "Appointments"), icon: <FiCalendar size={13} /> },
                    { id: "meds", label: t("Reçeteler", "Prescriptions"), icon: <FiFileText size={13} /> },
                    { id: "tests", label: t("Tahlil / Görüntüleme", "Lab & Radiology"), icon: <FiDroplet size={13} /> },
                    { id: "vitals", label: t("Ölçümler", "Vitals"), icon: <FiTrendingUp size={13} /> },
                    { id: "docs", label: t("Rapor / Ameliyat", "Reports & Procedures"), icon: <FiAward size={13} /> },
                ].map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => {
                            setSelectedFilter(filter.id);
                            setExpandedItem(null);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 18px",
                            borderRadius: 14,
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 13,
                            background: selectedFilter === filter.id ? "#be123c" : "transparent",
                            color: selectedFilter === filter.id ? "white" : MUTED_COL,
                            transition: "all 0.2s ease",
                            boxShadow: selectedFilter === filter.id ? "0 4px 12px rgba(190,18,60,0.25)" : "none"
                        }}
                    >
                        {filter.icon}
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* ── Timeline Flow ── */}
            {filteredEvents.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "80px 20px", background: SECTION_BG, borderRadius: 28, border: `1px solid ${BORDER_COL}`, color: MUTED_COL
                }}>
                    <FiInfo size={44} style={{ marginBottom: 16, opacity: 0.4 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_COL, margin: "0 0 8px" }}>
                        {t("Kayıt Bulunamadı", "No Records Found")}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                        {t("Seçili kategori için kayıtlı sağlık geçmişi bulunmamaktadır.", "There is no health history registered for the selected category.")}
                    </p>
                </div>
            ) : (
                <div style={{ position: "relative", paddingLeft: 40, margin: "10px 0 40px" }}>
                    {/* Vertical timeline line */}
                    <div style={{
                        position: "absolute", left: 19, top: 20, bottom: 20, width: 2,
                        background: theme === "dark" ? "linear-gradient(to bottom, #334155, rgba(51,65,85,0.1))" : "linear-gradient(to bottom, #e2e8f0, rgba(226,232,240,0.1))"
                    }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                        {filteredEvents.map((event, index) => {
                            const isExpanded = expandedItem === event.id;
                            const formattedDate = event.date.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
                                year: "numeric", month: "long", day: "numeric"
                            });
                            const formattedTime = event.date.toLocaleTimeString(lang === "tr" ? "tr-TR" : "en-US", {
                                hour: "2-digit", minute: "2-digit"
                            });

                            return (
                                <div key={event.id} style={{ position: "relative", animation: `fadeInUp 0.4s ease ${index * 0.05}s both` }}>
                                    {/* Timeline Node Point */}
                                    <div style={{
                                        position: "absolute", left: -39, top: 4, width: 36, height: 36,
                                        borderRadius: "50%", background: theme === "dark" ? "#1e293b" : "white",
                                        border: `3px solid ${event.color}`, display: "flex", alignItems: "center", justifyContent: "center",
                                        color: event.color, boxShadow: `0 0 12px ${event.color}30`, zIndex: 2
                                    }}>
                                        {event.icon}
                                    </div>

                                    {/* Event Card Content */}
                                    <div 
                                        style={{
                                            background: SECTION_BG, borderRadius: 24, border: `1px solid ${BORDER_COL}`,
                                            padding: "20px 24px", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            cursor: "pointer",
                                            boxShadow: isExpanded ? "0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.06)" : "none",
                                            transform: isExpanded ? "translateY(-2px)" : "none"
                                        }}
                                        onClick={() => setExpandedItem(isExpanded ? null : event.id)}
                                        onMouseEnter={e => {
                                            if (!isExpanded) {
                                                e.currentTarget.style.borderColor = event.color;
                                                e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(0,0,0,0.05)";
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isExpanded) {
                                                e.currentTarget.style.borderColor = BORDER_COL;
                                                e.currentTarget.style.boxShadow = "none";
                                            }
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: event.color, background: `${event.color}14`, padding: "4px 10px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                        {t(event.type === "appointment" ? "Randevu" : event.type === "prescription" ? "Reçete" : event.type === "lab" ? "Tahlil" : event.type === "radiology" ? "Görüntüleme" : event.type === "vital" ? "Ölçüm" : "Tıbbi Rapor", event.type.toUpperCase())}
                                                    </span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: MUTED_COL }}>
                                                        {formattedDate} {event.type === "vital" ? "" : `• ${formattedTime}`}
                                                    </span>
                                                </div>
                                                <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT_COL, margin: "6px 0 4px" }}>{event.title}</h3>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: MUTED_COL }}>
                                                    {event.subtitle} {event.source && <span style={{ opacity: 0.5 }}> | </span>} <span style={{ color: TEXT_COL }}>{event.source}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                {event.status && (
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 8,
                                                        background: event.status === "tamamlandı" || event.status === "normal" ? "rgba(16,185,129,0.12)" : event.status === "bekliyor" || event.status === "beklemede" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                                                        color: event.status === "tamamlandı" || event.status === "normal" ? "#10b981" : event.status === "bekliyor" || event.status === "beklemede" ? "#f59e0b" : "#ef4444",
                                                        textTransform: "capitalize"
                                                    }}>
                                                        {t(event.status === "tamamlandı" ? "Tamamlandı" : event.status === "bekliyor" || event.status === "beklemede" ? "Bekliyor" : event.status === "iptal" ? "İptal Edildi" : event.status, event.status)}
                                                    </span>
                                                )}
                                                <div style={{ color: MUTED_COL }}>
                                                    {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expandable Details Container */}
                                        {isExpanded && (
                                            <div 
                                                style={{ 
                                                    marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER_COL}`, 
                                                    animation: "fadeIn 0.25s ease", color: TEXT_COL, fontSize: 14 
                                                }}
                                                onClick={e => e.stopPropagation()} // Click inside details doesn't toggle
                                            >
                                                {/* ── APPOINTMENT DETAILS ── */}
                                                {event.type === "appointment" && (
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                        <div>
                                                            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Muayene Saati", "Appointment Time")}</div>
                                                            <div style={{ fontWeight: 600 }}>{event.details.time}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Oda", "Room")}</div>
                                                            <div style={{ fontWeight: 600 }}>{event.details.room}</div>
                                                        </div>
                                                        {event.details.notes && (
                                                            <div style={{ gridColumn: "1 / -1" }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Doktor Notu", "Doctor's Notes")}</div>
                                                                <div style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: 12, borderRadius: 12, border: `1px solid ${BORDER_COL}`, fontStyle: "italic" }}>
                                                                    "{event.details.notes}"
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16 }}>
                                                            <div>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Muayene Ücreti: ", "Consultation Fee: ")}</span>
                                                                <span style={{ fontWeight: 700 }}>{event.details.fee || 500} TRY</span>
                                                            </div>
                                                            <div>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Ödeme Durumu: ", "Payment Status: ")}</span>
                                                                <span style={{ fontWeight: 700, color: event.details.isPaid ? "#10b981" : "#ef4444" }}>
                                                                    {event.details.isPaid ? t("Ödendi", "Paid") : t("Ödenmedi / Bekliyor", "Unpaid / Pending")}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── PRESCRIPTION DETAILS ── */}
                                                {event.type === "prescription" && (
                                                    <div>
                                                        {event.details.diagnosis && (
                                                            <div style={{ marginBottom: 12 }}>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Teşhis: ", "Diagnosis: ")}</span>
                                                                <span style={{ fontWeight: 700 }}>{event.details.diagnosis}</span>
                                                            </div>
                                                        )}
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 8 }}>{t("Yazılan İlaçlar", "Prescribed Medications")}</div>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                            {event.details.medications.map((med, idx) => (
                                                                <div key={idx} style={{
                                                                    display: "flex", alignItems: "center", gap: 10,
                                                                    background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                                                    padding: "10px 14px", borderRadius: 12, border: `1px solid ${BORDER_COL}`
                                                                }}>
                                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                                                                    <span style={{ fontWeight: 700 }}>{med}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {event.details.notes && (
                                                            <div style={{ marginTop: 14 }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Kullanım Talimatı / Notlar", "Instructions / Notes")}</div>
                                                                <div style={{ fontSize: 13, color: MUTED_COL }}>{event.details.notes}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── LAB DETAILS ── */}
                                                {event.type === "lab" && (
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 10 }}>{t("Tahlil Sonuçları", "Test Results")}</div>
                                                        <div style={{ overflowX: "auto" }}>
                                                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                                                                <thead>
                                                                    <tr>
                                                                        <th style={{ textAlign: "left", fontSize: 10, color: MUTED_COL, textTransform: "uppercase", paddingBottom: 6 }}>{t("Parametre", "Parameter")}</th>
                                                                        <th style={{ textAlign: "left", fontSize: 10, color: MUTED_COL, textTransform: "uppercase", paddingBottom: 6 }}>{t("Değer", "Value")}</th>
                                                                        <th style={{ textAlign: "left", fontSize: 10, color: MUTED_COL, textTransform: "uppercase", paddingBottom: 6 }}>{t("Referans Aralığı", "Reference Range")}</th>
                                                                        <th style={{ textAlign: "left", fontSize: 10, color: MUTED_COL, textTransform: "uppercase", paddingBottom: 6 }}>{t("Durum", "Status")}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {event.details.results.map((res, idx) => {
                                                                        const isAbnormal = res.isAbnormal || res.status === "yüksek" || res.status === "düşük" || res.status === "High" || res.status === "Low";
                                                                        return (
                                                                            <tr key={idx} style={{ background: theme === "dark" ? "rgba(255,255,255,0.01)" : "#f8fafc" }}>
                                                                                <td style={{ padding: "8px 12px", borderRadius: "8px 0 0 8px", fontWeight: 700 }}>{res.parameter}</td>
                                                                                <td style={{ padding: "8px 12px", fontWeight: 800, color: isAbnormal ? "#ef4444" : TEXT_COL }}>
                                                                                    {res.value} <span style={{ fontSize: 11, fontWeight: 500, color: MUTED_COL }}>{res.unit}</span>
                                                                                </td>
                                                                                <td style={{ padding: "8px 12px", color: MUTED_COL }}>{res.referenceRange || "—"}</td>
                                                                                <td style={{ padding: "8px 12px", borderRadius: "0 8px 8px 0" }}>
                                                                                    {isAbnormal ? (
                                                                                        <span style={{ color: "#ef4444", fontWeight: 800, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                                                                            <FiAlertCircle size={12} />
                                                                                            {res.status || t("Yüksek / Düşük", "Abnormal")}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span style={{ color: "#10b981", fontWeight: 800, fontSize: 11 }}>{t("Normal", "Normal")}</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {event.details.notes && (
                                                            <div style={{ marginTop: 14 }}>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Laboratuvar Notu: ", "Lab Notes: ")}</span>
                                                                <span style={{ fontStyle: "italic", fontSize: 13 }}>{event.details.notes}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── RADIOLOGY DETAILS ── */}
                                                {event.type === "radiology" && (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                        {event.details.findings && (
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Bulgular", "Findings")}</div>
                                                                <div style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: 12, borderRadius: 12, border: `1px solid ${BORDER_COL}`, fontSize: 13, lineHeight: 1.5 }}>
                                                                    {event.details.findings}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {event.details.impression && (
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Sonuç / İzlenim", "Impression")}</div>
                                                                <div style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: 12, borderRadius: 12, border: `1px solid ${BORDER_COL}`, fontSize: 13, fontWeight: 700, color: TEXT_COL }}>
                                                                    {event.details.impression}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {event.details.notes && (
                                                            <div>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Not: ", "Notes: ")}</span>
                                                                <span style={{ fontSize: 13 }}>{event.details.notes}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── MEDICAL REPORT DETAILS ── */}
                                                {event.type === "report" && (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                        {event.details.diagnosis && (
                                                            <div>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Tanı / Teşhis: ", "Diagnosis: ")}</span>
                                                                <span style={{ fontWeight: 700 }}>{event.details.diagnosis}</span>
                                                            </div>
                                                        )}
                                                        {event.details.content && (
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Rapor İçeriği", "Report Content")}</div>
                                                                <div style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: 12, borderRadius: 12, border: `1px solid ${BORDER_COL}`, fontSize: 13, lineHeight: 1.5 }}>
                                                                    {event.details.content}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
                                                            <div>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Başlangıç: ", "Start Date: ")}</span>
                                                                <span style={{ fontWeight: 600 }}>{new Date(event.details.startDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}</span>
                                                            </div>
                                                            <div>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Bitiş: ", "End Date: ")}</span>
                                                                <span style={{ fontWeight: 600 }}>{new Date(event.details.endDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── PROCEDURE DETAILS ── */}
                                                {event.type === "procedure" && (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                        {event.details.details && (
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Detaylar", "Details")}</div>
                                                                <div style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: 12, borderRadius: 12, border: `1px solid ${BORDER_COL}`, fontSize: 13, lineHeight: 1.5 }}>
                                                                    {event.details.details}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {event.details.complications && (
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Komplikasyonlar", "Complications")}</div>
                                                                <div style={{ background: "rgba(239,68,68,0.05)", padding: 12, borderRadius: 12, border: "1px solid rgba(239,68,68,0.15)", fontSize: 13, color: "#ef4444" }}>
                                                                    {event.details.complications}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {event.details.postOpInstructions && (
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", marginBottom: 4 }}>{t("Operasyon Sonrası Talimatlar", "Post-Op Instructions")}</div>
                                                                <div style={{ background: "rgba(16,185,129,0.05)", padding: 12, borderRadius: 12, border: "1px solid rgba(16,185,129,0.15)", fontSize: 13, color: "#10b981" }}>
                                                                    {event.details.postOpInstructions}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── VITAL DETAILS ── */}
                                                {event.type === "vital" && (
                                                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                                        <div style={{
                                                            fontSize: 32, padding: 12, borderRadius: 16,
                                                            background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                                            border: `1px solid ${BORDER_COL}`
                                                        }}>
                                                            {VITAL_META[event.details.vitalType]?.icon || "📊"}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 22, fontWeight: 900, color: TEXT_COL }}>
                                                                {event.details.value}
                                                                <span style={{ fontSize: 13, fontWeight: 600, color: MUTED_COL, marginLeft: 4 }}>{event.details.unit}</span>
                                                            </div>
                                                            {event.details.notes && (
                                                                <div style={{ fontSize: 13, color: MUTED_COL, marginTop: 4 }}>
                                                                    <b style={{ color: TEXT_COL }}>{t("Not: ", "Notes: ")}</b> {event.details.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

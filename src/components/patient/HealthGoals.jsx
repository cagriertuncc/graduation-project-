import { useState, useEffect } from "react";
import {
    FiAward, FiPlus, FiTrash2, FiEdit, FiCheck, FiX, FiInfo,
    FiCoffee, FiTrendingUp, FiMoon, FiActivity, FiZap, FiAlertCircle, FiAlertTriangle
} from "react-icons/fi";
import { patientPortalApi } from "../../services/patientPortalApi";

// ─── Goal Configurations ────────────────────────────────────────────────
const GOAL_TYPES = {
    water: { label: "Su Tüketimi", icon: "💧", unit: "ml", color: "#3b82f6", grad: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", defaultTarget: 2500, increments: [250, 500] },
    steps: { label: "Adım Sayısı", icon: "🏃", unit: "adım", color: "#10b981", grad: "linear-gradient(135deg, #10b981 0%, #065f46 100%)", defaultTarget: 10000, increments: [1000, 2000] },
    sleep: { label: "Uyku Süresi", icon: "🌙", unit: "saat", color: "#8b5cf6", grad: "linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)", defaultTarget: 8, increments: [1, 2] },
    weight: { label: "Hedef Kilo", icon: "⚖️", unit: "kg", color: "#f97316", grad: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)", defaultTarget: 70, increments: [] },
    calories: { label: "Kalori Takibi", icon: "🍎", unit: "kcal", color: "#ec4899", grad: "linear-gradient(135deg, #ec4899 0%, #9d174d 100%)", defaultTarget: 2000, increments: [100, 300, 500] },
    custom: { label: "Özel Hedef", icon: "🎯", unit: "birim", color: "#06b6d4", grad: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", defaultTarget: 10, increments: [1] }
};

const GOAL_LABELS_EN = {
    water: "Water Intake",
    steps: "Steps Count",
    sleep: "Sleep Duration",
    weight: "Target Weight",
    calories: "Calorie Tracker",
    custom: "Custom Goal"
};

export default function HealthGoals({ theme, lang }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" | "edit" | "log"
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [goalForm, setGoalForm] = useState({
        type: "water",
        title: "",
        target: 2500,
        current: 0,
        unit: "ml"
    });
    
    // Quick log state
    const [logValue, setLogValue] = useState("");

    const t = (tr, en) => lang === "tr" ? tr : en;

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const data = await patientPortalApi.getGoals();
            setGoals(data);
        } catch (err) {
            console.error("Failed to load goals", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    // ─── Actions ────────────────────────────────────────────────────────────
    const handleOpenAddModal = () => {
        setGoalForm({
            type: "water",
            title: GOAL_TYPES.water.label,
            target: GOAL_TYPES.water.defaultTarget,
            current: 0,
            unit: GOAL_TYPES.water.unit
        });
        setModalMode("add");
        setErrorMsg("");
        setShowModal(true);
    };

    const handleOpenEditModal = (goal) => {
        setSelectedGoal(goal);
        setGoalForm({
            type: goal.type,
            title: goal.title,
            target: goal.target,
            current: goal.current,
            unit: goal.unit
        });
        setModalMode("edit");
        setErrorMsg("");
        setShowModal(true);
    };

    const handleOpenLogModal = (goal) => {
        setSelectedGoal(goal);
        setLogValue("");
        setModalMode("log");
        setErrorMsg("");
        setShowModal(true);
    };

    const handleSaveGoal = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");
        try {
            if (modalMode === "add") {
                await patientPortalApi.addGoal(goalForm);
            } else if (modalMode === "edit") {
                await patientPortalApi.updateGoal(selectedGoal._id, goalForm);
            }
            setShowModal(false);
            fetchGoals();
        } catch (err) {
            setErrorMsg(err.error || err.message || t("İşlem başarısız.", "Action failed."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogProgressSubmit = async (e) => {
        e.preventDefault();
        const num = parseFloat(logValue.replace(",", "."));
        if (isNaN(num) || num < 0) {
            setErrorMsg(t("Lütfen geçerli bir sayı girin.", "Please enter a valid number."));
            return;
        }

        setIsSubmitting(true);
        setErrorMsg("");
        try {
            const newCurrent = selectedGoal.current + num;
            await patientPortalApi.updateGoal(selectedGoal._id, { current: newCurrent });
            setShowModal(false);
            fetchGoals();
        } catch (err) {
            setErrorMsg(err.error || err.message || t("İşlem başarısız.", "Action failed."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickIncrement = async (goal, increment) => {
        try {
            const newCurrent = goal.current + increment;
            await patientPortalApi.updateGoal(goal._id, { current: newCurrent });
            
            // Optimistic update
            setGoals(prev => prev.map(g => g._id === goal._id ? { ...g, current: newCurrent, isCompleted: newCurrent >= g.target } : g));
        } catch (err) {
            console.error("Failed to increment goal progress", err);
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm(t("Bu hedefi silmek istediğinizden emin misiniz?", "Are you sure you want to delete this goal?"))) return;
        try {
            await patientPortalApi.deleteGoal(id);
            fetchGoals();
        } catch (err) {
            console.error("Failed to delete goal", err);
        }
    };

    const handleTypeChange = (e) => {
        const type = e.target.value;
        const config = GOAL_TYPES[type];
        setGoalForm({
            ...goalForm,
            type,
            title: lang === "tr" ? config.label : (GOAL_LABELS_EN[type] || config.label),
            target: config.defaultTarget,
            unit: config.unit
        });
    };

    // Styling constants
    const SECTION_BG = theme === "dark" ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.9)";
    const BORDER_COL = theme === "dark" ? "#334155" : "#e2e8f0";
    const TEXT_COL = theme === "dark" ? "#f8fafc" : "#1e293b";
    const MUTED_COL = "#64748b";

    return (
        <div style={{ animation: "fadeIn 0.5s ease", fontFamily: "'Outfit', sans-serif" }}>

            {/* ── Hero Banner ── */}
            <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
                borderRadius: 32, padding: "40px 48px", marginBottom: 32,
                position: "relative", overflow: "hidden",
                boxShadow: "0 20px 40px -10px rgba(15,23,42,0.4)"
            }}>
                <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
                
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, background: "rgba(236,72,153,0.15)", width: "fit-content", padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(236,72,153,0.2)" }}>
                            <FiAward size={14} color="#f472b6" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#f472b6", letterSpacing: "1px", textTransform: "uppercase" }}>
                                {t("Yaşam Tarzı Takibi", "Lifestyle Tracker")}
                            </span>
                        </div>
                        <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-1px" }}>
                            {t("Sağlık Hedefleriniz", "Your Health Goals")}
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>
                            {t("Su, adım, uyku ve kalori hedeflerinizi belirleyin ve günlük ilerlemenizi kaydedin.", "Set your water, steps, sleep, and calorie goals and track your daily progress.")}
                        </p>
                    </div>

                    <button
                        onClick={handleOpenAddModal}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "14px 24px", borderRadius: 16,
                            background: "linear-gradient(135deg, #ec4899 0%, #be123c 100%)",
                            color: "white", border: "none", cursor: "pointer",
                            fontWeight: 700, fontSize: 14,
                            boxShadow: "0 8px 20px rgba(236,72,153,0.4)",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        <FiPlus size={16} />
                        {t("Hedef Ekle", "Create Goal")}
                    </button>
                </div>
            </div>

            {/* ── Goals Grid ── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: MUTED_COL }}>
                    <div className="spinner" style={{ border: `3px solid ${BORDER_COL}`, borderTop: "3px solid #ec4899", borderRadius: "50%", width: 36, height: 36, animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t("Hedefler yükleniyor...", "Loading goals...")}</div>
                </div>
            ) : goals.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: MUTED_COL, background: SECTION_BG, borderRadius: 28, border: `1px solid ${BORDER_COL}` }}>
                    <FiInfo size={44} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_COL, marginBottom: 8 }}>{t("Kayıtlı Hedef Bulunmamaktadır", "No Registered Goals")}</div>
                    <button onClick={handleOpenAddModal} style={{ background: "none", border: "none", color: "#ec4899", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>{t("+ Yeni bir hedef ekle", "+ Add a new goal")}</button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24, marginBottom: 40 }}>
                    {goals.map(goal => {
                        const config = GOAL_TYPES[goal.type] || GOAL_TYPES.custom;
                        const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
                        const isCompleted = goal.isCompleted || progress >= 100;
                        const cardThemeColor = config.color;

                        return (
                            <div
                                key={goal._id}
                                style={{
                                    background: SECTION_BG, borderRadius: 28, border: `1px solid ${BORDER_COL}`,
                                    padding: "24px 28px", display: "flex", flexDirection: "column",
                                    position: "relative", overflow: "hidden", transition: "all 0.3s ease"
                                }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 10px 30px -5px rgba(0,0,0,0.06), 0 8px 20px -6px rgba(0,0,0,0.04)"}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                            >
                                {/* Gradient top highlight bar */}
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: config.grad }} />

                                {/* Card Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 14,
                                            background: `${cardThemeColor}14`, display: "flex",
                                            alignItems: "center", justifyContent: "center", fontSize: 22
                                        }}>
                                            {config.icon}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT_COL, margin: 0 }}>{goal.title}</h3>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                {lang === "tr" ? config.label : (GOAL_LABELS_EN[goal.type] || config.label)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => handleOpenEditModal(goal)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED_COL, padding: 4 }} title={t("Düzenle", "Edit")}><FiEdit size={14} /></button>
                                        <button onClick={() => handleDeleteGoal(goal._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef444499", padding: 4 }} title={t("Sil", "Delete")}><FiTrash2 size={14} /></button>
                                    </div>
                                </div>

                                {/* Circular Progress and Values */}
                                <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 24 }}>
                                    {/* Circular Progress Ring */}
                                    <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
                                        <svg width="84" height="84" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"}
                                                strokeWidth="3.2"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={isCompleted ? "#10b981" : cardThemeColor}
                                                strokeWidth="3.2"
                                                strokeDasharray={`${progress}, 100`}
                                                strokeLinecap="round"
                                                style={{ transition: "stroke-dasharray 0.5s ease" }}
                                            />
                                        </svg>
                                        <div style={{
                                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                                        }}>
                                            {isCompleted ? (
                                                <FiCheckCircle size={22} color="#10b981" />
                                            ) : (
                                                <span style={{ fontSize: 16, fontWeight: 900, color: TEXT_COL }}>{progress}%</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED_COL, textTransform: "uppercase" }}>{t("Mevcut Durum", "Current Progress")}</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: TEXT_COL, margin: "2px 0 4px" }}>
                                            {goal.current}
                                            <span style={{ fontSize: 13, fontWeight: 600, color: MUTED_COL, marginLeft: 4 }}>{goal.unit}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: MUTED_COL }}>
                                            {t("Hedef: ", "Target: ")} <b style={{ color: TEXT_COL }}>{goal.target} {goal.unit}</b>
                                        </div>
                                    </div>
                                </div>

                                {/* Increments & Logging buttons */}
                                <div style={{ marginTop: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                                    {config.increments.map(inc => (
                                        <button
                                            key={inc}
                                            onClick={() => handleQuickIncrement(goal, inc)}
                                            style={{
                                                padding: "8px 14px", borderRadius: 10,
                                                background: theme === "dark" ? "#1e293b" : "#f1f5f9",
                                                color: TEXT_COL, border: `1px solid ${BORDER_COL}`,
                                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                                                transition: "all 0.15s ease"
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = isCompleted ? "rgba(16,185,129,0.1)" : `${cardThemeColor}10`}
                                            onMouseLeave={e => e.currentTarget.style.background = theme === "dark" ? "#1e293b" : "#f1f5f9"}
                                        >
                                            +{inc} {goal.unit}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handleOpenLogModal(goal)}
                                        style={{
                                            padding: "8px 14px", borderRadius: 10,
                                            background: "transparent",
                                            color: isCompleted ? "#10b981" : cardThemeColor,
                                            border: `1px dashed ${isCompleted ? "#10b981" : cardThemeColor}`,
                                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                                            marginLeft: "auto", transition: "all 0.15s ease"
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = isCompleted ? "rgba(16,185,129,0.08)" : `${cardThemeColor}08`;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        {t("Giriş Yap", "Log Progress")}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Goal Creation/Log Modal ── */}
            {showModal && (
                <div 
                    style={{ 
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                        background: theme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)", 
                        backdropFilter: "blur(8px)", zIndex: 10006, 
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" 
                    }} 
                    onClick={() => setShowModal(false)}
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
                                {modalMode === "add" ? t("Yeni Hedef Belirle", "Create New Goal") : modalMode === "edit" ? t("Hedefi Düzenle", "Edit Goal") : t("İlerleme Kaydet", "Log Progress")}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)} 
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

                        {modalMode === "log" ? (
                            /* ── Logging Progress Form ── */
                            <form onSubmit={handleLogProgressSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div>
                                    <div style={{ fontSize: 13, color: MUTED_COL, marginBottom: 12 }}>
                                        {selectedGoal?.title} {t("hedefinize ekleme yapın.", "log entry for this goal.")}
                                    </div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                        {t(`EKLENECEK MİKTAR (${selectedGoal?.unit})`, `AMOUNT TO ADD (${selectedGoal?.unit})`)}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        style={{
                                            width: "100%", padding: "12px 16px", borderRadius: "12px",
                                            border: `1px solid ${BORDER_COL}`,
                                            background: theme === "dark" ? "#0f172a" : "white",
                                            color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                        }}
                                        placeholder={t("Miktar girin", "Enter amount")}
                                        value={logValue}
                                        onChange={e => setLogValue(e.target.value)}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    style={{ 
                                        width: "100%", padding: "14px", borderRadius: "14px", 
                                        background: "linear-gradient(135deg, #ec4899 0%, #be123c 100%)", 
                                        color: "white", border: "none", fontWeight: 700, 
                                        cursor: isSubmitting ? "not-allowed" : "pointer", 
                                        marginTop: "10px", opacity: isSubmitting ? 0.7 : 1,
                                        boxShadow: "0 8px 20px rgba(236,72,153,0.3)",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {isSubmitting ? t("Kaydediliyor...", "Saving...") : t("Ekle", "Add")}
                                </button>
                            </form>
                        ) : (
                            /* ── Creation / Edition Form ── */
                            <form onSubmit={handleSaveGoal} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {modalMode === "add" && (
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                            {t("HEDEF TÜRÜ", "GOAL TYPE")}
                                        </label>
                                        <select
                                            style={{
                                                width: "100%", padding: "12px 16px", borderRadius: "12px",
                                                border: `1px solid ${BORDER_COL}`,
                                                background: theme === "dark" ? "#0f172a" : "white",
                                                color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                            }}
                                            value={goalForm.type}
                                            onChange={handleTypeChange}
                                        >
                                            {Object.entries(GOAL_TYPES).map(([key, config]) => (
                                                <option key={key} value={key}>
                                                    {config.icon} {lang === "tr" ? config.label : (GOAL_LABELS_EN[key] || config.label)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                        {t("HEDEF BAŞLIĞI", "GOAL TITLE")}
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
                                        placeholder={t("Örn: Günlük Su İçme", "e.g. Daily Water Drinking")}
                                        value={goalForm.title}
                                        onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                            {t(`HEDEF MİKTAR`, `TARGET VALUE`)}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0.1"
                                            step="any"
                                            style={{
                                                width: "100%", padding: "12px 16px", borderRadius: "12px",
                                                border: `1px solid ${BORDER_COL}`,
                                                background: theme === "dark" ? "#0f172a" : "white",
                                                color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                            }}
                                            placeholder="1000"
                                            value={goalForm.target}
                                            onChange={e => setGoalForm({ ...goalForm, target: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                            {t(`BİRİM`, `UNIT`)}
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
                                            placeholder="ml"
                                            value={goalForm.unit}
                                            onChange={e => setGoalForm({ ...goalForm, unit: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {modalMode === "edit" && (
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED_COL, marginBottom: "8px", textTransform: "uppercase" }}>
                                            {t("MEVCUT DEĞER", "CURRENT VALUE")}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="any"
                                            style={{
                                                width: "100%", padding: "12px 16px", borderRadius: "12px",
                                                border: `1px solid ${BORDER_COL}`,
                                                background: theme === "dark" ? "#0f172a" : "white",
                                                color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none"
                                            }}
                                            value={goalForm.current}
                                            onChange={e => setGoalForm({ ...goalForm, current: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    style={{ 
                                        width: "100%", padding: "14px", borderRadius: "14px", 
                                        background: "linear-gradient(135deg, #ec4899 0%, #be123c 100%)", 
                                        color: "white", border: "none", fontWeight: 700, 
                                        cursor: isSubmitting ? "not-allowed" : "pointer", 
                                        marginTop: "10px", opacity: isSubmitting ? 0.7 : 1,
                                        boxShadow: "0 8px 20px rgba(236,72,153,0.3)",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {isSubmitting ? t("Kaydediliyor...", "Saving...") : t("Kaydet", "Save")}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

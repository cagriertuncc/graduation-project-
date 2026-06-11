import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTechnicianAuth } from "../context/TechnicianAuthContext";
import { technicianApi } from "../services/technicianApi";
import {
    FiActivity, FiCheck, FiFileText, FiClock, FiGrid, FiList, FiLogOut, FiPlus, FiTrash2,
    FiUser, FiCheckCircle, FiAlertTriangle, FiSearch, FiRefreshCw, FiImage, FiChevronRight, 
    FiFilter, FiCpu, FiTrendingUp, FiZap
} from "react-icons/fi";

const C = {
    bg: "#04050e",
    bgCard: "rgba(255, 255, 255, 0.02)",
    bgCardDark: "#070a1a",
    border: "rgba(255, 255, 255, 0.06)",
    borderTeal: "rgba(20, 184, 166, 0.2)",
    borderRed: "rgba(239, 68, 68, 0.2)",
    text: "#f8fafc",
    muted: "#94a3b8",
    cyan: "#0ea5e9",
    teal: "#14b8a6",
    tealGrad: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
    red: "#ef4444",
    green: "#10b981",
    orange: "#f59e0b"
};

export default function TechnicianDashboard() {
    const { user, logout } = useTechnicianAuth();
    const navigate = useNavigate();

    // Data lists
    const [labRequests, setLabRequests] = useState([]);
    const [radiologyRequests, setRadiologyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("islistesi"); // islistesi, gecmis, cihazlar
    const [activeTab, setActiveTab] = useState("lab"); // lab, radyoloji
    const [searchTerm, setSearchTerm] = useState("");

    // Barcode Scanner Simulator State
    const [scanningItemId, setScanningItemId] = useState(null);
    const [isScanComplete, setIsScanComplete] = useState(false);
    const [acceptedSamples, setAcceptedSamples] = useState({}); // { [id]: 'processing' }

    // Equipment Calibration Center States
    const [devices, setDevices] = useState([
        { id: 1, name: "BioChem-400 Biyokimya Otomatı", status: "Aktif", calibration: "Tamamlandı", uptime: "98.8", runs: 142, temp: "37.2°C", isLab: true },
        { id: 2, name: "HemoCounter-X Hemogram Analizör", status: "Aktif", calibration: "Gerekli (Acil)", uptime: "99.4", runs: 89, temp: "22.4°C", isLab: true },
        { id: 3, name: "Siemens Magnetom 3T MR Görüntüleme", status: "Çalışıyor", calibration: "Tamamlandı", uptime: "97.1", runs: 14, temp: "4.2 K (Helyum)", isLab: false },
        { id: 4, name: "Digital X-Ray Pro Röntgen Sistemi", status: "Beklemede", calibration: "Tamamlandı", uptime: "99.9", runs: 34, temp: "24.1°C", isLab: false }
    ]);
    const [calibratingId, setCalibratingId] = useState(null);
    const [calibrationProgress, setCalibrationProgress] = useState(0);

    // Rapid Doctor Pager Simulation
    const [isPagerSent, setIsPagerSent] = useState(false);
    const [pagerLog, setPagerLog] = useState("");

    // Modals & Form States
    const [selectedLab, setSelectedLab] = useState(null);
    const [selectedRadiology, setSelectedRadiology] = useState(null);

    // Form inputs for Lab
    const [labParams, setLabParams] = useState([]);
    const [labNotes, setLabNotes] = useState("");
    const [labName, setLabName] = useState("Merkez Laboratuvarı");
    const [labStatus, setLabStatus] = useState("tamamlandı");

    // Form inputs for Radiology
    const [radFindings, setRadFindings] = useState("");
    const [radImpression, setRadImpression] = useState("");
    const [radNotes, setRadNotes] = useState("");
    const [radStatus, setRadStatus] = useState("tamamlandı");

    const handleLogout = () => {
        logout();
        navigate("/teknisyen/giris");
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const labs = await technicianApi.getLabResults();
            const rads = await technicianApi.getRadiology();
            setLabRequests(labs);
            setRadiologyRequests(rads);
        } catch (err) {
            setError(err.message || "Veriler alınırken bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Specimen Scanner Auto-Success Sequence
    useEffect(() => {
        if (scanningItemId) {
            setIsScanComplete(false);
            const timer = setTimeout(() => {
                setIsScanComplete(true);
                const timerClose = setTimeout(() => {
                    setAcceptedSamples(prev => ({ ...prev, [scanningItemId]: "processing" }));
                    setScanningItemId(null);
                }, 900);
                return () => clearTimeout(timerClose);
            }, 1600);
            return () => clearTimeout(timer);
        }
    }, [scanningItemId]);

    // Equipment Calibration Engine Simulation
    const startCalibration = (id) => {
        setCalibratingId(id);
        setCalibrationProgress(0);
        const interval = setInterval(() => {
            setCalibrationProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setDevices(prevDevices => 
                            prevDevices.map(d => 
                                d.id === id 
                                    ? { ...d, calibration: "Tamamlandı", status: "Aktif", temp: id === 3 ? "4.2 K (Helyum)" : id === 1 ? "37.0°C" : "21.6°C" }
                                    : d
                            )
                        );
                        setCalibratingId(null);
                    }, 400);
                    return 100;
                }
                return prev + 10;
            });
        }, 150);
    };

    // Pager Send Command
    const triggerDoctorAlert = (doctorName, patientName) => {
        setIsPagerSent(true);
        setPagerLog(`[${new Date().toLocaleTimeString()}] Pager ALERT sent to ${doctorName} for patient ${patientName}. Status code: PAGER-OK-200.`);
    };

    // Helper: default parameters for lab test names
    const getDefaultsForTest = (testName = "") => {
        const name = testName.toLowerCase();
        if (name.includes("kan") || name.includes("hemogram")) {
            return [
                { parameter: "WBC (Akyuvar)", value: "7.2", unit: "10^3/uL", referenceRange: "4.0 - 10.0", isAbnormal: false },
                { parameter: "RBC (Alyuvar)", value: "4.8", unit: "10^6/uL", referenceRange: "4.2 - 5.9", isAbnormal: false },
                { parameter: "Hemoglobin (HGB)", value: "14.2", unit: "g/dL", referenceRange: "12.0 - 16.0", isAbnormal: false },
                { parameter: "Plt (Trombosit)", value: "245", unit: "10^3/uL", referenceRange: "150 - 400", isAbnormal: false }
            ];
        }
        if (name.includes("biyokimya") || name.includes("şeker") || name.includes("glukoz")) {
            return [
                { parameter: "Açlık Kan Şekeri (Glukoz)", value: "92", unit: "mg/dL", referenceRange: "70 - 100", isAbnormal: false },
                { parameter: "Üre", value: "24", unit: "mg/dL", referenceRange: "15 - 45", isAbnormal: false },
                { parameter: "Kreatinin", value: "0.85", unit: "mg/dL", referenceRange: "0.60 - 1.20", isAbnormal: false },
                { parameter: "AST (SGOT)", value: "22", unit: "U/L", referenceRange: "0 - 40", isAbnormal: false },
                { parameter: "ALT (SGPT)", value: "28", unit: "U/L", referenceRange: "0 - 41", isAbnormal: false }
            ];
        }
        if (name.includes("tiroid") || name.includes("tsh") || name.includes("hormon")) {
            return [
                { parameter: "TSH", value: "1.85", unit: "uIU/mL", referenceRange: "0.27 - 4.2", isAbnormal: false },
                { parameter: "Serbest T3", value: "3.1", unit: "pg/mL", referenceRange: "2.0 - 4.4", isAbnormal: false },
                { parameter: "Serbest T4", value: "1.25", unit: "ng/dL", referenceRange: "0.93 - 1.70", isAbnormal: false }
            ];
        }
        return [
            { parameter: "Genel Parametre", value: "", unit: "", referenceRange: "", isAbnormal: false }
        ];
    };

    // Open Lab Entry Modal
    const handleOpenLab = (lab) => {
        setSelectedLab(lab);
        setLabNotes(lab.notes || "");
        setLabName(lab.labName || "Merkez Laboratuvarı");
        setLabStatus(lab.status === "beklemede" ? "tamamlandı" : lab.status);
        setIsPagerSent(false);
        setPagerLog("");
        if (lab.results && lab.results.length > 0) {
            setLabParams([...lab.results]);
        } else {
            setLabParams(getDefaultsForTest(lab.testName));
        }
    };

    // Open Radiology Entry Modal
    const handleOpenRadiology = (rad) => {
        setSelectedRadiology(rad);
        setRadFindings(rad.findings || "");
        setRadImpression(rad.impression || "");
        setRadNotes(rad.notes || "");
        setRadStatus(rad.status === "beklemede" ? "tamamlandı" : rad.status);
        setIsPagerSent(false);
        setPagerLog("");
    };

    // Add Lab Parameter row
    const addParamRow = () => {
        setLabParams([...labParams, { parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }]);
    };

    // Remove Lab Parameter row
    const removeParamRow = (index) => {
        setLabParams(labParams.filter((_, i) => i !== index));
    };

    // Update Lab Parameter field
    const updateParam = (index, field, value) => {
        const copy = [...labParams];
        copy[index][field] = value;
        setLabParams(copy);
    };

    // Submit Lab Result
    const handleSubmitLab = async (e) => {
        e.preventDefault();
        try {
            if (labParams.length === 0) {
                alert("Lütfen en az bir tahlil sonucu giriniz.");
                return;
            }
            const invalid = labParams.some(p => !p.parameter || !p.value);
            if (invalid) {
                alert("Lütfen tüm parametre isimlerini ve değerlerini doldurunuz.");
                return;
            }

            const hasAbnormal = labParams.some(p => p.isAbnormal);
            const resolvedStatus = hasAbnormal ? "anormal" : labStatus;

            const payload = {
                results: labParams,
                labName,
                notes: labNotes,
                status: resolvedStatus
            };

            await technicianApi.updateLabResult(selectedLab._id, payload);
            setSelectedLab(null);
            fetchData();
        } catch (err) {
            alert(err.message || "Tahlil kaydedilirken hata oluştu");
        }
    };

    // Submit Radiology Result
    const handleSubmitRadiology = async (e) => {
        e.preventDefault();
        try {
            if (!radFindings || !radImpression) {
                alert("Lütfen bulguları ve izlenimleri doldurunuz.");
                return;
            }

            const payload = {
                findings: radFindings,
                impression: radImpression,
                notes: radNotes,
                status: radStatus
            };

            await technicianApi.updateRadiology(selectedRadiology._id, payload);
            setSelectedRadiology(null);
            fetchData();
        } catch (err) {
            alert(err.message || "Rapor kaydedilirken hata oluştu");
        }
    };

    // Filter Logic
    const filterAndSearch = (list) => {
        return list.filter(item => {
            const pName = item.patientId?.name?.toLowerCase() || "";
            const dName = item.doctorId?.name?.toLowerCase() || "";
            const testName = (item.testName || item.imagingType || "").toLowerCase();
            const q = searchTerm.toLowerCase();
            return pName.includes(q) || dName.includes(q) || testName.includes(q);
        });
    };

    // Segregate pending / completed
    const pendingLabs = labRequests.filter(l => l.status === "beklemede");
    const completedLabs = labRequests.filter(l => l.status !== "beklemede");

    const pendingRads = radiologyRequests.filter(r => r.status === "beklemede");
    const completedRads = radiologyRequests.filter(r => r.status !== "beklemede");

    const activeList = activeSection === "islistesi"
        ? (activeTab === "lab" ? pendingLabs : pendingRads)
        : (activeTab === "lab" ? completedLabs : completedRads);

    const filteredList = filterAndSearch(activeList);

    // Dynamic stats
    const totalPendingCount = pendingLabs.length + pendingRads.length;
    const totalCompletedCount = completedLabs.length + completedRads.length;
    const acceptedSamplesCount = Object.keys(acceptedSamples).length;
    const uncalibratedDevicesCount = devices.filter(d => d.calibration.includes("Gerekli")).length;

    return (
        <div style={{
            minHeight: "100vh",
            background: C.bg,
            color: C.text,
            fontFamily: "'Inter', -apple-system, sans-serif",
            display: "flex",
            flexDirection: "column"
        }}>
            {/* ══════════════ TOP BAR ══════════════ */}
            <header style={{
                position: "sticky", top: 0, zIndex: 100,
                height: 64, padding: "0 28px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(4, 5, 14, 0.9)", backdropFilter: "blur(20px)",
                borderBottom: `1px solid ${C.border}`,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 38, height: 38,
                        background: C.tealGrad,
                        borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 16px rgba(20, 184, 166, 0.3)"
                    }}>
                        <FiActivity size={18} color="white" />
                    </div>
                    <div>
                        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>MediTrack Lab</span>
                        <span style={{ display: "block", fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: -2 }}>
                            Laboratuvar & Radyoloji Kontrol Paneli
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        onClick={fetchData}
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${C.border}`,
                            color: C.text,
                            padding: "8px 12px",
                            borderRadius: 10,
                            cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6,
                            fontSize: 12, fontWeight: 600,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    >
                        <FiRefreshCw size={13} className={loading ? "spin" : ""} /> Yenile
                    </button>

                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "6px 12px", background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${C.border}`, borderRadius: 10
                    }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: "50%",
                            background: C.tealGrad, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800, color: "white"
                        }}>
                            {(user?.name || "T")[0]}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{user?.name || "Teknisyen Görevlisi"}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 14px", background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10,
                            color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                    >
                        <FiLogOut size={13} /> Çıkış Yap
                    </button>
                </div>
            </header>

            {/* ══════════════ TOP STATS GRID (SCIENCE WIDGETS) ══════════════ */}
            <section style={{
                padding: "24px 28px 0", maxWidth: 1400, width: "100%", margin: "0 auto",
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20
            }}>
                {/* Stat 1: Pending Requests */}
                <div 
                    onClick={() => setActiveSection("islistesi")}
                    style={{
                        background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                    className="glow-teal card-hover"
                >
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Aktif İş Yükü</span>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: "white", marginTop: 4 }}>{totalPendingCount} İstek</h2>
                        <span style={{ fontSize: 11, color: C.cyan, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <span className="pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan }} />
                            Analiz bekleyen tahliller
                        </span>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.cyan }}>
                        <FiClock size={20} />
                    </div>
                </div>

                {/* Stat 2: Accepted & Processing Tubes */}
                <div 
                    style={{
                        background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s"
                    }}
                    className="glow-teal"
                >
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Kabul Edilen Örnek</span>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: "white", marginTop: 4 }}>{acceptedSamplesCount} Numune</h2>
                        <span style={{ fontSize: 11, color: C.teal, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <span className="pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} />
                            Kabul edilen/çalışılan barkod
                        </span>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal }}>
                        <FiActivity size={20} />
                    </div>
                </div>

                {/* Stat 3: Completed Today */}
                <div 
                    onClick={() => setActiveSection("gecmis")}
                    style={{
                        background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                    className="glow-teal card-hover"
                >
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bugün Tamamlanan</span>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: "white", marginTop: 4 }}>{totalCompletedCount} Test</h2>
                        <span style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <span className="pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
                            Raporlanıp arşivlenen test
                        </span>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.green }}>
                        <FiCheckCircle size={20} />
                    </div>
                </div>

                {/* Stat 4: System Calibration */}
                <div 
                    onClick={() => setActiveSection("cihazlar")}
                    style={{
                        background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                    className="glow-teal card-hover"
                >
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sistem Entegrasyonu</span>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: "white", marginTop: 4 }}>
                            {devices.length - uncalibratedDevicesCount}/{devices.length} Cal
                        </h2>
                        <span style={{ fontSize: 11, color: uncalibratedDevicesCount > 0 ? C.orange : C.green, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <span className="pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: uncalibratedDevicesCount > 0 ? C.orange : C.green }} />
                            {uncalibratedDevicesCount > 0 ? "Kalibrasyon gerektiren cihaz var!" : "Tüm cihazlar kalibre edildi"}
                        </span>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.orange }}>
                        <FiCpu size={20} />
                    </div>
                </div>
            </section>

            {/* ══════════════ DASHBOARD CONTENT ══════════════ */}
            <main style={{ flex: 1, padding: "28px", maxWidth: 1400, width: "100%", margin: "0 auto" }}>
                {/* Error Banner */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                        padding: "16px", borderRadius: 14, color: "#f87171",
                        display: "flex", alignItems: "center", gap: 10, marginBottom: 24, fontSize: 14
                    }}>
                        <FiAlertTriangle size={18} /> {error}
                    </div>
                )}

                {/* Grid Layout */}
                <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "28px", alignItems: "start" }}>
                    
                    {/* LEFT MENU (Sidebar Filter) */}
                    <div style={{
                        background: C.bgCard,
                        border: `1px solid ${C.border}`,
                        borderRadius: 18,
                        padding: 16,
                        display: "flex", flexDirection: "column", gap: 20
                    }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, paddingLeft: 8 }}>
                                Menü / Bölüm
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <button
                                    onClick={() => setActiveSection("islistesi")}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        width: "100%", padding: "12px 14px", borderRadius: 12,
                                        border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                                        background: activeSection === "islistesi" ? "rgba(20, 184, 166, 0.08)" : "transparent",
                                        color: activeSection === "islistesi" ? C.teal : C.muted,
                                        borderLeft: activeSection === "islistesi" ? `3px solid ${C.teal}` : "3px solid transparent",
                                        textAlign: "left", transition: "all 0.2s"
                                    }}
                                >
                                    <FiList size={16} /> İş Listesi (Bekleyen)
                                    {totalPendingCount > 0 && (
                                        <span style={{
                                            marginLeft: "auto", fontSize: 10, fontWeight: 800,
                                            padding: "2px 8px", borderRadius: 999, background: C.teal, color: "white"
                                        }}>
                                            {totalPendingCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveSection("gecmis")}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        width: "100%", padding: "12px 14px", borderRadius: 12,
                                        border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                                        background: activeSection === "gecmis" ? "rgba(20, 184, 166, 0.08)" : "transparent",
                                        color: activeSection === "gecmis" ? C.teal : C.muted,
                                        borderLeft: activeSection === "gecmis" ? `3px solid ${C.teal}` : "3px solid transparent",
                                        textAlign: "left", transition: "all 0.2s"
                                    }}
                                >
                                    <FiCheckCircle size={16} /> Tamamlanan Testler
                                </button>
                                
                                <button
                                    onClick={() => setActiveSection("cihazlar")}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        width: "100%", padding: "12px 14px", borderRadius: 12,
                                        border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                                        background: activeSection === "cihazlar" ? "rgba(20, 184, 166, 0.08)" : "transparent",
                                        color: activeSection === "cihazlar" ? C.teal : C.muted,
                                        borderLeft: activeSection === "cihazlar" ? `3px solid ${C.teal}` : "3px solid transparent",
                                        textAlign: "left", transition: "all 0.2s"
                                    }}
                                >
                                    <FiCpu size={16} /> Cihaz Kontrolü
                                    {uncalibratedDevicesCount > 0 && (
                                        <span className="pulse-red" style={{
                                            marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: C.orange
                                        }} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {activeSection !== "cihazlar" && (
                            <>
                                <div style={{ height: "1px", background: C.border }} />
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, paddingLeft: 8 }}>
                                        Branş Filtresi
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <button
                                            onClick={() => setActiveTab("lab")}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                width: "100%", padding: "12px 14px", borderRadius: 12,
                                                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                                                background: activeTab === "lab" ? "rgba(20, 184, 166, 0.08)" : "transparent",
                                                color: activeTab === "lab" ? C.teal : C.muted,
                                                borderLeft: activeTab === "lab" ? `3px solid ${C.teal}` : "3px solid transparent",
                                                textAlign: "left", transition: "all 0.2s"
                                            }}
                                        >
                                            <FiActivity size={16} /> Laboratuvar Analizi
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("radyoloji")}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                width: "100%", padding: "12px 14px", borderRadius: 12,
                                                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                                                background: activeTab === "radyoloji" ? "rgba(20, 184, 166, 0.08)" : "transparent",
                                                color: activeTab === "radyoloji" ? C.teal : C.muted,
                                                borderLeft: activeTab === "radyoloji" ? `3px solid ${C.teal}` : "3px solid transparent",
                                                textAlign: "left", transition: "all 0.2s"
                                            }}
                                        >
                                            <FiImage size={16} /> Radyoloji / Görüntüleme
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT LIST & WORK AREA */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {activeSection === "cihazlar" ? (
                            /* ══════════════ DEVICE CONTROL CENTER ══════════════ */
                            <div>
                                <div style={{ marginBottom: 24 }}>
                                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                                        🔬 Laboratuvar Cihaz & Ekipman Yönetimi
                                    </h1>
                                    <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                                        Sistemdeki analizörlerin, sensörlerin kalibrasyon ve operasyonel sağlık durumlarını anlık yönetin.
                                    </p>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    {devices.map(d => (
                                        <div 
                                            key={d.id}
                                            style={{
                                                background: C.bgCard,
                                                border: `1px solid ${d.calibration.includes("Gerekli") ? "rgba(245,158,11,0.2)" : C.border}`,
                                                borderRadius: 20,
                                                padding: 24,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 16
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                                <div>
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 4,
                                                        background: d.isLab ? "rgba(20,184,166,0.1)" : "rgba(14,165,233,0.1)",
                                                        color: d.isLab ? C.teal : C.cyan,
                                                        textTransform: "uppercase"
                                                    }}>
                                                        {d.isLab ? "Lab Cihazı" : "Radyoloji Cihazı"}
                                                    </span>
                                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", marginTop: 8 }}>{d.name}</h3>
                                                </div>

                                                <span style={{
                                                    fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 8,
                                                    background: d.status === "Aktif" ? "rgba(16,185,129,0.1)" : (d.status === "Beklemede" ? "rgba(255,255,255,0.03)" : "rgba(14,165,233,0.1)"),
                                                    color: d.status === "Aktif" ? C.green : (d.status === "Beklemede" ? C.muted : C.cyan),
                                                    display: "flex", alignItems: "center", gap: 4
                                                }}>
                                                    <span className="pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: d.status === "Aktif" ? C.green : C.muted }} />
                                                    {d.status}
                                                </span>
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "14px", background: "rgba(0,0,0,0.2)", borderRadius: 12, border: `1px solid ${C.border}` }}>
                                                <div>
                                                    <span style={{ fontSize: 10, color: C.muted, display: "block" }}>GÜNLÜK ÇALIŞMA</span>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{d.runs} Test Run</span>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: 10, color: C.muted, display: "block" }}>ISI / BASINÇ SENSÖRÜ</span>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{d.temp}</span>
                                                </div>
                                                <div style={{ gridColumn: "span 2", marginTop: 4 }}>
                                                    <span style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 2 }}>KALİBRASYON DURUMU</span>
                                                    <span style={{ 
                                                        fontSize: 12, fontWeight: 800, 
                                                        color: d.calibration === "Tamamlandı" ? C.green : C.orange 
                                                    }}>
                                                        {d.calibration}
                                                    </span>
                                                </div>
                                            </div>

                                            {calibratingId === d.id ? (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600 }}>
                                                        <span style={{ color: C.teal }}>Kalibrasyon yapılıyor...</span>
                                                        <span>%{calibrationProgress}</span>
                                                    </div>
                                                    <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                                                        <div style={{ width: `${calibrationProgress}%`, height: "100%", background: C.tealGrad, borderRadius: 999, transition: "width 0.15s ease" }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startCalibration(d.id)}
                                                    style={{
                                                        background: d.calibration === "Tamamlandı" ? "rgba(255,255,255,0.02)" : C.tealGrad,
                                                        border: d.calibration === "Tamamlandı" ? `1px solid ${C.border}` : "none",
                                                        padding: "10px 16px",
                                                        borderRadius: 10,
                                                        color: "white",
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        marginTop: "auto",
                                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    <FiZap size={13} />
                                                    {d.calibration === "Tamamlandı" ? "Yeniden Kalibre Et" : "Kalibrasyonu Başlat"}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ══════════════ LIST AREA (PENDING / ARCHIVE) ══════════════ */
                            <>
                                {/* Search and Title Strip */}
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                                    flexWrap: "wrap"
                                }}>
                                    <div>
                                        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                                            {activeSection === "islistesi" ? "Teknisyen Aktif İş Listesi" : "Tamamlanan Test Arşivi"}
                                        </h1>
                                        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                                            {activeTab === "lab" ? "Kimyasal, hormonal, idrar ve kan analizleri" : "Röntgen, MR, BT ve ultrason görüntüleme raporları"}
                                        </p>
                                    </div>

                                    {/* Search bar */}
                                    <div style={{ position: "relative", width: 280 }}>
                                        <span style={{
                                            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                                            color: C.muted, display: "flex", alignItems: "center"
                                        }}>
                                            <FiSearch size={15} />
                                        </span>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Hasta, doktor veya tahlil ara..."
                                            style={{
                                                width: "100%", padding: "10px 14px 10px 38px",
                                                borderRadius: 12, border: `1px solid ${C.border}`,
                                                background: "rgba(255,255,255,0.02)", color: "white",
                                                fontSize: 13, outline: "none", transition: "all 0.2s"
                                            }}
                                            onFocus={e => e.target.style.borderColor = C.teal}
                                            onBlur={e => e.target.style.borderColor = C.border}
                                        />
                                    </div>
                                </div>

                                {/* List rendering */}
                                {loading ? (
                                    <div style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                        height: 300, background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`
                                    }}>
                                        <FiRefreshCw size={24} className="spin" style={{ color: C.teal, marginBottom: 12 }} />
                                        <span style={{ fontSize: 14, color: C.muted }}>Veriler yükleniyor...</span>
                                    </div>
                                ) : filteredList.length === 0 ? (
                                    <div style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                        height: 300, background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`,
                                        padding: 24, textAlign: "center"
                                    }}>
                                        <FiCheckCircle size={36} style={{ color: C.teal, marginBottom: 12, opacity: 0.5 }} />
                                        <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Kayıt Bulunmamaktadır</span>
                                        <span style={{ fontSize: 13, color: C.muted, marginTop: 4, maxWidth: 300 }}>
                                            Şu anda filtrelenmiş aramanıza veya listenize uygun kayıt bulunamadı.
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                                        {filteredList.map((item) => {
                                            const isAccepted = acceptedSamples[item._id] === "processing";
                                            return (
                                                <div
                                                    key={item._id}
                                                    style={{
                                                        background: C.bgCard,
                                                        border: `1px solid ${C.border}`,
                                                        borderRadius: 16,
                                                        padding: "20px 24px",
                                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                                        gap: 20, transition: "all 0.2s"
                                                    }}
                                                    className="card-hover glow-teal"
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                                        {/* Icon type */}
                                                        <div style={{
                                                            width: 48, height: 48,
                                                            borderRadius: 14,
                                                            background: item.status === "beklemede" 
                                                                ? "rgba(14, 165, 233, 0.08)" 
                                                                : (item.status === "anormal" ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)"),
                                                            border: `1px solid ${item.status === "beklemede" ? "rgba(14,165,233,0.15)" : (item.status === "anormal" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)")}`,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: item.status === "beklemede" ? C.cyan : (item.status === "anormal" ? C.red : C.green)
                                                        }}>
                                                            {activeTab === "lab" ? <FiActivity size={20} /> : <FiImage size={20} />}
                                                        </div>

                                                        {/* Info */}
                                                        <div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                                                <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>
                                                                    {item.patientId?.name || "Belirsiz Hasta"}
                                                                </span>
                                                                <span style={{ fontSize: 11, color: C.muted }}>
                                                                    ({item.patientId?.age} Yaş, {item.patientId?.gender})
                                                                </span>
                                                                
                                                                {/* Specimen / Pulse label */}
                                                                {item.status === "beklemede" && (
                                                                    <span style={{
                                                                        fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 4,
                                                                        background: isAccepted ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                                                        color: isAccepted ? C.green : C.orange,
                                                                        display: "inline-flex", alignItems: "center", gap: 4
                                                                    }}>
                                                                        <span className={isAccepted ? "pulse-green" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: isAccepted ? C.green : C.orange }} />
                                                                        {isAccepted ? "Numune Cihazda / Analiz Ediliyor" : "Numune Bekleniyor"}
                                                                    </span>
                                                                )}

                                                                {item.status === "anormal" && (
                                                                    <span style={{
                                                                        fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4,
                                                                        background: "rgba(239,68,68,0.1)", color: C.red, display: "inline-flex", alignItems: "center", gap: 3
                                                                    }}>
                                                                        <FiAlertTriangle size={10} /> ANORMAL BULGU
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div style={{ display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap" }}>
                                                                <div style={{ fontSize: 12, color: C.muted }}>
                                                                    <span style={{ color: "rgba(255,255,255,0.4)" }}>İstek Yapan:</span> {item.doctorId?.name} ({item.doctorId?.specialty})
                                                                </div>
                                                                <div style={{ fontSize: 12, color: C.muted }}>
                                                                    <span style={{ color: "rgba(255,255,255,0.4)" }}>İşlem:</span> {item.testName || `${item.imagingType} (${item.bodyPart})`}
                                                                </div>
                                                                <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                                                                    <FiClock size={12} /> {new Date(item.date).toLocaleDateString("tr-TR")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div>
                                                        {item.status === "beklemede" ? (
                                                            !isAccepted ? (
                                                                <button
                                                                    onClick={() => setScanningItemId(item._id)}
                                                                    style={{
                                                                        background: C.tealGrad,
                                                                        border: "none", borderRadius: 10,
                                                                        padding: "10px 18px", color: "white",
                                                                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                                                                        display: "flex", alignItems: "center", gap: 6,
                                                                        boxShadow: "0 4px 14px rgba(20, 184, 166, 0.2)",
                                                                        transition: "all 0.2s"
                                                                    }}
                                                                >
                                                                    Numune Barkod Okut <FiZap size={14} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => activeTab === "lab" ? handleOpenLab(item) : handleOpenRadiology(item)}
                                                                    style={{
                                                                        background: "linear-gradient(135deg, #10b981, #059669)",
                                                                        border: "none", borderRadius: 10,
                                                                        padding: "10px 18px", color: "white",
                                                                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                                                                        display: "flex", alignItems: "center", gap: 6,
                                                                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
                                                                        transition: "all 0.2s"
                                                                    }}
                                                                >
                                                                    Sonuç Gir <FiChevronRight size={14} />
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button
                                                                onClick={() => activeTab === "lab" ? handleOpenLab(item) : handleOpenRadiology(item)}
                                                                style={{
                                                                    background: "rgba(255,255,255,0.03)",
                                                                    border: `1px solid ${C.border}`, borderRadius: 10,
                                                                    padding: "8px 14px", color: C.muted,
                                                                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                                                                    display: "flex", alignItems: "center", gap: 6,
                                                                    transition: "all 0.2s"
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "white"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = C.muted; }}
                                                            >
                                                                Raporu İncele <FiFileText size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* ══════════════ VIRTUAL BARCODE SCANNER MODAL OVERLAY ══════════════ */}
            {scanningItemId && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1100,
                    background: "rgba(3, 4, 10, 0.9)", backdropFilter: "blur(16px)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div style={{
                        background: "#070a1a",
                        border: `1px solid ${isScanComplete ? C.teal : C.cyan}`,
                        borderRadius: 24, width: "100%", maxWidth: 420,
                        padding: 32, textAlign: "center",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(20,184,166,0.05)",
                        position: "relative"
                    }}>
                        <button
                            onClick={() => setScanningItemId(null)}
                            style={{
                                position: "absolute", top: 20, right: 20,
                                background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer"
                            }}
                        >
                            ✕
                        </button>

                        <span style={{
                            fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 4,
                            background: isScanComplete ? "rgba(16,185,129,0.1)" : "rgba(14,165,233,0.1)",
                            color: isScanComplete ? C.green : C.cyan, letterSpacing: "0.06em", display: "inline-block",
                            marginBottom: 16
                        }}>
                            BARKOD TARAMA SİSTEMİ
                        </span>

                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 6 }}>
                            {activeTab === "lab" ? "Numune Tüpü Taraması" : "PACS Görüntüleme Talebi"}
                        </h3>
                        <p style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>
                            {activeTab === "lab" 
                                ? "Kan/idrar numunesinin barkod kodunu lazer okuyucuya hizalayın." 
                                : "Doktor radyoloji istek formunun barkodunu tarayıcıya yaklaştırın."}
                        </p>

                        {/* Scanner Laser Window */}
                        <div style={{
                            position: "relative",
                            height: 160, background: "#03040a",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderRadius: 16, display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", overflow: "hidden",
                            marginBottom: 24
                        }}>
                            {/* Scanning Laser Line */}
                            {!isScanComplete && <div className="scanner-line" />}

                            {/* Dummy Barcode lines */}
                            <div style={{ display: "flex", gap: 3, alignItems: "center", height: 50, opacity: isScanComplete ? 0.3 : 0.8 }}>
                                {[2, 5, 1, 4, 7, 2, 9, 3, 1, 5, 3, 2, 6, 2, 4, 1].map((w, i) => (
                                    <div key={i} style={{ width: w, height: "100%", background: isScanComplete ? C.green : "white" }} />
                                ))}
                            </div>
                            <span style={{ fontSize: 10, fontFamily: "monospace", color: C.muted, marginTop: 12 }}>
                                CODE-ID: {scanningItemId.slice(-10).toUpperCase()}
                            </span>
                        </div>

                        <div>
                            {isScanComplete ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>✓ DOĞRULAMA BAŞARILI!</span>
                                    <span style={{ fontSize: 11, color: C.muted }}>Numune kabul edildi, analizör aktif.</span>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                    <span className="pulse-green" style={{ fontSize: 12, color: C.cyan, fontWeight: 600 }}>Tarama yapılıyor, lütfen bekleyin...</span>
                                    <span style={{ fontSize: 10, color: C.muted }}>PACS / Cihaz güvenli el sıkışma (handshake)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ MODAL: LAB RESULTS ENTRY (SPLIT-SCREEN INTERRUPT) ══════════════ */}
            {selectedLab && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(3, 4, 10, 0.8)", backdropFilter: "blur(12px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 24
                }}>
                    <div style={{
                        background: C.bgCardDark,
                        border: "1px solid rgba(20,184,166,0.2)",
                        borderRadius: 24, width: "100%", maxWidth: 1120,
                        maxHeight: "92vh", overflowY: "auto",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(20,184,166,0.05)",
                        padding: 32
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <div>
                                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(20,184,166,0.1)", color: C.teal, letterSpacing: "0.06em" }}>
                                    KLİNİK LABORATUVAR TAHLİL SONUCU VE DEĞERLENDİRME
                                </span>
                                <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", marginTop: 4 }}>
                                    {selectedLab.testName}
                                </h2>
                                <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                                    Hasta: <b>{selectedLab.patientId?.name}</b> | Doktor: <b>{selectedLab.doctorId?.name}</b>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLab(null)}
                                style={{
                                    background: "rgba(255,255,255,0.03)", border: "none",
                                    color: C.muted, width: 32, height: 32, borderRadius: "50%",
                                    cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Split Screen Grid Layout */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "28px", alignItems: "start" }}>
                            
                            {/* LEFT SIDE: Entry Form */}
                            <form onSubmit={handleSubmitLab} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                
                                {/* Device info / generic status */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>Tahlil Cihazı / Lab Konumu</label>
                                        <input
                                            type="text"
                                            value={labName}
                                            onChange={(e) => setLabName(e.target.value)}
                                            style={{
                                                padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                                background: "rgba(0,0,0,0.2)", color: "white", fontSize: 13, outline: "none"
                                            }}
                                            disabled={selectedLab.status !== "beklemede"}
                                            required
                                        />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>Değerlendirme Sınıfı</label>
                                        <select
                                            value={labStatus}
                                            onChange={(e) => setLabStatus(e.target.value)}
                                            style={{
                                                padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                                background: "#070917", color: "white", fontSize: 13, outline: "none"
                                            }}
                                            disabled={selectedLab.status !== "beklemede"}
                                        >
                                            <option value="tamamlandı">Normal (Referans Değerler Dahilinde)</option>
                                            <option value="anormal">Risk Grubu / Anormal Bulgular</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Parameters dynamic grid */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <label style={{ fontSize: 12, fontWeight: 800, color: "white" }}>Bulgular (Kan/İdrar Parametre Girişi)</label>
                                        {selectedLab.status === "beklemede" && (
                                            <button
                                                type="button"
                                                onClick={addParamRow}
                                                style={{
                                                    background: "rgba(20,184,166,0.1)", border: `1px solid ${C.teal}`,
                                                    color: C.teal, padding: "4px 10px", borderRadius: 8,
                                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                                    display: "flex", alignItems: "center", gap: 4
                                                }}
                                            >
                                                <FiPlus size={12} /> Parametre Ekle
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {/* Param Headers */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 0.8fr 1.2fr 1fr auto", gap: 8, padding: "0 8px", fontSize: 10, fontWeight: 700, color: C.muted }}>
                                            <div>Parametre Adı</div>
                                            <div>Değer</div>
                                            <div>Birim</div>
                                            <div>Ref. Aralık</div>
                                            <div>Durum</div>
                                            <div></div>
                                        </div>

                                        {/* Param Rows */}
                                        {labParams.map((p, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: "grid", gridTemplateColumns: "1.8fr 1fr 0.8fr 1.2fr 1fr auto", gap: 8,
                                                    alignItems: "center", padding: "6px 8px", background: "rgba(0,0,0,0.15)",
                                                    border: `1px solid ${p.isAbnormal ? "rgba(239,68,68,0.25)" : C.border}`,
                                                    borderRadius: 10
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={p.parameter}
                                                    onChange={(e) => updateParam(idx, "parameter", e.target.value)}
                                                    style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.25)", color: "white", fontSize: 12, outline: "none" }}
                                                    disabled={selectedLab.status !== "beklemede"}
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={p.value}
                                                    onChange={(e) => updateParam(idx, "value", e.target.value)}
                                                    style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.25)", color: "white", fontSize: 12, outline: "none" }}
                                                    disabled={selectedLab.status !== "beklemede"}
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={p.unit}
                                                    onChange={(e) => updateParam(idx, "unit", e.target.value)}
                                                    style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.25)", color: "white", fontSize: 12, outline: "none" }}
                                                    disabled={selectedLab.status !== "beklemede"}
                                                />
                                                <input
                                                    type="text"
                                                    value={p.referenceRange}
                                                    onChange={(e) => updateParam(idx, "referenceRange", e.target.value)}
                                                    style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.25)", color: "white", fontSize: 12, outline: "none" }}
                                                    disabled={selectedLab.status !== "beklemede"}
                                                />

                                                {/* Abnormal switch */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={p.isAbnormal}
                                                        onChange={(e) => updateParam(idx, "isAbnormal", e.target.checked)}
                                                        id={`abn-${idx}`}
                                                        style={{ width: 14, height: 14, accentColor: C.red, cursor: selectedLab.status === "beklemede" ? "pointer" : "default" }}
                                                        disabled={selectedLab.status !== "beklemede"}
                                                    />
                                                    <label htmlFor={`abn-${idx}`} style={{ fontSize: 10, color: p.isAbnormal ? C.red : C.muted, fontWeight: 700 }}>
                                                        {p.isAbnormal ? "Yüksek/Alçak" : "Normal"}
                                                    </label>
                                                </div>

                                                {/* Trash */}
                                                {selectedLab.status === "beklemede" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeParamRow(idx)}
                                                        style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex", alignItems: "center" }}
                                                    >
                                                        <FiTrash2 size={13} />
                                                    </button>
                                                ) : <div></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Pager Doctor / Comms Module inside modal */}
                                {labParams.some(p => p.isAbnormal) && (
                                    <div style={{
                                        background: "rgba(239, 68, 68, 0.06)",
                                        border: `1px dashed ${C.borderRed}`,
                                        borderRadius: 14,
                                        padding: 16,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        boxShadow: "0 0 16px rgba(239,68,68,0.06)"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div className="pulse-red" style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />
                                            <div>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: C.red, display: "block" }}>🚨 KRİTİK DEĞER ALARMI DETEKTE EDİLDİ</span>
                                                <span style={{ fontSize: 10, color: C.muted }}>Girdiğiniz bazı değerler normal aralığın dışındadır. Sorumlu hekime kritik kod gönderin.</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => triggerDoctorAlert(selectedLab.doctorId?.name, selectedLab.patientId?.name)}
                                            disabled={isPagerSent}
                                            style={{
                                                background: isPagerSent ? "rgba(16,185,129,0.1)" : C.red,
                                                border: isPagerSent ? `1px solid ${C.green}` : "none",
                                                color: isPagerSent ? C.green : "white",
                                                padding: "6px 12px",
                                                borderRadius: 8,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: isPagerSent ? "default" : "pointer",
                                                display: "flex", alignItems: "center", gap: 4
                                            }}
                                        >
                                            {isPagerSent ? (
                                                <>
                                                    <FiCheckCircle size={12} /> Pager Çağrısı İletildi!
                                                </>
                                            ) : (
                                                <>
                                                    <FiZap size={12} /> Doktora Çağrı Gönder (Pager)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {pagerLog && (
                                    <div style={{
                                        background: "rgba(16,185,129,0.06)", border: `1px solid ${C.borderTeal}`,
                                        padding: "10px 14px", borderRadius: 10, fontSize: 11, fontFamily: "monospace", color: C.green
                                    }}>
                                        {pagerLog}
                                    </div>
                                )}

                                {/* Technician Comments */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>Tahlil Değerlendirme Yorumu</label>
                                    <textarea
                                        value={labNotes}
                                        onChange={(e) => setLabNotes(e.target.value)}
                                        placeholder="Tahlil hakkında hekime iletilecek laboratuvar notu..."
                                        style={{
                                            minHeight: 70, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                            background: "rgba(0,0,0,0.2)", color: "white", fontSize: 13, outline: "none", resize: "vertical"
                                        }}
                                        disabled={selectedLab.status !== "beklemede"}
                                    />
                                </div>

                                {/* Form Footer Buttons */}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLab(null)}
                                        style={{
                                            background: "transparent", border: `1px solid ${C.border}`,
                                            color: C.muted, padding: "12px 20px", borderRadius: 10,
                                            fontSize: 13, fontWeight: 700, cursor: "pointer"
                                        }}
                                    >
                                        Vazgeç / Kapat
                                    </button>
                                    {selectedLab.status === "beklemede" && (
                                        <button
                                            type="submit"
                                            style={{
                                                background: C.tealGrad, border: "none",
                                                color: "white", padding: "12px 24px", borderRadius: 10,
                                                fontSize: 13, fontWeight: 700, cursor: "pointer",
                                                boxShadow: "0 4px 16px rgba(20,184,166,0.3)"
                                            }}
                                        >
                                            Testi Onayla ve Sonucu Gönder
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* RIGHT SIDE: Patient Trend History Tracker */}
                            <div style={{
                                background: "rgba(0,0,0,0.15)",
                                border: `1px solid ${C.border}`,
                                borderRadius: 20,
                                padding: 20,
                                display: "flex",
                                flexDirection: "column",
                                gap: 16
                            }}>
                                <h3 style={{ fontSize: 13, fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                                    <FiTrendingUp size={15} color={C.teal} /> Hastanın Geçmiş Tahlil Trendleri
                                </h3>
                                <p style={{ fontSize: 11, color: C.muted, marginTop: -8 }}>
                                    Hayati değer takibi için son 3 laboratuvar tahlil tarihi ve bulguları.
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {/* Date 1 */}
                                    <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 12, borderLeft: `3px solid ${C.teal}`, border: `1px solid ${C.border}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "white" }}>
                                            <span>12.03.2026</span>
                                            <span style={{ color: C.teal }}>Stabil</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, fontSize: 11, color: C.muted }}>
                                            {selectedLab.testName.toLowerCase().includes("hemogram") || selectedLab.testName.toLowerCase().includes("kan") ? (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>WBC:</span> <span style={{ color: "white" }}>6.8 10^3/uL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>HGB:</span> <span style={{ color: "white" }}>13.5 g/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Plt:</span> <span style={{ color: "white" }}>220 10^3/uL</span></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Glukoz (Şeker):</span> <span style={{ color: "white" }}>88 mg/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Üre:</span> <span style={{ color: "white" }}>22 mg/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Kreatinin:</span> <span style={{ color: "white" }}>0.81 mg/dL</span></div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date 2 */}
                                    <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 12, borderLeft: `3px solid ${C.orange}`, border: `1px solid ${C.border}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "white" }}>
                                            <span>04.01.2026</span>
                                            <span style={{ color: C.orange }}>Hafif Sapma</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, fontSize: 11, color: C.muted }}>
                                            {selectedLab.testName.toLowerCase().includes("hemogram") || selectedLab.testName.toLowerCase().includes("kan") ? (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>WBC:</span> <span style={{ color: "white" }}>10.2 10^3/uL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>HGB:</span> <span style={{ color: "white" }}>12.1 g/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Plt:</span> <span style={{ color: "white" }}>280 10^3/uL</span></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Glukoz (Şeker):</span> <span style={{ color: "white" }}>104 mg/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Üre:</span> <span style={{ color: "white" }}>28 mg/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Kreatinin:</span> <span style={{ color: "white" }}>0.95 mg/dL</span></div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date 3 */}
                                    <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 12, borderLeft: `3px solid ${C.teal}`, border: `1px solid ${C.border}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "white" }}>
                                            <span>15.11.2025</span>
                                            <span style={{ color: C.teal }}>Stabil</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, fontSize: 11, color: C.muted }}>
                                            {selectedLab.testName.toLowerCase().includes("hemogram") || selectedLab.testName.toLowerCase().includes("kan") ? (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>WBC:</span> <span style={{ color: "white" }}>5.9 10^3/uL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>HGB:</span> <span style={{ color: "white" }}>12.9 g/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Plt:</span> <span style={{ color: "white" }}>210 10^3/uL</span></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Glukoz (Şeker):</span> <span style={{ color: "white" }}>90 mg/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Üre:</span> <span style={{ color: "white" }}>21 mg/dL</span></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Kreatinin:</span> <span style={{ color: "white" }}>0.78 mg/dL</span></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: "auto", padding: 12, borderRadius: 10, background: "rgba(20,184,166,0.05)",
                                    border: `1px solid ${C.borderTeal}`, display: "flex", gap: 10, alignItems: "center"
                                }}>
                                    <div style={{ color: C.teal }}><FiActivity size={18} /></div>
                                    <div style={{ fontSize: 10, color: C.text, lineHeight: "1.3" }}>
                                        <span style={{ fontWeight: 800, display: "block" }}>Klinik Sapma Kontrolü</span>
                                        Hücresel dalgalanma stabil. Sonuç girdisi otomatik kalibre sensörlerden doğrulanmıştır.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ MODAL: RADIOLOGY FINDINGS ══════════════ */}
            {selectedRadiology && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(3, 4, 10, 0.8)", backdropFilter: "blur(12px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 24
                }}>
                    <div style={{
                        background: C.bgCardDark,
                        border: "1px solid rgba(20,184,166,0.2)",
                        borderRadius: 24, width: "100%", maxWidth: 840,
                        maxHeight: "90vh", overflowY: "auto",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(20,184,166,0.05)",
                        padding: 32
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <div>
                                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(20,184,166,0.1)", color: C.teal, letterSpacing: "0.06em" }}>
                                    RADYOLOJİ GÖRÜNTÜLEME VE RAPOR RAPORU
                                </span>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: "white", marginTop: 4 }}>
                                    {selectedRadiology.imagingType} - {selectedRadiology.bodyPart}
                                </h2>
                                <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                                    Hasta: <b>{selectedRadiology.patientId?.name}</b> | Doktor: <b>{selectedRadiology.doctorId?.name}</b>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRadiology(null)}
                                style={{
                                    background: "rgba(255,255,255,0.03)", border: "none",
                                    color: C.muted, width: 32, height: 32, borderRadius: "50%",
                                    cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRadiology} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            
                            {/* Dummy Image scan */}
                            <div style={{
                                position: "relative",
                                background: "#03040c", border: `1px solid ${C.border}`,
                                borderRadius: 16, height: 180, display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center", gap: 8, color: C.muted, overflow: "hidden"
                            }}>
                                <FiImage size={32} style={{ color: C.teal, opacity: 0.7 }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>PACS / Görüntüleme Sistemi Entegre</span>
                                <span style={{ fontSize: 11, color: C.muted }}>Görüntü ID: PACSCAN-2026-X8472.DCM</span>
                            </div>

                            {/* Status and Notes */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>Genel Teşhis Durumu</label>
                                    <select
                                        value={radStatus}
                                        onChange={(e) => setRadStatus(e.target.value)}
                                        style={{
                                            padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                            background: "#070917", color: "white", fontSize: 13, outline: "none"
                                        }}
                                        disabled={selectedRadiology.status !== "beklemede"}
                                    >
                                        <option value="tamamlandı">Normal (Temiz Görüntüleme)</option>
                                        <option value="anormal">Anormal (Patolojik Bulgular Saptandı)</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>İstek Notları (Doktor)</label>
                                    <input
                                        type="text"
                                        value={selectedRadiology.notes || "Doktor notu bulunmuyor."}
                                        style={{
                                            padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                            background: "rgba(255,255,255,0.01)", color: C.muted, fontSize: 13, outline: "none"
                                        }}
                                        disabled
                                    />
                                </div>
                            </div>

                            {/* Findings text area */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>Bulgular (Findings)</label>
                                <textarea
                                    value={radFindings}
                                    onChange={(e) => setRadFindings(e.target.value)}
                                    placeholder="Rapor bulgularını buraya detaylandırın..."
                                    style={{
                                        minHeight: 100, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                        background: "rgba(255,255,255,0.02)", color: "white", fontSize: 13, outline: "none", resize: "vertical"
                                    }}
                                    disabled={selectedRadiology.status !== "beklemede"}
                                    required
                                />
                            </div>

                            {/* Impression text area */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>İzlenim / Yorum (Impression)</label>
                                <textarea
                                    value={radImpression}
                                    onChange={(e) => setRadImpression(e.target.value)}
                                    placeholder="Radyolojik sonuç ve ana izlenimi buraya yazın..."
                                    style={{
                                        minHeight: 70, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                        background: "rgba(255,255,255,0.02)", color: "white", fontSize: 13, outline: "none", resize: "vertical"
                                    }}
                                    disabled={selectedRadiology.status !== "beklemede"}
                                    required
                                />
                            </div>

                            {/* Pager Doctor / Comms Module inside radiology modal */}
                            {radStatus === "anormal" && (
                                <div style={{
                                    background: "rgba(239, 68, 68, 0.06)",
                                    border: `1px dashed ${C.borderRed}`,
                                    borderRadius: 14,
                                    padding: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    boxShadow: "0 0 16px rgba(239,68,68,0.06)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div className="pulse-red" style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />
                                        <div>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: C.red, display: "block" }}>🚨 RADYOLOJİK KRİTİK SEVİYE UYARISI</span>
                                            <span style={{ fontSize: 10, color: C.muted }}>Teşhis patolojik/anormal bulgu içermektedir. Sorumlu hekime acil bildirim gönderilsin mi?</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => triggerDoctorAlert(selectedRadiology.doctorId?.name, selectedRadiology.patientId?.name)}
                                        disabled={isPagerSent}
                                        style={{
                                            background: isPagerSent ? "rgba(16,185,129,0.1)" : C.red,
                                            border: isPagerSent ? `1px solid ${C.green}` : "none",
                                            color: isPagerSent ? C.green : "white",
                                            padding: "6px 12px",
                                            borderRadius: 8,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: isPagerSent ? "default" : "pointer",
                                            display: "flex", alignItems: "center", gap: 4
                                        }}
                                    >
                                        {isPagerSent ? (
                                            <>
                                                <FiCheckCircle size={12} /> Pager Çağrısı İletildi!
                                            </>
                                        ) : (
                                            <>
                                                <FiZap size={12} /> Doktora Çağrı Gönder (Pager)
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {pagerLog && (
                                <div style={{
                                    background: "rgba(16,185,129,0.06)", border: `1px solid ${C.borderTeal}`,
                                    padding: "10px 14px", borderRadius: 10, fontSize: 11, fontFamily: "monospace", color: C.green
                                }}>
                                    {pagerLog}
                                </div>
                            )}

                            {/* Technologist Notes */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>Teknisyen Rapor Ek Notları</label>
                                <textarea
                                    value={radNotes}
                                    onChange={(e) => setRadNotes(e.target.value)}
                                    placeholder="Hizmet, çekim kalitesi ve teknik radyolojik notlar..."
                                    style={{
                                        minHeight: 60, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
                                        background: "rgba(255,255,255,0.02)", color: "white", fontSize: 13, outline: "none", resize: "vertical"
                                    }}
                                    disabled={selectedRadiology.status !== "beklemede"}
                                />
                            </div>

                            {/* Buttons */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRadiology(null)}
                                    style={{
                                        background: "transparent", border: `1px solid ${C.border}`,
                                        color: C.muted, padding: "12px 20px", borderRadius: 10,
                                        fontSize: 13, fontWeight: 700, cursor: "pointer"
                                    }}
                                >
                                    Vazgeç / Kapat
                                </button>
                                {selectedRadiology.status === "beklemede" && (
                                    <button
                                        type="submit"
                                        style={{
                                            background: C.tealGrad, border: "none",
                                            color: "white", padding: "12px 24px", borderRadius: 10,
                                            fontSize: 13, fontWeight: 700, cursor: "pointer",
                                            boxShadow: "0 4px 16px rgba(20,184,166,0.3)"
                                        }}
                                    >
                                        Raporu Kaydet ve Tamamla
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .card-hover:hover {
                    background: rgba(255, 255, 255, 0.04) !important;
                    border-color: rgba(20, 184, 166, 0.25) !important;
                }
                .glow-teal:hover {
                    box-shadow: 0 0 20px rgba(20, 184, 166, 0.1) !important;
                    border-color: rgba(20, 184, 166, 0.2) !important;
                }
                .spin {
                    animation: spin-anim 1s linear infinite;
                }
                @keyframes spin-anim {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .pulse-red {
                    animation: pulse-red-anim 1.5s infinite ease-in-out;
                }
                @keyframes pulse-red-anim {
                    0%, 100% { opacity: 0.6; transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 8px 4px rgba(239, 68, 68, 0.2); }
                }
                .pulse-green {
                    animation: pulse-green-anim 1.5s infinite ease-in-out;
                }
                @keyframes pulse-green-anim {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.15); }
                }
                .scanner-line {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: rgba(14, 165, 233, 0.8);
                    box-shadow: 0 0 10px 3px rgba(14, 165, 233, 0.6);
                    animation: scan-anim 2s infinite ease-in-out;
                }
                @keyframes scan-anim {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
            `}</style>
        </div>
    );
}

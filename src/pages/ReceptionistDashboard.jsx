import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReceptionistAuth } from "../context/ReceptionistAuthContext";
import {
    FiSearch, FiActivity, FiLogOut, FiUsers, FiCalendar,
    FiPlus, FiCheckCircle, FiRefreshCw, FiZap, FiDollarSign,
    FiClock, FiUser, FiInfo, FiChevronRight, FiGrid, FiX, FiAlertTriangle,
    FiPrinter, FiCamera
} from "react-icons/fi";
import toast from "react-hot-toast";

// Curated Ultra-Premium Color Palette (Next-Gen Medical SaaS theme)
const C = {
    bg: "#f3f4f6", // Neutral soft backdrop
    glassBg: "rgba(255, 255, 255, 0.75)",
    glassBorder: "rgba(255, 255, 255, 0.6)",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    primary: "#7c3aed", // Rich Violet
    primaryLight: "#a78bfa",
    primaryVeryLight: "#f5f3ff",
    primaryGrad: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
    primaryGlow: "rgba(124, 58, 237, 0.18)",
    text: "#0f172a", // Slate 900
    textMuted: "#475569", // Slate 600
    muted: "#94a3b8", // Slate 400
    emerald: "#10b981",
    emeraldDark: "#047857",
    emeraldLight: "#d1fae5",
    emeraldGlow: "rgba(16, 185, 129, 0.18)",
    red: "#ef4444",
    redLight: "#fee2e2",
    redDark: "#b91c1c",
    redGlow: "rgba(239, 68, 68, 0.18)",
    orange: "#f59e0b",
    orangeLight: "#fffbeb",
    orangeGlow: "rgba(245, 158, 11, 0.18)",
    blue: "#3b82f6",
    blueLight: "#eff6ff",
    blueGlow: "rgba(59, 130, 246, 0.18)"
};

export default function ReceptionistDashboard() {
    const navigate = useNavigate();
    const { user, token, logout } = useReceptionistAuth();

    // Navigation & View State
    const [activeSection, setActiveSection] = useState("appointments"); // 'appointments', 'patients', 'queue'
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    // Data State
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [stats, setStats] = useState({
        totalPatients: 0,
        todayAppointments: 0,
        pendingQueue: 0,
        totalRevenue: 0
    });

    // Modals Open State
    const [patientModalOpen, setPatientModalOpen] = useState(false);
    const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

    // Form States
    const [patientForm, setPatientForm] = useState({
        name: "",
        age: "",
        gender: "Erkek",
        tc: "",
        email: "",
        phone: "",
        bloodType: "A+"
    });

    const [appointmentForm, setAppointmentForm] = useState({
        patientId: "",
        doctorId: "",
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        type: "İlk Muayene",
        notes: "",
        fee: 500
    });

    const [printData, setPrintData] = useState(null);
    const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const barcodeInputRef = useRef(null);

    const handlePrint = (type, appointment) => {
        setPrintData({ type, appointment });
        setTimeout(() => {
            window.print();
            setPrintData(null);
        }, 150);
    };

    const handleBarcodeSubmit = (e) => {
        if (e) e.preventDefault();
        const cleanedInput = barcodeInput.trim();
        if (!cleanedInput) return;

        const todayStr = new Date().toISOString().split("T")[0];
        
        const app = appointments.find(a => {
            const appDateStr = new Date(a.date).toISOString().split("T")[0];
            const matchesPatient = a.patientId?.tc === cleanedInput || a._id === cleanedInput;
            return matchesPatient && appDateStr === todayStr;
        });

        if (app) {
            toast.success(`Barkod doğrulandı: ${app.patientId?.name}`);
            handleCheckIn(app._id);
            setBarcodeModalOpen(false);
            setBarcodeInput("");
        } else {
            toast.error("Aktif randevu bulunamadı veya geçersiz barkod.");
        }
    };

    useEffect(() => {
        if (barcodeModalOpen && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [barcodeModalOpen]);

    // Live clock state
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const clockTimer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(clockTimer);
    }, []);

    const getGreeting = () => {
        const hr = currentTime.getHours();
        if (hr < 12) return "Günaydın";
        if (hr < 18) return "İyi Günler";
        return "İyi Akşamlar";
    };

    const formatDoctorName = (name) => {
        if (!name) return "";
        if (name.toLowerCase().startsWith("dr.") || name.toLowerCase().startsWith("dr ")) {
            return name;
        }
        return `Dr. ${name}`;
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch("/api/patients", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPatients(data);
                return data;
            }
        } catch (e) {
            console.error("Patients fetching error", e);
        }
        return [];
    };

    const fetchAppointments = async () => {
        try {
            const res = await fetch("/api/appointments", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setAppointments(data);
                return data;
            }
        } catch (e) {
            console.error("Appointments fetching error", e);
        }
        return [];
    };

    const fetchDoctors = async () => {
        try {
            const res = await fetch("/api/patient-portal/doctors", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setDoctors(data);
        } catch (e) {
            console.error("Doctors fetching error", e);
        }
    };

    const calculateStats = (patientsList, appointmentsList) => {
        const todayStr = new Date().toISOString().split("T")[0];
        
        const todayAppts = appointmentsList.filter(app => {
            const appDateStr = new Date(app.date).toISOString().split("T")[0];
            return appDateStr === todayStr;
        });

        const pending = todayAppts.filter(app => app.status === "bekliyor").length;

        const revenue = appointmentsList
            .filter(app => app.paymentStatus === "paid")
            .reduce((sum, app) => sum + (app.fee || 500), 0);

        setStats({
            totalPatients: patientsList.length,
            todayAppointments: todayAppts.length,
            pendingQueue: pending,
            totalRevenue: revenue
        });
    };

    const refreshData = async () => {
        setLoading(true);
        const pList = await fetchPatients();
        const aList = await fetchAppointments();
        await fetchDoctors();
        calculateStats(pList, aList);
        setLoading(false);
    };

    useEffect(() => {
        if (!token) {
            navigate("/danisma/giris");
            return;
        }
        refreshData();
    }, [token, navigate]);

    const handleLogout = () => {
        logout();
        toast.success("Oturum kapatıldı");
        navigate("/danisma/giris");
    };

    const handleCreatePatient = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/patients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...patientForm,
                    age: Number(patientForm.age)
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Hasta kaydı başarısız.");

            toast.success("Yeni hasta başarıyla kaydedildi!");
            setPatientModalOpen(false);
            setPatientForm({ name: "", age: "", gender: "Erkek", tc: "", email: "", phone: "", bloodType: "A+" });
            refreshData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(appointmentForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Randevu oluşturulamadı.");

            toast.success("Randevu başarıyla oluşturuldu!");
            setAppointmentModalOpen(false);
            setAppointmentForm({
                patientId: "",
                doctorId: "",
                date: new Date().toISOString().split("T")[0],
                time: "09:00",
                type: "İlk Muayene",
                notes: "",
                fee: 500
            });
            refreshData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleCollectPayment = async (appointmentId) => {
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ paymentStatus: "paid" })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ödeme kaydı başarısız.");

            toast.success("Muayene ücreti tahsil edildi!");
            const app = appointments.find(a => a._id === appointmentId);
            if (app) {
                handlePrint("receipt", { ...app, paymentStatus: "paid" });
            }
            refreshData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: "iptal" })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Randevu iptal edilemedi.");

            toast.success("Randevu iptal edildi.");
            refreshData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleCheckIn = async (appointmentId) => {
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: "bekliyor" })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Giriş işlemi başarısız.");

            toast.success("Hasta bekleme sırasına alındı!");
            const app = appointments.find(a => a._id === appointmentId);
            if (app) {
                handlePrint("ticket", { ...app, status: "bekliyor" });
            }
            refreshData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleTogglePriority = async (appointment) => {
        const newType = appointment.type === "Acil" ? "İlk Muayene" : "Acil";
        try {
            const res = await fetch(`/api/appointments/${appointment._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ type: newType })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Öncelik güncellemesi başarısız.");

            toast.success(newType === "Acil" ? "Hasta acil olarak önceliklendirildi!" : "Hasta normal sıraya alındı.");
            refreshData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const filteredPatients = patients.filter(p => {
        const query = searchQuery.toLowerCase();
        return (p.name || "").toLowerCase().includes(query) ||
               (p.tc || "").includes(query) ||
               (p.phone || "").includes(query);
    });

    const filteredAppointments = appointments.filter(app => {
        const query = searchQuery.toLowerCase();
        const patientName = app.patientId?.name || "";
        const doctorName = app.doctorId?.name || "";
        const statusMatch = searchQuery ? (
            patientName.toLowerCase().includes(query) || 
            doctorName.toLowerCase().includes(query) ||
            (app.time || "").includes(query)
        ) : true;
        return statusMatch;
    });

    const todayStr = new Date().toISOString().split("T")[0];
    const todayQueue = appointments.filter(app => {
        const appDateStr = new Date(app.date).toISOString().split("T")[0];
        return appDateStr === todayStr && app.status === "bekliyor";
    });

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(120% 120% at 50% 0%, #fefeff 0%, #f4f6fc 100%)`,
            color: C.text,
            fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
            padding: "28px 40px",
            position: "relative",
            overflowX: "hidden"
        }}>
            {/* Embed State-of-the-Art CSS Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    html, body {
                        background: #fff !important;
                        color: #000 !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible !important;
                        display: block !important;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 76mm;
                        margin: 0;
                        padding: 8px;
                        box-sizing: border-box;
                    }
                }
                @keyframes scan-laser {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 1; }
                    100% { top: 0%; opacity: 0.8; }
                }
                .scanner-viewfinder {
                    position: relative;
                    width: 100%;
                    height: 160px;
                    background: #0f172a;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 2px solid #7c3aed;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
                }
                .scanner-laser {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: rgba(239, 68, 68, 0.85);
                    box-shadow: 0 0 12px #ef4444, 0 0 4px #ef4444;
                    animation: scan-laser 2.5s infinite ease-in-out;
                }
                .scanner-corner {
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    border: 3px solid #7c3aed;
                }
                .scanner-corner.top-left { top: 12px; left: 12px; border-right: none; border-bottom: none; }
                .scanner-corner.top-right { top: 12px; right: 12px; border-left: none; border-bottom: none; }
                .scanner-corner.bottom-left { bottom: 12px; left: 12px; border-right: none; border-top: none; }
                .scanner-corner.bottom-right { bottom: 12px; right: 12px; border-left: none; border-top: none; }
                @keyframes pulse-dot {
                    0% { transform: scale(0.9); opacity: 0.6; }
                    50% { transform: scale(1.15); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.6; }
                }
                @keyframes float-blob {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-15px) scale(1.03); }
                }
                @keyframes entryUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .mesh-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                    pointer-events: none;
                    animation: float-blob 8s infinite ease-in-out;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid ${C.glassBorder};
                    border-radius: 24px;
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-card:hover {
                    background: rgba(255, 255, 255, 0.85);
                    border-color: #cbd8f5;
                }
                .pulse-live {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: ${C.red};
                    animation: pulse-dot 1.8s infinite ease-in-out;
                    box-shadow: 0 0 8px ${C.red};
                }
                .sidebar-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 14px 20px;
                    border-radius: 16px;
                    border: none;
                    background: transparent;
                    color: ${C.textMuted};
                    font-size: 13.5px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .sidebar-btn:hover {
                    background: rgba(124, 58, 237, 0.05);
                    color: ${C.primary};
                }
                .sidebar-btn.active {
                    background: ${C.primaryGrad};
                    color: white;
                    box-shadow: 0 8px 20px ${C.primaryGlow};
                }
                .modern-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 13px 26px;
                    background: ${C.primaryGrad};
                    color: white;
                    border: none;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 6px 16px ${C.primaryGlow};
                }
                .modern-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
                }
                .glow-card {
                    background: rgba(255, 255, 255, 0.8);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 24px;
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.015);
                }
                .glow-card:hover {
                    background: #ffffff;
                    transform: translateY(-4px);
                    border-color: rgba(124, 58, 237, 0.25);
                }
                .glow-card.violet:hover { box-shadow: 0 20px 40px ${C.primaryGlow}; }
                .glow-card.blue:hover { box-shadow: 0 20px 40px ${C.blueGlow}; }
                .glow-card.orange:hover { box-shadow: 0 20px 40px ${C.orangeGlow}; }
                .glow-card.emerald:hover { box-shadow: 0 20px 40px ${C.emeraldGlow}; }

                .floating-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 12px;
                }
                .floating-table th {
                    color: ${C.muted};
                    font-weight: 800;
                    font-size: 11px;
                    padding: 8px 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .floating-row {
                    background: white;
                    border-radius: 20px;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.015);
                    position: relative;
                }
                .floating-row td {
                    padding: 18px 20px;
                    border-top: 1px solid rgba(226, 232, 240, 0.6);
                    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
                    font-size: 14px;
                }
                .floating-row td:first-child {
                    border-left: 1px solid rgba(226, 232, 240, 0.6);
                    border-top-left-radius: 20px;
                    border-bottom-left-radius: 20px;
                }
                .floating-row td:last-child {
                    border-right: 1px solid rgba(226, 232, 240, 0.6);
                    border-top-right-radius: 20px;
                    border-bottom-right-radius: 20px;
                }
                .floating-row:hover {
                    transform: translateY(-2px) scale(1.005);
                    box-shadow: 0 12px 28px rgba(109, 40, 217, 0.045);
                    border-color: rgba(124, 58, 237, 0.15);
                }
                
                /* Border indicators based on appointment status */
                .floating-row.status-bekliyor td:first-child { border-left: 5px solid ${C.primary}; }
                .floating-row.status-tamamlandı td:first-child { border-left: 5px solid ${C.emerald}; }
                .floating-row.status-iptal td:first-child { border-left: 5px solid ${C.red}; }

                .badge {
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 800;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .badge-success { background: ${C.emeraldLight}; color: ${C.emeraldDark}; }
                .badge-danger { background: ${C.redLight}; color: ${C.redDark}; }
                .badge-warning { background: ${C.orangeLight}; color: ${C.orange}; }
                .badge-blue { background: ${C.blueLight}; color: ${C.blue}; }

                .input-field {
                    width: 100%;
                    padding: 14px 20px;
                    background: #fbfbfe;
                    border: 1px solid ${C.border};
                    border-radius: 16px;
                    color: ${C.text};
                    outline: none;
                    font-size: 14.5px;
                    transition: all 0.25s ease;
                }
                .input-field:focus {
                    border-color: ${C.primary};
                    background: white;
                    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 10, 30, 0.5);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: entryUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .modal-content {
                    background: white;
                    border-radius: 28px;
                    width: 100%;
                    max-width: 580px;
                    padding: 40px;
                    box-shadow: 0 30px 70px rgba(15, 10, 30, 0.18);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }
                .avatar-initial {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${C.primaryVeryLight};
                    color: ${C.primary};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 12px;
                }
                .progress-deck {
                    width: 100%;
                    height: 4px;
                    background: #f1f5f9;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 10px;
                }
                .progress-deck-fill {
                    height: 100%;
                    border-radius: 4px;
                }
                .pulse-live-large {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: ${C.red};
                    box-shadow: 0 0 12px ${C.red};
                    animation: pulse-dot 1.8s infinite ease-in-out;
                }
                .spin {
                    animation: spin 1.2s infinite linear;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />

            {/* DYNAMIC MESH BACKGROUND BLOBS */}
            <div className="mesh-blob" style={{ top: "-10%", right: "5%", width: "550px", height: "550px", background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)" }} />
            <div className="mesh-blob" style={{ bottom: "-15%", left: "5%", width: "650px", height: "650px", background: "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                
                {/* GLASS PANEL NAVBAR */}
                <header className="glass-card" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 36px",
                    marginBottom: "36px",
                    boxShadow: "0 10px 30px rgba(109, 40, 217, 0.015)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{
                            width: "50px", height: "50px",
                            background: C.primaryGrad,
                            borderRadius: "18px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 24px rgba(109, 40, 217, 0.28)",
                            position: "relative"
                        }}>
                            <FiUsers size={22} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: C.text, letterSpacing: "-0.04em" }}>MediTrack Danışma</h1>
                            <span style={{ fontSize: "12.5px", color: C.muted, display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                                <span className="pulse-live-large" />
                                Canlı Hasta Giriş & Randevu İstasyon Paneli
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
                        <button onClick={refreshData} style={{
                            background: "none", border: "none", cursor: "pointer", color: C.primary,
                            display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 13.5
                        }}>
                            <FiRefreshCw className={loading ? "spin" : ""} /> Yenile
                        </button>

                        <div style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            background: "#ffffff", padding: "8px 20px", borderRadius: "16px",
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: C.primaryGrad, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: 800, color: "white"
                            }}>
                                {user?.name ? user.name[0].toUpperCase() : "S"}
                            </div>
                            <div>
                                <span style={{ fontSize: "13.5px", fontWeight: 800, color: C.text, display: "block", lineHeight: 1.1 }}>{user?.name || "Hasta Kabul"}</span>
                                <span style={{ fontSize: "9.5px", color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>TIBBİ SEKRETER</span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "12px 22px",
                                background: "rgba(239, 68, 68, 0.05)",
                                border: "1px solid rgba(239, 68, 68, 0.15)",
                                borderRadius: "16px",
                                color: C.red,
                                fontWeight: 800,
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)"}
                        >
                            <FiLogOut size={15} />
                            Çıkış
                        </button>
                    </div>
                </header>

                {/* ══════════════ WELCOME HERO BANNER ══════════════ */}
                <div className="glass-card" style={{
                    background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)",
                    border: `1px solid ${C.glassBorder}`,
                    borderRadius: "24px",
                    padding: "24px 32px",
                    marginBottom: "36px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 8px 32px rgba(124, 58, 237, 0.02)"
                }}>
                    <div>
                        <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: C.text, letterSpacing: "-0.03em" }}>
                            {getGreeting()}, {user?.name || "Görevli"}! 👋
                        </h2>
                        <p style={{ fontSize: "13.5px", color: C.textMuted, marginTop: "6px", maxWidth: "600px", lineHeight: 1.5 }}>
                            Bugün klinikte planlanmış **{stats.todayAppointments} aktif randevu** ve bekleme sırasında giriş yapmayı bekleyen **{stats.pendingQueue} hasta** bulunuyor. İşlemleri sol menüden hızlıca düzenleyebilirsiniz.
                        </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: C.text }}>
                            {currentTime.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div style={{ fontSize: "12.5px", color: C.muted, marginTop: "4px", fontWeight: 600 }}>
                            {currentTime.toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* HIGH-FIDELITY STATS DECK */}
                <section style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "28px",
                    marginBottom: "36px"
                }}>
                    {/* Stat Card: Patients */}
                    <div onClick={() => setActiveSection("patients")} style={{ cursor: "pointer" }} className="glow-card violet">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>TOPLAM KAYITLI HASTA</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: C.text, marginTop: "8px", letterSpacing: "-0.04em" }}>{stats.totalPatients}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: "75%", background: C.primaryGrad }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: "#f5f3ff", color: C.primary }}>
                                <FiUsers size={26} />
                            </div>
                        </div>
                    </div>

                    {/* Stat Card: Today's Appointments */}
                    <div onClick={() => setActiveSection("appointments")} style={{ cursor: "pointer" }} className="glow-card blue">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>BUGÜNKÜ RANDEVULAR</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: C.text, marginTop: "8px", letterSpacing: "-0.04em" }}>{stats.todayAppointments}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: "50%", background: "linear-gradient(90deg, #60a5fa, #3b82f6)" }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: "#eff6ff", color: C.blue }}>
                                <FiCalendar size={26} />
                            </div>
                        </div>
                    </div>

                    {/* Stat Card: Pending Queue */}
                    <div onClick={() => setActiveSection("queue")} style={{ cursor: "pointer" }} className="glow-card orange">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>BEKLEME SIRASINDA</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: C.text, marginTop: "8px", letterSpacing: "-0.04em" }}>{stats.pendingQueue}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: "35%", background: "linear-gradient(90deg, #fcd34d, #f59e0b)" }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: "#fffbeb", color: C.orange }}>
                                <FiClock size={26} />
                            </div>
                        </div>
                    </div>

                    {/* Stat Card: Revenue */}
                    <div className="glow-card emerald">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>GÜNLÜK TOPLAM TAHSİLAT</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: C.emerald, marginTop: "8px", letterSpacing: "-0.04em" }}>₺{stats.totalRevenue}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: "90%", background: "linear-gradient(90deg, #34d399, #10b981)" }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: C.emeraldLight, color: C.emerald }}>
                                <FiDollarSign size={26} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* MAIN SPLIT GRID */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: "36px",
                    alignItems: "start"
                }}>
                    {/* LEFT FLOATING GLASS NAVIGATION CARD */}
                    <div className="glass-card" style={{
                        padding: "24px",
                        boxShadow: "0 8px 30px rgba(109, 40, 217, 0.01)"
                    }}>
                        <div style={{ fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "18px", paddingLeft: "8px" }}>
                            GÖSTERGE PANELİ MENÜSÜ
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button
                                onClick={() => { setActiveSection("appointments"); setSearchQuery(""); }}
                                className={`sidebar-btn ${activeSection === "appointments" ? "active" : ""}`}
                            >
                                <FiCalendar size={18} /> Randevu Defteri
                            </button>

                            <button
                                onClick={() => { setActiveSection("patients"); setSearchQuery(""); }}
                                className={`sidebar-btn ${activeSection === "patients" ? "active" : ""}`}
                            >
                                <FiUsers size={18} /> Hasta Kabul & Kayıt
                            </button>

                            <button
                                onClick={() => { setActiveSection("queue"); setSearchQuery(""); }}
                                className={`sidebar-btn ${activeSection === "queue" ? "active" : ""}`}
                            >
                                <FiActivity size={18} /> Canlı Doktor Sıraları
                            </button>
                        </div>

                        <div style={{ marginTop: "40px", padding: "18px", background: "white", borderRadius: "20px", border: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.text, fontWeight: 800, fontSize: "12px", marginBottom: "6px" }}>
                                <FiInfo size={14} style={{ color: C.primary }} /> Klinik Yönetim Notu
                            </div>
                            <span style={{ fontSize: "11px", color: C.textMuted, lineHeight: 1.5, display: "block" }}>
                                Canlı Doktor Sıraları sekmesinde, bugün check-in yapmış olan hastaların sırasını hekim bazlı canlı olarak görebilir ve yönetebilirsiniz.
                            </span>
                        </div>
                    </div>

                    {/* RIGHT MODUL WORKSPACE */}
                    <div style={{ animation: "entryUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        {/* Search & Action Bar */}
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            marginBottom: "24px", gap: "16px", flexWrap: "wrap"
                        }}>
                            <div style={{ position: "relative", flex: 1, minWidth: "320px" }}>
                                <FiSearch style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: C.primary, fontSize: "17px" }} />
                                <input
                                    type="text"
                                    placeholder={activeSection === "patients" ? "Hasta adı, T.C. Kimlik No veya telefon yazın..." : "Randevularda (hasta, doktor, saat) arayın..."}
                                    className="input-field"
                                    style={{ paddingLeft: "52px", background: "white", boxShadow: "0 4px 14px rgba(109, 40, 217, 0.01)" }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <button
                                className="modern-btn"
                                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", boxShadow: "0 6px 16px rgba(59, 130, 246, 0.25)" }}
                                onClick={() => setBarcodeModalOpen(true)}
                            >
                                <FiCamera /> Barkod Tara
                            </button>

                            {activeSection === "patients" && (
                                <button className="modern-btn" onClick={() => setPatientModalOpen(true)}>
                                    <FiPlus /> Yeni Hasta Kaydı
                                </button>
                            )}

                            {activeSection === "appointments" && (
                                <button className="modern-btn" onClick={() => setAppointmentModalOpen(true)}>
                                    <FiPlus /> Yeni Randevu Ekle
                                </button>
                            )}
                        </div>

                        {/* SECTION: APPOINTMENTS Planer */}
                        {activeSection === "appointments" && (
                            <table className="floating-table">
                                <thead>
                                    <tr>
                                        <th>Hasta Adı</th>
                                        <th>Doktor & Branş</th>
                                        <th>Tarih & Saat</th>
                                        <th>Muayene Türü</th>
                                        <th>Vezne / Ödeme</th>
                                        <th>Durum</th>
                                        <th style={{ textAlign: "right" }}>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", color: C.muted, padding: "50px 20px" }}>
                                                Aradığınız kriterlere uygun randevu kaydı bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAppointments.map(app => (
                                            <tr key={app._id} className={`floating-row status-${app.status}`}>
                                                <td style={{ fontWeight: 800, color: C.text }}>{app.patientId?.name || "Bilinmeyen Hasta"}</td>
                                                <td>
                                                    <div style={{ fontWeight: 700 }}>{formatDoctorName(app.doctorId?.name)}</div>
                                                    <div style={{ fontSize: "11px", color: C.muted }}>{app.doctorId?.specialty}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700 }}>{new Date(app.date).toLocaleDateString("tr-TR")}</div>
                                                    <div style={{ fontSize: "12px", color: C.primary, fontWeight: 800 }}>{app.time}</div>
                                                </td>
                                                <td>
                                                     <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                         <span className={`badge ${app.type === "Acil" ? "badge-danger" : "badge-blue"}`}>{app.type}</span>
                                                         {app.status === "bekliyor" && (
                                                             <button
                                                                 onClick={() => handleTogglePriority(app)}
                                                                 style={{
                                                                     background: "none", border: "none", padding: "4px",
                                                                     color: app.type === "Acil" ? C.red : C.muted,
                                                                     cursor: "pointer", display: "inline-flex", alignItems: "center"
                                                                 }}
                                                                 title={app.type === "Acil" ? "Önceliği Kaldır" : "Önceliklendir (Acil)"}
                                                             >
                                                                 <FiAlertTriangle size={13} />
                                                             </button>
                                                         )}
                                                     </div>
                                                </td>
                                                <td>
                                                    {app.paymentStatus === "paid" ? (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <span className="badge badge-success">
                                                                <FiCheckCircle size={12} /> Ödendi
                                                            </span>
                                                            <button
                                                                onClick={() => handlePrint("receipt", app)}
                                                                style={{
                                                                    background: "none", border: "none", padding: "4px", color: C.primary, cursor: "pointer", display: "inline-flex", alignItems: "center"
                                                                }}
                                                                title="Fişi Yazdır"
                                                            >
                                                                <FiPrinter size={13} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="badge badge-warning"
                                                            style={{ border: "none", cursor: "pointer", outline: "none", display: "inline-flex", alignItems: "center" }}
                                                            onClick={() => handleCollectPayment(app._id)}
                                                            title="Ödemeyi Tahsil Et"
                                                        >
                                                            <FiDollarSign size={12} /> {app.fee || 500} TL Al
                                                        </button>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        app.status === "bekliyor" ? "badge-warning" : 
                                                        app.status === "tamamlandı" ? "badge-success" : "badge-danger"
                                                    }`}>
                                                        {app.status === "bekliyor" ? "Bekliyor" : 
                                                         app.status === "tamamlandı" ? "Tamamlandı" : "İptal"}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    {app.status === "bekliyor" && (
                                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                                                            <button
                                                                onClick={() => handleCheckIn(app._id)}
                                                                style={{ padding: "8px 14px", background: C.primaryVeryLight, color: C.primary, border: "none", borderRadius: "10px", fontSize: "12px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "#ddd6fe"}
                                                                onMouseLeave={e => e.currentTarget.style.background = C.primaryVeryLight}
                                                            >
                                                                Check-In
                                                            </button>
                                                            <button
                                                                onClick={() => handlePrint("ticket", app)}
                                                                style={{ padding: "8px 10px", background: "#f1f5f9", color: C.textMuted, border: "none", borderRadius: "10px", fontSize: "12px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center" }}
                                                                title="Sıra Fişi Yazdır"
                                                            >
                                                                <FiPrinter size={13} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelAppointment(app._id)}
                                                                style={{ padding: "8px 14px", background: C.redLight, color: C.red, border: "none", borderRadius: "10px", fontSize: "12px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                                                                onMouseLeave={e => e.currentTarget.style.background = C.redLight}
                                                            >
                                                                İptal Et
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* SECTION: PATIENTS TABLE */}
                        {activeSection === "patients" && (
                            <table className="floating-table">
                                <thead>
                                    <tr>
                                        <th>T.C. Kimlik No</th>
                                        <th>Hasta Adı Soyadı</th>
                                        <th>Yaş & Cinsiyet</th>
                                        <th>Telefon Numarası</th>
                                        <th>E-posta</th>
                                        <th>Kan Grubu</th>
                                        <th style={{ textAlign: "right" }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", color: C.muted, padding: "50px 20px" }}>
                                                Aradığınız kriterlere uygun kayıtlı hasta bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPatients.map(p => (
                                            <tr key={p._id} className="floating-row">
                                                <td style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em" }}>{p.tc || "-"}</td>
                                                <td style={{ fontWeight: 800, color: C.text }}>{p.name}</td>
                                                <td>{p.age} yaş / {p.gender}</td>
                                                <td>{p.phone || "-"}</td>
                                                <td>{p.email || "-"}</td>
                                                <td style={{ fontWeight: 800, color: C.red }}>{p.bloodType || "-"}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button
                                                        onClick={() => {
                                                            setAppointmentForm(prev => ({ ...prev, patientId: p._id }));
                                                            setAppointmentModalOpen(true);
                                                        }}
                                                        style={{
                                                            padding: "8px 16px", background: "#ecfdf5", color: C.emeraldDark,
                                                            border: "none", borderRadius: "12px", fontSize: "12px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#d1fae5"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "#ecfdf5"}
                                                    >
                                                        Randevu Oluştur
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* SECTION: LIVE QUEUE PANELS */}
                        {activeSection === "queue" && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                                {doctors.map(doc => {
                                    const docQueue = todayQueue
                                        .filter(app => app.doctorId?._id === doc._id)
                                        .sort((a, b) => {
                                            if (a.type === "Acil" && b.type !== "Acil") return -1;
                                            if (a.type !== "Acil" && b.type === "Acil") return 1;
                                            return a.time.localeCompare(b.time);
                                        });

                                    return (
                                        <div key={doc._id} className="glow-card" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "20px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${C.borderLight}`, paddingBottom: "16px" }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: "16px", color: C.text, fontWeight: 900 }}>{formatDoctorName(doc.name)}</h3>
                                                    <span style={{ fontSize: "12.5px", color: C.primary, fontWeight: 700 }}>{doc.specialty}</span>
                                                </div>
                                                <span className="badge badge-success">
                                                    {docQueue.length} Bekleyen
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {docQueue.length === 0 ? (
                                                    <div style={{ textAlign: "center", fontSize: "13px", color: C.muted, padding: "30px 10px" }}>
                                                        Sırada bekleyen hasta bulunmamaktadır.
                                                    </div>
                                                ) : (
                                                    docQueue.map((app, index) => (
                                                        <div key={app._id} style={{
                                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                                            padding: "14px 18px",
                                                            background: app.type === "Acil" ? "rgba(239, 68, 68, 0.04)" : "#fafaff",
                                                            border: app.type === "Acil" ? `1px solid rgba(239, 68, 68, 0.2)` : `1px solid ${C.borderLight}`,
                                                            borderRadius: "16px"
                                                        }} className="floating-row-item">
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <div className="avatar-initial" style={{ background: app.type === "Acil" ? C.redLight : C.primaryVeryLight, color: app.type === "Acil" ? C.red : C.primary }}>
                                                                    {app.patientId?.name ? app.patientId.name.split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase() : "H"}
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontWeight: 800, fontSize: "13.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                                        {app.patientId?.name}
                                                                        {app.type === "Acil" && (
                                                                            <span className="badge badge-danger" style={{ padding: "2px 6px", fontSize: "9px" }}>ACİL</span>
                                                                        )}
                                                                    </span>
                                                                    <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 600 }}>Sıra: {index + 1}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <span className="badge badge-blue">{app.time}</span>
                                                                <button
                                                                    onClick={() => handleTogglePriority(app)}
                                                                    style={{
                                                                        background: "none", border: "none", padding: "4px",
                                                                        color: app.type === "Acil" ? C.red : C.muted,
                                                                        cursor: "pointer", display: "inline-flex", alignItems: "center"
                                                                    }}
                                                                    title={app.type === "Acil" ? "Önceliği Kaldır" : "Önceliklendir (Acil)"}
                                                                >
                                                                    <FiAlertTriangle size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePrint("ticket", app)}
                                                                    style={{
                                                                        background: "none", border: "none", padding: "4px", color: C.primary, cursor: "pointer", display: "inline-flex", alignItems: "center"
                                                                    }}
                                                                    title="Sıra Fişi Yazdır"
                                                                >
                                                                    <FiPrinter size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL: BARCODE SCANNER MOCKUP */}
            {barcodeModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "440px", padding: "30px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiCamera size={20} color={C.primary} />
                                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: C.text }}>Barkod Okuyucu</h2>
                            </div>
                            <button onClick={() => { setBarcodeModalOpen(false); setBarcodeInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                                <FiX size={22} />
                            </button>
                        </div>

                        <div className="scanner-viewfinder" style={{ marginBottom: "20px" }}>
                            <div className="scanner-corner top-left"></div>
                            <div className="scanner-corner top-right"></div>
                            <div className="scanner-corner bottom-left"></div>
                            <div className="scanner-corner bottom-right"></div>
                            <div className="scanner-laser"></div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white", gap: "8px", zIndex: 2 }}>
                                <FiZap size={24} style={{ animation: "pulse-dot 1.5s infinite ease-in-out", color: C.primaryLight }} />
                                <span style={{ fontSize: "11px", fontWeight: "700", opacity: 0.8, letterSpacing: "1px" }}>BARKOD BEKLENİYOR...</span>
                            </div>
                        </div>

                        <form onSubmit={handleBarcodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>T.C. KİMLİK NO VEYA BARKOD OKUTUN</label>
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    className="input-field"
                                    placeholder="Fiziksel barkod okutun veya TC girin..."
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    style={{ textAlign: "center", letterSpacing: "0.1em", fontWeight: "bold" }}
                                />
                            </div>

                            <button type="submit" className="modern-btn" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                                Sorgula ve Kabul Et
                            </button>
                        </form>

                        <div style={{ marginTop: "20px", borderTop: `1px solid ${C.borderLight}`, paddingTop: "15px" }}>
                            <span style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: C.muted, marginBottom: "10px", letterSpacing: "0.05em" }}>SİMÜLASYON İÇİN TIKLAYIN (TEST):</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {appointments
                                    .filter(app => {
                                        const appDateStr = new Date(app.date).toISOString().split("T")[0];
                                        return appDateStr === todayStr && app.status !== "tamamlandı" && app.status !== "iptal";
                                    })
                                    .slice(0, 3)
                                    .map(app => (
                                        <button
                                            key={app._id}
                                            onClick={() => {
                                                setBarcodeInput(app.patientId?.tc || "");
                                                setTimeout(() => {
                                                    handlePrint("ticket", app);
                                                    handleCheckIn(app._id);
                                                    setBarcodeModalOpen(false);
                                                    setBarcodeInput("");
                                                }, 300);
                                            }}
                                            style={{
                                                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "8px 12px", background: "#f8fafc", border: `1px solid ${C.borderLight}`,
                                                borderRadius: "10px", fontSize: "11px", cursor: "pointer", transition: "all 0.2s", textAlign: "left"
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = C.primaryVeryLight}
                                            onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                                        >
                                            <div>
                                                <span style={{ fontWeight: "800" }}>{app.patientId?.name}</span>
                                                <span style={{ color: C.muted, marginLeft: "6px" }}>({app.doctorId?.specialty})</span>
                                            </div>
                                            <span style={{ fontFamily: "monospace", color: C.primary, fontWeight: "700" }}>{app.patientId?.tc}</span>
                                        </button>
                                    ))
                                }
                                {appointments.filter(app => {
                                    const appDateStr = new Date(app.date).toISOString().split("T")[0];
                                    return appDateStr === todayStr && app.status !== "tamamlandı" && app.status !== "iptal";
                                }).length === 0 && (
                                    <div style={{ fontSize: "11px", color: C.muted, textAlign: "center" }}>Bugün için aktif bekleyen randevu bulunmuyor.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: NEW PATIENT REGISTRATION */}
            {patientModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: C.text }}>Yeni Hasta Kabul Kaydı</h2>
                            <button onClick={() => setPatientModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                                <FiX size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePatient} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>HASTA ADI SOYADI</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    placeholder="Örn: Mehmet Yılmaz"
                                    value={patientForm.name}
                                    onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>T.C. KİMLİK NUMARASI</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength="11"
                                        pattern="\d{11}"
                                        className="input-field"
                                        placeholder="11 Haneli TC No"
                                        value={patientForm.tc}
                                        onChange={(e) => setPatientForm({ ...patientForm, tc: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>TELEFON NUMARASI</label>
                                    <input
                                        type="tel"
                                        required
                                        className="input-field"
                                        placeholder="Örn: 05551234567"
                                        value={patientForm.phone}
                                        onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>YAŞ</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="120"
                                        className="input-field"
                                        placeholder="Yaş girin"
                                        value={patientForm.age}
                                        onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>CİNSİYET</label>
                                    <select
                                        className="input-field"
                                        value={patientForm.gender}
                                        onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                                    >
                                        <option value="Erkek">Erkek</option>
                                        <option value="Kadın">Kadın</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>KAN GRUBU</label>
                                    <select
                                        className="input-field"
                                        value={patientForm.bloodType}
                                        onChange={(e) => setPatientForm({ ...patientForm, bloodType: e.target.value })}
                                    >
                                        <option value="A+">A Rh (+)</option>
                                        <option value="A-">A Rh (-)</option>
                                        <option value="B+">B Rh (+)</option>
                                        <option value="B-">B Rh (-)</option>
                                        <option value="AB+">AB Rh (+)</option>
                                        <option value="AB-">AB Rh (-)</option>
                                        <option value="O+">O Rh (+)</option>
                                        <option value="O-">O Rh (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>E-POSTA (OPSİYONEL)</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder="hasta@email.com"
                                        value={patientForm.email}
                                        onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="modern-btn" style={{ width: "100%", justifyContent: "center", marginTop: "12px", padding: "14px" }}>
                                Kaydı Tamamla ve Onayla
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: NEW APPOINTMENT BOOKING */}
            {appointmentModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: C.text }}>Klinik Muayene Randevusu Planla</h2>
                            <button onClick={() => setAppointmentModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                                <FiX size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAppointment} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>HASTA SEÇİN</label>
                                <select
                                    required
                                    className="input-field"
                                    value={appointmentForm.patientId}
                                    onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                                >
                                    <option value="" disabled>Hasta Seçiniz</option>
                                    {patients.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} (TC: {p.tc})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>HEKİM / POLİKLİNİK SEÇİN</label>
                                <select
                                    required
                                    className="input-field"
                                    value={appointmentForm.doctorId}
                                    onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
                                >
                                    <option value="" disabled>Hekim Seçiniz</option>
                                    {doctors.map(doc => (
                                        <option key={doc._id} value={doc._id}>{formatDoctorName(doc.name)} ({doc.specialty})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>RANDEVU TARİHİ</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={appointmentForm.date}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>RANDEVU SAATİ</label>
                                    <select
                                        className="input-field"
                                        value={appointmentForm.time}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                                    >
                                        <option value="09:00">09:00</option>
                                        <option value="09:30">09:30</option>
                                        <option value="10:00">10:00</option>
                                        <option value="10:30">10:30</option>
                                        <option value="11:00">11:00</option>
                                        <option value="11:30">11:30</option>
                                        <option value="13:30">13:30</option>
                                        <option value="14:00">14:00</option>
                                        <option value="14:30">14:30</option>
                                        <option value="15:00">15:00</option>
                                        <option value="15:30">15:30</option>
                                        <option value="16:00">16:00</option>
                                        <option value="16:30">16:30</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>MUAYENE TÜRÜ</label>
                                    <select
                                        className="input-field"
                                        value={appointmentForm.type}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, type: e.target.value })}
                                    >
                                        <option value="İlk Muayene">İlk Muayene</option>
                                        <option value="Kontrol">Kontrol</option>
                                        <option value="Takip">Takip</option>
                                        <option value="Acil">Acil</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>MUAYENE ÜCRETİ (TL)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="input-field"
                                        value={appointmentForm.fee}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, fee: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: C.textMuted, marginBottom: "6px", letterSpacing: "0.05em" }}>NOTLAR / ŞİKAYET DETAYI</label>
                                <textarea
                                    className="input-field"
                                    style={{ height: "60px", resize: "none" }}
                                    placeholder="Belirtmek istediğiniz notlar..."
                                    value={appointmentForm.notes}
                                    onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="modern-btn" style={{ width: "100%", justifyContent: "center", marginTop: "12px", padding: "14px" }}>
                                Randevuyu Kaydet ve Kesinleştir
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PRINTABLE AREA FOR THERMAL TICKET / RECEIPT */}
            {printData && (
                <div id="printable-area" style={{ display: "none" }}>
                    <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "8px", marginBottom: "12px" }}>
                        <h2 style={{ fontSize: "15px", fontWeight: "900", margin: "0 0 4px 0", fontFamily: "sans-serif" }}>MEDITRACK HASTANESİ</h2>
                        <div style={{ fontSize: "10px" }}>Tarih: {new Date().toLocaleString("tr-TR")}</div>
                        <div style={{ fontSize: "11px", fontWeight: "800", marginTop: "8px", letterSpacing: "1px", textTransform: "uppercase" }}>
                            {printData.type === "ticket" ? "KABUL & SIRA FİŞİ" : "VEZNE ÖDEME MAKBUZU"}
                        </div>
                    </div>

                    <div style={{ fontSize: "11px", lineHeight: "1.6", fontFamily: "sans-serif" }}>
                        {printData.type === "ticket" ? (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Hasta:</span>
                                    <span style={{ fontWeight: "800" }}>{printData.appointment.patientId?.name}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>T.C. No:</span>
                                    <span style={{ fontFamily: "monospace" }}>{printData.appointment.patientId?.tc}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", marginTop: "4px", paddingTop: "4px" }}>
                                    <span>Poliklinik:</span>
                                    <span style={{ fontWeight: "800" }}>{printData.appointment.doctorId?.specialty}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Doktor:</span>
                                    <span style={{ fontWeight: "800" }}>{formatDoctorName(printData.appointment.doctorId?.name)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Randevu Saat:</span>
                                    <span style={{ fontWeight: "800" }}>{printData.appointment.time}</span>
                                </div>
                                <div style={{ textAlign: "center", margin: "14px 0", padding: "8px 0", border: "1px solid #000", background: "#f8fafc" }}>
                                    <div style={{ fontSize: "9px", color: "#475569", fontWeight: "700" }}>BEKLEME SIRA NUMARASI</div>
                                    <div style={{ fontSize: "32px", fontWeight: "900", marginTop: "2px" }}>
                                        {(() => {
                                            const docQueue = todayQueue.filter(app => app.doctorId?._id === printData.appointment.doctorId?._id);
                                            const idx = docQueue.findIndex(app => app._id === printData.appointment._id);
                                            return idx !== -1 ? idx + 1 : "A-01";
                                        })()}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Hasta:</span>
                                    <span style={{ fontWeight: "800" }}>{printData.appointment.patientId?.name}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>T.C. No:</span>
                                    <span style={{ fontFamily: "monospace" }}>{printData.appointment.patientId?.tc}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", marginTop: "4px", paddingTop: "4px" }}>
                                    <span>Muayene Türü:</span>
                                    <span>{printData.appointment.type}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Doktor:</span>
                                    <span>{formatDoctorName(printData.appointment.doctorId?.name)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", marginTop: "4px", paddingTop: "4px" }}>
                                    <span>Ödeme Türü:</span>
                                    <span style={{ fontWeight: "800" }}>Nakit / Kart</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "900", borderTop: "2px double #000", marginTop: "4px", paddingTop: "4px" }}>
                                    <span>TOPLAM TUTAR:</span>
                                    <span>₺{printData.appointment.fee || 500}</span>
                                </div>
                                <div style={{ textAlign: "center", color: "green", fontWeight: "900", marginTop: "10px", fontSize: "10px", border: "1px solid green", padding: "4px", textTransform: "uppercase" }}>
                                    ÖDEME ALINDI / TAHSİL EDİLDİ
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "8px", marginTop: "12px", fontSize: "9px", color: "#475569" }}>
                        <div>Geçmiş olsun dileklerimizle. Sağlıklı günler dileriz.</div>
                        <div style={{ marginTop: "4px", fontFamily: "monospace", fontSize: "8px" }}>Ref ID: {printData.appointment._id}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

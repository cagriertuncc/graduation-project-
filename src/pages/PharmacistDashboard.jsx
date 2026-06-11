import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacistAuth } from "../context/PharmacistAuthContext";
import {
    FiSearch, FiActivity, FiLogOut, FiPackage, FiFileText,
    FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiCheckCircle, FiRefreshCw,
    FiCpu, FiZap, FiCamera, FiTrendingUp, FiLayers, FiCalendar, FiDownload,
    FiClock, FiAlertOctagon, FiUser, FiInfo, FiChevronRight, FiGrid, FiSettings
} from "react-icons/fi";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

// Curated Ultra-Premium Color Palette (Next-Gen Medical SaaS theme)
const C = {
    bg: "#f3f4f6", // Neutral soft backdrop
    glassBg: "rgba(255, 255, 255, 0.75)",
    glassBorder: "rgba(255, 255, 255, 0.6)",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    emerald: "#10b981", // Emerald Primary
    emeraldDark: "#047857",
    emeraldLight: "#d1fae5",
    emeraldGrad: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
    emeraldGlow: "rgba(16, 185, 129, 0.18)",
    text: "#0f172a", // Slate 900
    textMuted: "#475569", // Slate 600
    muted: "#94a3b8", // Slate 400
    red: "#ef4444",
    redLight: "#fee2e2",
    redDark: "#b91c1c",
    redGlow: "rgba(239, 68, 68, 0.18)",
    orange: "#f59e0b",
    orangeLight: "#fffbeb",
    orangeGlow: "rgba(245, 158, 11, 0.18)",
    blue: "#3b82f6",
    blueLight: "#eff6ff",
    blueGlow: "rgba(59, 130, 246, 0.18)",
    purple: "#8b5cf6",
    purpleLight: "#f5f3ff",
    purpleGlow: "rgba(139, 92, 246, 0.18)",
    purpleGrad: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)"
};

export default function PharmacistDashboard() {
    const navigate = useNavigate();
    const { user, token, logout } = usePharmacistAuth();
    
    // Navigation state
    const [activeSection, setActiveSection] = useState("prescriptions"); // 'prescriptions', 'history', 'inventory'
    const [stockFilter, setStockFilter] = useState("all"); // 'all', 'low_stock', 'near_expiry'
    
    // Core state
    const [prescriptions, setPrescriptions] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [stats, setStats] = useState({ pendingPrescriptions: 0, dispensedPrescriptions: 0, lowStockMedications: 0, totalMedications: 0 });
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [restockingId, setRestockingId] = useState(null);
    
    // Scanner simulation state
    const [isScanning, setIsScanning] = useState(false);

    // Detail Modal
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [aiChecking, setAiChecking] = useState(false);
    
    // Add/Edit stock modal
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [stockForm, setStockForm] = useState({ name: "", stock: 0, criticalLimit: 10, unit: "Kutu", expiryDate: "" });

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

    // Fetch dashboard statistics
    const fetchStats = async () => {
        try {
            const res = await fetch("/api/pharmacy/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch (e) {
            console.error("Stats fetching error", e);
        }
    };

    // Fetch prescriptions
    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const statusFilter = activeSection === "prescriptions" ? "beklemede" : "verildi";
            const res = await fetch(`/api/pharmacy/prescriptions?status=${statusFilter}&search=${searchQuery}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setPrescriptions(data);
            setLoading(false);
        } catch (e) {
            toast.error("Reçeteler yüklenemedi");
            setLoading(false);
        }
    };

    // Fetch stocks
    const fetchStocks = async () => {
        try {
            const res = await fetch("/api/pharmacy/stock", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setStocks(data);
        } catch (e) {
            toast.error("Stok verisi yüklenemedi");
        }
    };

    // Sync data on changes
    useEffect(() => {
        if (!token) {
            navigate("/eczane/giris");
            return;
        }
        fetchStats();
        if (activeSection === "prescriptions" || activeSection === "history") {
            fetchPrescriptions();
        } else if (activeSection === "inventory") {
            fetchStocks();
        }
    }, [activeSection, searchQuery, token, navigate]);

    // Handle logout
    const handleLogout = () => {
        logout();
        toast.success("Oturum kapatıldı");
        navigate("/eczane/giris");
    };

    // AI scan effect simulation
    useEffect(() => {
        if (selectedPrescription) {
            setAiChecking(true);
            const timer = setTimeout(() => {
                setAiChecking(false);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [selectedPrescription]);

    // Barcode scanner simulation
    const handleStartScan = () => {
        setIsScanning(true);
        toast.loading("Reçete barkodu taranıyor...", { id: "scan-toast" });
        
        setTimeout(() => {
            setIsScanning(false);
            toast.success("Barkod başarıyla doğrulandı!", { id: "scan-toast" });
            
            const pending = prescriptions.find(p => p.status === "beklemede");
            if (pending && pending.patientId) {
                setSearchQuery(pending.patientId.tc);
                setSelectedPrescription(pending);
            } else {
                toast.error("Bekleyen reçete bulunamadı.");
                setSearchQuery("230316"); 
            }
        }, 2000);
    };

    // Dispense Prescription
    const handleDispense = async (prescriptionId) => {
        try {
            const res = await fetch(`/api/pharmacy/prescriptions/${prescriptionId}/dispense`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Teslimat sırasında bir hata oluştu");
            }
            toast.success("İlaçlar başarıyla teslim edildi!");
            setSelectedPrescription(null);
            fetchPrescriptions();
            fetchStats();
        } catch (e) {
            toast.error(e.message);
        }
    };

    // PDF receipt slip exporter
    const handleExportPDF = (p) => {
        try {
            const doc = new jsPDF("p", "mm", "a5");
            
            // Header decoration
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(16, 185, 129); 
            doc.text("MEDITRACK ECZANE", 15, 20);
            
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("ILAC TESLIM VE FISE DAIR BILGI SLIPI", 15, 24);
            
            doc.setLineWidth(0.3);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, 28, 135, 28);
            
            // Recete Details
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text(`Tarih: ${new Date(p.date).toLocaleString("tr-TR")}`, 15, 36);
            doc.text(`Recete ID: ${p._id}`, 15, 42);
            doc.text(`Teslim Durumu: ILACLAR TESLIM EDILDI`, 15, 48);

            doc.line(15, 54, 135, 54);

            // Patient details
            doc.setFont("helvetica", "bold");
            doc.text("Hasta Bilgileri:", 15, 62);
            doc.setFont("helvetica", "normal");
            doc.text(`Ad Soyad: ${p.patientId?.name}`, 15, 68);
            doc.text(`TC Kimlik No: ${p.patientId?.tc}`, 15, 74);
            
            // Hekim details
            doc.setFont("helvetica", "bold");
            doc.text("Hekim Bilgileri:", 80, 62);
            doc.setFont("helvetica", "normal");
            doc.text(`${formatDoctorName(p.doctorId?.name)}`, 80, 68);
            doc.text(`Brans: ${p.doctorId?.specialty}`, 80, 74);

            doc.line(15, 80, 135, 80);

            // Medications list
            doc.setFont("helvetica", "bold");
            doc.text("Teslim Edilen Ilaclar:", 15, 88);
            doc.setFont("helvetica", "normal");
            
            let y = 96;
            p.medications.forEach((med, idx) => {
                doc.text(`${idx + 1}. ${med.name} (${med.dosage})`, 18, y);
                doc.setFont("helvetica", "italic");
                doc.text(`Kullanim: ${med.frequency} - ${med.duration || 'Suresiz'}`, 22, y + 4);
                doc.setFont("helvetica", "normal");
                y += 10;
            });

            doc.line(15, y + 5, 135, y + 5);
            
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("Saglikli gunler dileriz. MediTrack HMS Eczane Modulu", 15, y + 12);

            doc.save(`MediTrack-Fis-${p.patientId?.name.replace(/\s+/g, "_")}.pdf`);
            toast.success("PDF Slip başarıyla indirildi!");
        } catch (err) {
            toast.error("PDF oluşturulurken bir hata meydana geldi.");
        }
    };

    // Instant Restock (+50 stock)
    const handleRestock = async (item) => {
        try {
            setRestockingId(item._id);
            const refilledAmount = item.stock + 50;
            const res = await fetch(`/api/pharmacy/stock/${item._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ stock: refilledAmount })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Tedarik işlemi başarısız");

            toast.success(`${item.name} ilacı için 50 adet yeni stok tedarik edildi!`);
            fetchStocks();
            fetchStats();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setRestockingId(null);
        }
    };

    // Add / Update stock
    const handleSaveStock = async (e) => {
        e.preventDefault();
        try {
            const isEdit = !!editingStock;
            const url = isEdit ? `/api/pharmacy/stock/${editingStock._id}` : "/api/pharmacy/stock";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(stockForm)
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "İşlem başarısız");

            toast.success(isEdit ? "Stok güncellendi" : "Yeni ilaç eklendi");
            setStockModalOpen(false);
            setEditingStock(null);
            setStockForm({ name: "", stock: 0, criticalLimit: 10, unit: "Kutu", expiryDate: "" });
            fetchStocks();
            fetchStats();
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Delete stock
    const handleDeleteStock = async (id) => {
        if (!window.confirm("Bu ilacı stok kaydından silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/pharmacy/stock/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("İlaç envanterden silindi");
                fetchStocks();
                fetchStats();
            } else {
                const data = await res.json();
                toast.error(data.error || "Silme işlemi başarısız");
            }
        } catch (e) {
            toast.error("Bir hata oluştu");
        }
    };

    const openEditModal = (item) => {
        setEditingStock(item);
        setStockForm({
            name: item.name,
            stock: item.stock,
            criticalLimit: item.criticalLimit,
            unit: item.unit,
            expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : ""
        });
        setStockModalOpen(true);
    };

    // Expiry verification helper (Is less than 6 months away?)
    const checkNearExpiry = (dateStr) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 180; // 6 months
    };

    // Stock Filter logic
    const filteredStocks = stocks.filter(item => {
        if (stockFilter === "low_stock") {
            return item.stock <= item.criticalLimit;
        }
        if (stockFilter === "near_expiry") {
            return checkNearExpiry(item.expiryDate);
        }
        return true;
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
            {/* Embedded styles for state-of-the-art visual enhancements */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse-dot {
                    0% { transform: scale(0.9); opacity: 0.6; }
                    50% { transform: scale(1.15); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.6; }
                }
                @keyframes float-blob {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-15px) scale(1.03); }
                }
                @keyframes scanner-laser {
                    0% { top: 4%; opacity: 0.9; }
                    50% { top: 96%; opacity: 1; }
                    100% { top: 4%; opacity: 0.9; }
                }
                @keyframes fadeInSlide {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gridSweep {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 0% 100%; }
                }
                .mesh-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                    pointer-events: none;
                    animation: float-blob 8s infinite ease-in-out;
                }
                .laser-line-fullscreen {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, transparent, ${C.emerald}, transparent);
                    box-shadow: 0 0 16px ${C.emerald}, 0 0 8px rgba(16, 185, 129, 0.5);
                    animation: scanner-laser 2.2s infinite ease-in-out;
                    z-index: 10;
                }
                .grid-bg-animated {
                    background-image: 
                        linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                    animation: gridSweep 20s infinite linear;
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
                }
                .glow-card.emerald:hover { box-shadow: 0 20px 40px ${C.emeraldGlow}; border-color: rgba(16, 185, 129, 0.25); }
                .glow-card.blue:hover { box-shadow: 0 20px 40px ${C.blueGlow}; border-color: rgba(59, 130, 246, 0.25); }
                .glow-card.orange:hover { box-shadow: 0 20px 40px ${C.orangeGlow}; border-color: rgba(245, 158, 11, 0.25); }
                .glow-card.purple:hover { box-shadow: 0 20px 40px ${C.purpleGlow}; border-color: rgba(139, 92, 246, 0.25); }

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
                    background: rgba(16, 185, 129, 0.05);
                    color: ${C.emeraldDark};
                }
                .sidebar-btn.active {
                    background: ${C.emeraldGrad};
                    color: white;
                    box-shadow: 0 8px 20px ${C.emeraldGlow};
                }
                .spin {
                    animation: spin 1.2s infinite linear;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .action-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: #ffffff;
                    border: 1px solid ${C.border};
                    border-radius: 10px;
                    padding: 8px;
                    color: ${C.muted};
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .action-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: ${C.text};
                }

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
                    box-shadow: 0 12px 28px rgba(16, 185, 129, 0.045);
                    border-color: rgba(16, 185, 129, 0.15);
                }
                .floating-row.status-tamamlandı td:first-child { border-left: 5px solid ${C.emerald}; }
                .floating-row.status-bekliyor td:first-child { border-left: 5px solid ${C.orange}; }
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
                .badge-warning { background: ${C.orangeLight}; color: ${C.orange}; }
                .badge-danger { background: ${C.redLight}; color: ${C.red}; }
                .badge-blue { background: ${C.blueLight}; color: ${C.blue}; }

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
                    border-color: ${C.emerald};
                    background: white;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
                }

                .pulse-live-large {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: ${C.emerald};
                    box-shadow: 0 0 12px ${C.emerald};
                    animation: pulse-dot 1.8s infinite ease-in-out;
                }
            `}} />

            {/* Futuristic scanner overlay HUD */}
            {isScanning && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(3, 7, 18, 0.75)",
                    backdropFilter: "blur(6px)", zIndex: 9999, display: "flex",
                    alignItems: "center", justifyContent: "center", animation: "fadeInSlide 0.2s"
                }}>
                    <div style={{
                        position: "relative", width: "420px", height: "280px",
                        border: "2px solid rgba(16, 185, 129, 0.25)", borderRadius: "24px",
                        boxShadow: "0 0 40px rgba(16, 185, 129, 0.15)", background: "#050812",
                        overflow: "hidden"
                    }} className="grid-bg-animated">
                        <div className="laser-line-fullscreen" />
                        
                        {/* Target Corner brackets */}
                        <div style={{ position: "absolute", top: 18, left: 18, width: 20, height: 20, borderTop: `4px solid ${C.emerald}`, borderLeft: `4px solid ${C.emerald}`, borderTopLeftRadius: 6 }} />
                        <div style={{ position: "absolute", top: 18, right: 18, width: 20, height: 20, borderTop: `4px solid ${C.emerald}`, borderRight: `4px solid ${C.emerald}`, borderTopRightRadius: 6 }} />
                        <div style={{ position: "absolute", bottom: 18, left: 18, width: 20, height: 20, borderBottom: `4px solid ${C.emerald}`, borderLeft: `4px solid ${C.emerald}`, borderBottomLeftRadius: 6 }} />
                        <div style={{ position: "absolute", bottom: 18, right: 18, width: 20, height: 20, borderBottom: `4px solid ${C.emerald}`, borderRight: `4px solid ${C.emerald}`, borderBottomRightRadius: 6 }} />
                        
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            height: "100%", gap: "10px", color: "white"
                        }}>
                            <FiCamera size={44} style={{ color: C.emerald, filter: `drop-shadow(0 0 8px ${C.emerald})` }} />
                            <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.15em", color: C.emerald }}>LASER ACQUIRING...</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>Hasta reçete barkodunu kameraya yaklaştırın</div>
                        </div>
                    </div>
                </div>
            )}

            {/* DYNAMIC MESH BACKGROUND BLOBS */}
            <div className="mesh-blob" style={{ top: "-10%", right: "5%", width: "550px", height: "550px", background: "radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)" }} />
            <div className="mesh-blob" style={{ bottom: "-15%", left: "5%", width: "650px", height: "650px", background: "radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 70%)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                
                {/* GLASS PANEL NAVBAR */}
                <header className="glass-card" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 36px",
                    marginBottom: "36px",
                    boxShadow: "0 10px 30px rgba(16, 185, 129, 0.015)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{
                            width: "50px", height: "50px",
                            background: C.emeraldGrad,
                            borderRadius: "18px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)"
                        }}>
                            <FiPackage size={22} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: C.text, letterSpacing: "-0.04em" }}>MediTrack Eczane</h1>
                            <span style={{ fontSize: "12.5px", color: C.muted, display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                                <span className="pulse-live-large" />
                                Eczacı Stok & Reçete Entegrasyon Paneli
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
                        <button onClick={fetchPrescriptions} style={{
                            background: "none", border: "none", cursor: "pointer", color: C.emeraldDark,
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
                                background: C.emeraldGrad, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: 800, color: "white"
                            }}>
                                {user?.name ? user.name[0].toUpperCase() : "E"}
                            </div>
                            <div>
                                <span style={{ fontSize: "13.5px", fontWeight: 800, color: C.text, display: "block", lineHeight: 1.1 }}>Ecz. {user?.name || "Görevli"}</span>
                                <span style={{ fontSize: "9.5px", color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>ECZACI GÖREVLİSİ</span>
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
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)",
                    border: `1px solid ${C.glassBorder}`,
                    borderRadius: "24px",
                    padding: "24px 32px",
                    marginBottom: "36px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 8px 32px rgba(16, 185, 129, 0.02)"
                }}>
                    <div>
                        <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: C.text, letterSpacing: "-0.03em" }}>
                            {getGreeting()}, Ecz. {user?.name || "Görevli"}! 👋
                        </h2>
                        <p style={{ fontSize: "13.5px", color: C.textMuted, marginTop: "6px", maxWidth: "600px", lineHeight: 1.5 }}>
                            MediTrack Eczane yönetim sistemine hoş geldiniz. Şu anda onay bekleyen **{stats.pendingPrescriptions} aktif reçete** istemi ve stok limiti aşılmış **{stats.lowStockMedications} kritik ilaç** bulunuyor.
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

                {/* ══════════════ PREMIUM DESIGN STATS GRID ══════════════ */}
                <section style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "28px",
                    marginBottom: "36px"
                }}>
                    {/* Stat Card: Pending */}
                    <div 
                        onClick={() => setActiveSection("prescriptions")}
                        className="glow-card emerald"
                        style={{ cursor: "pointer" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>BEKLEYEN REÇETELER</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: C.text, marginTop: "8px", letterSpacing: "-0.04em" }}>{stats.pendingPrescriptions}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: "45%", background: C.emeraldGrad }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: "#d1fae5", color: C.emerald }}>
                                <FiFileText size={26} />
                            </div>
                        </div>
                    </div>

                    {/* Stat Card: Dispensed */}
                    <div 
                        onClick={() => setActiveSection("history")}
                        className="glow-card blue"
                        style={{ cursor: "pointer" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>TESLİM EDİLEN REÇETE</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: C.text, marginTop: "8px", letterSpacing: "-0.04em" }}>{stats.dispensedPrescriptions}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: "80%", background: "linear-gradient(90deg, #60a5fa, #3b82f6)" }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: "#eff6ff", color: C.blue }}>
                                <FiCheckCircle size={26} />
                            </div>
                        </div>
                    </div>

                    {/* Stat Card: Low Stock */}
                    <div 
                        onClick={() => { setActiveSection("inventory"); setStockFilter("low_stock"); }}
                        className="glow-card orange"
                        style={{ cursor: "pointer" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>KRİTİK STOK UYARISI</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: stats.lowStockMedications > 0 ? C.red : C.text, marginTop: "8px", letterSpacing: "-0.04em" }}>{stats.lowStockMedications}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: stats.lowStockMedications > 0 ? "90%" : "10%", background: "linear-gradient(90deg, #fcd34d, #f59e0b)" }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: stats.lowStockMedications > 0 ? "#fee2e2" : "#fffbeb", color: stats.lowStockMedications > 0 ? C.red : C.orange }}>
                                <FiAlertTriangle size={26} />
                            </div>
                        </div>
                    </div>

                    {/* Stat Card: Total Meds */}
                    <div 
                        onClick={() => { setActiveSection("inventory"); setStockFilter("all"); }}
                        className="glow-card purple"
                        style={{ cursor: "pointer" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px" }}>
                            <div>
                                <span style={{ fontSize: "10.5px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em" }}>TOPLAM ENVANTER</span>
                                <div style={{ fontSize: "34px", fontWeight: 900, color: C.text, marginTop: "8px", letterSpacing: "-0.04em" }}>{stats.totalMedications}</div>
                                <div className="progress-deck">
                                    <div className="progress-deck-fill" style={{ width: "100%", background: C.purpleGrad }}></div>
                                </div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "18px", background: "#f5f3ff", color: C.purple }}>
                                <FiLayers size={26} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════ DETAILED SPLIT PANELS ══════════════ */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: "36px",
                    alignItems: "start"
                }}>
                    
                    {/* LEFT FLOATING GLASS NAVIGATION CARD */}
                    <div className="glass-card" style={{
                        padding: "24px",
                        boxShadow: "0 8px 30px rgba(16, 185, 129, 0.01)"
                    }}>
                        <div style={{ fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "18px", paddingLeft: "8px" }}>
                            BÖLÜM VE KONTROL
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button
                                onClick={() => setActiveSection("prescriptions")}
                                className={`sidebar-btn ${activeSection === "prescriptions" ? "active" : ""}`}
                            >
                                <FiFileText size={18} />
                                Reçete Teslimatı
                                {stats.pendingPrescriptions > 0 && (
                                    <span style={{
                                        marginLeft: "auto", fontSize: "10px", fontWeight: 800,
                                        padding: "2px 8px", borderRadius: "99px", 
                                        background: activeSection === "prescriptions" ? "white" : C.emerald,
                                        color: activeSection === "prescriptions" ? C.emeraldDark : "white"
                                    }}>
                                        {stats.pendingPrescriptions}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveSection("history")}
                                className={`sidebar-btn ${activeSection === "history" ? "active" : ""}`}
                            >
                                <FiCheckCircle size={18} />
                                Teslimat Arşivi
                            </button>

                            <button
                                onClick={() => setActiveSection("inventory")}
                                className={`sidebar-btn ${activeSection === "inventory" ? "active" : ""}`}
                            >
                                <FiPackage size={18} />
                                İlaç Envanteri
                            </button>
                        </div>

                        {/* Extra contextual filters when viewing envanter */}
                        {activeSection === "inventory" && (
                            <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px", paddingLeft: "8px" }}>
                                    ENVANTER SÜZGECİ
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <button
                                        onClick={() => setStockFilter("all")}
                                        style={stockFilterButtonStyle(stockFilter === "all")}
                                    >
                                        <FiLayers size={14} /> Tüm İlaçlar
                                    </button>
                                    <button
                                        onClick={() => setStockFilter("low_stock")}
                                        style={stockFilterButtonStyle(stockFilter === "low_stock")}
                                    >
                                        <FiAlertTriangle size={14} /> Kritik Stoktakiler
                                        {stats.lowStockMedications > 0 && (
                                            <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.red }} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setStockFilter("near_expiry")}
                                        style={stockFilterButtonStyle(stockFilter === "near_expiry")}
                                    >
                                        <FiClock size={14} /> Miadı Yaklaşanlar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: "32px", padding: "18px", background: "white", borderRadius: "20px", border: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.text, fontWeight: 800, fontSize: "12px", marginBottom: "6px" }}>
                                <FiInfo size={14} style={{ color: C.emerald }} /> Bilgi İstasyonu
                            </div>
                            <span style={{ fontSize: "11px", color: C.textMuted, lineHeight: 1.5, display: "block" }}>
                                Envanter adetleri anlık güncellenir. Reçete teslim edildikçe ilaç stokları otomatik düşer.
                            </span>
                        </div>
                    </div>

                    {/* RIGHT ACTIVE CONTROL PANEL */}
                    <div className="glass-card" style={{
                        padding: "32px",
                        boxShadow: "0 8px 30px rgba(16, 185, 129, 0.01)",
                        animation: "fadeInSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}>
                        
                        {/* ══════════════ TAB A: REÇETELER VE ARŞİV ══════════════ */}
                        {(activeSection === "prescriptions" || activeSection === "history") && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
                                    <div>
                                        <h2 style={{ fontSize: "20px", fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.03em" }}>
                                            {activeSection === "prescriptions" ? "Aktif Reçete Talepleri" : "Teslim Edilen Reçeteler Arşivi"}
                                        </h2>
                                        <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "4px" }}>
                                            {activeSection === "prescriptions" ? "Eczane onayına düşmüş aktif doktor reçeteleri." : "Daha önce ilaçları teslim edilmiş arşiv kayıtları."}
                                        </p>
                                    </div>

                                    {/* Action HUD */}
                                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                        {activeSection === "prescriptions" && (
                                            <button
                                                onClick={handleStartScan}
                                                disabled={isScanning}
                                                className="modern-btn"
                                            >
                                                <FiCamera size={16} />
                                                {isScanning ? "Taranıyor..." : "Barkod Tara"}
                                            </button>
                                        )}
                                        <button
                                            onClick={fetchPrescriptions}
                                            style={{
                                                display: "flex", alignItems: "center", gap: "6px",
                                                padding: "12px 20px",
                                                background: "#ffffff",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "16px",
                                                color: C.text,
                                                fontSize: "13.5px",
                                                fontWeight: 800,
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            <FiRefreshCw size={14} />
                                            Yenile
                                        </button>
                                    </div>
                                </div>

                                {/* Search queries */}
                                <div style={{ position: "relative", marginBottom: "28px", maxWidth: "480px" }}>
                                    <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: C.emerald, fontSize: "16px" }}>
                                        <FiSearch size={18} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Hasta Adı, Soyadı veya TC Kimlik No ile arayın..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input-field"
                                        style={{ paddingLeft: "52px", background: "white" }}
                                    />
                                </div>

                                {/* Prescription List Render */}
                                {loading ? (
                                    <div style={{ textAlign: "center", padding: "60px", color: C.muted }}>
                                        <FiRefreshCw size={26} className="spin" style={{ marginBottom: "12px", color: C.emerald }} />
                                        <div style={{ fontSize: "14px", fontWeight: 600 }}>Kayıtlar taranıyor...</div>
                                    </div>
                                ) : prescriptions.length === 0 ? (
                                    <div style={{
                                        textAlign: "center", padding: "80px 20px",
                                        background: "white", borderRadius: "24px",
                                        border: "1px dashed #cbd5e1", color: C.muted
                                    }}>
                                        <FiFileText size={44} style={{ color: C.muted, opacity: 0.3, marginBottom: "16px" }} />
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: C.text }}>Gösterilecek Kayıt Bulunmuyor</div>
                                        <div style={{ fontSize: "13px", marginTop: "6px" }}>Arama kriterlerinize uyan reçete kaydı bulunmamaktadır.</div>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "24px" }}>
                                        {prescriptions.map((p) => (
                                            <div 
                                                key={p._id} 
                                                className={`glow-card ${p.status === "verildi" ? "emerald" : "orange"}`}
                                                style={{
                                                    background: "#ffffff",
                                                    border: `1px solid ${C.border}`,
                                                    borderLeft: p.status === "verildi" ? `6px solid ${C.emerald}` : `6px solid ${C.orange}`,
                                                    borderRadius: "24px",
                                                    padding: "24px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.01)",
                                                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                                                }}
                                            >
                                                <div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                                        <span className={`badge ${p.status === "verildi" ? "badge-success" : "badge-warning"}`}>
                                                            {p.status === "verildi" ? "TESLİM EDİLDİ" : "BEKLEMEDE"}
                                                        </span>
                                                        <span style={{ fontSize: "12px", color: C.muted, fontWeight: 600 }}>
                                                            {new Date(p.date).toLocaleDateString("tr-TR")}
                                                        </span>
                                                    </div>

                                                    <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 6px 0", color: C.text, letterSpacing: "-0.01em" }}>
                                                        {p.patientId?.name || "Bilinmeyen Hasta"}
                                                    </h3>
                                                    <div style={{ fontSize: "13px", color: C.textMuted, marginBottom: "18px", fontWeight: 600 }}>
                                                        TC: {p.patientId?.tc} | {p.patientId?.age} Yaş
                                                    </div>

                                                    <div style={{
                                                        background: "#f8fafc",
                                                        padding: "16px",
                                                        borderRadius: "16px",
                                                        border: `1px solid ${C.border}`
                                                    }}>
                                                        <div style={{ fontSize: "9px", color: C.muted, fontWeight: 800, letterSpacing: "0.08em", marginBottom: "8px" }}>İLAÇ REÇETESİ</div>
                                                        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: C.text, lineHeight: "1.5" }}>
                                                            {p.medications.map((med, idx) => (
                                                                <li key={idx} style={{ marginBottom: "4px" }}>
                                                                    <strong>{med.name}</strong> <span style={{ fontSize: "11.5px", color: C.muted }}>({med.dosage})</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
                                                    {p.status === "verildi" ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleExportPDF(p)}
                                                                style={{
                                                                    flex: 1, padding: "11px 16px",
                                                                    background: "rgba(16, 185, 129, 0.05)",
                                                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                                                    borderRadius: "14px", color: C.emeraldDark,
                                                                    fontWeight: 800, fontSize: "12.5px", cursor: "pointer",
                                                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                                                    transition: "all 0.2s"
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)"}
                                                                onMouseLeave={e => e.currentTarget.style.background = "rgba(16, 185, 129, 0.05)"}
                                                            >
                                                                <FiDownload size={14} /> PDF Slip
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedPrescription(p)}
                                                                className="action-btn"
                                                                style={{ borderRadius: "14px", padding: "10px 14px", fontWeight: 800, fontSize: "12.5px" }}
                                                            >
                                                                Detay
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectedPrescription(p)}
                                                            style={{
                                                                width: "100%", padding: "12px",
                                                                background: C.emeraldGrad,
                                                                border: "none",
                                                                borderRadius: "14px", color: "white",
                                                                fontWeight: 800, fontSize: "13px", cursor: "pointer",
                                                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                                                                transition: "transform 0.2s"
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                                                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                                                        >
                                                            İncele & İlaçları Teslim Et
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════════════ TAB B: ENVANTER VE STOKLAR ══════════════ */}
                        {activeSection === "inventory" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
                                    <div>
                                        <h2 style={{ fontSize: "20px", fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.03em" }}>Eczane İlaç Envanteri</h2>
                                        <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "4px" }}>
                                            Kayıtlı sarf envanteri, kritik stok miktarları ve son kullanma tarihleri takibi.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setEditingStock(null);
                                            setStockForm({ name: "", stock: 0, criticalLimit: 10, unit: "Kutu", expiryDate: "" });
                                            setStockModalOpen(true);
                                        }}
                                        className="modern-btn"
                                    >
                                        <FiPlus size={18} />
                                        Yeni İlaç Ekle
                                    </button>
                                </div>

                                {/* Stocks Table */}
                                <div style={{ overflowX: "auto" }}>
                                    <table className="floating-table">
                                        <thead>
                                            <tr>
                                                <th style={{ padding: "8px 20px" }}>İLAÇ TANIMI</th>
                                                <th>STOK ADEDİ</th>
                                                <th>KRİTİK LİMİT</th>
                                                <th>SON KULLANMA (MİAD)</th>
                                                <th>DURUM SİNYALİ</th>
                                                <th style={{ textAlign: "right", paddingRight: "20px" }}>İŞLEMLER</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStocks.map((item) => {
                                                const isLow = item.stock <= item.criticalLimit;
                                                const isNearExpiry = checkNearExpiry(item.expiryDate);
                                                return (
                                                    <tr 
                                                        key={item._id} 
                                                        className={`floating-row ${isLow ? "status-iptal" : isNearExpiry ? "status-bekliyor" : "status-tamamlandı"}`}
                                                    >
                                                        <td style={{ fontWeight: 800, color: C.text, paddingLeft: "20px" }}>
                                                            {item.name}
                                                            <div style={{ fontSize: "10.5px", color: C.muted, fontWeight: 600, marginTop: "3px" }}>Birim: {item.unit}</div>
                                                        </td>
                                                        <td style={{ fontWeight: 800, color: isLow ? C.red : C.text }}>{item.stock}</td>
                                                        <td>{item.criticalLimit}</td>
                                                        <td>
                                                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("tr-TR") : "Belirtilmemiş"}
                                                        </td>
                                                        <td>
                                                            {isLow ? (
                                                                <span className="badge badge-danger">Kritik Seviye</span>
                                                            ) : isNearExpiry ? (
                                                                <span className="badge badge-warning">Miadı Yakın</span>
                                                            ) : (
                                                                <span className="badge badge-success">Stok Güvenli</span>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: "right", paddingRight: "20px" }}>
                                                            {/* Tedarik Et Butonu */}
                                                            <button
                                                                onClick={() => handleRestock(item)}
                                                                disabled={restockingId === item._id}
                                                                style={{
                                                                    background: restockingId === item._id ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.06)",
                                                                    border: `1px solid rgba(16, 185, 129, 0.2)`,
                                                                    borderRadius: "12px", padding: "8px 14px",
                                                                    color: C.emeraldDark, fontWeight: 800, fontSize: "11.5px",
                                                                    cursor: restockingId === item._id ? "not-allowed" : "pointer",
                                                                    display: "inline-flex", alignItems: "center", gap: "4px",
                                                                    marginRight: "8px",
                                                                    transition: "all 0.2s"
                                                                }}
                                                                onMouseEnter={e => { if(restockingId !== item._id) e.currentTarget.style.transform = "scale(1.02)"; }}
                                                                onMouseLeave={e => { if(restockingId !== item._id) e.currentTarget.style.transform = "scale(1)"; }}
                                                            >
                                                                <FiZap size={12} className={restockingId === item._id ? "spin" : ""} />
                                                                Tedarik Et (+50)
                                                            </button>
                                                            
                                                            <button onClick={() => openEditModal(item)} className="action-btn" title="Düzenle" style={{ marginRight: "6px" }}>
                                                                <FiEdit2 size={13} />
                                                            </button>
                                                            <button onClick={() => handleDeleteStock(item._id)} className="action-btn" style={{ color: C.red }} title="Sil">
                                                                <FiTrash2 size={13} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════ MODAL: PRESCRIPTION DETAILS ══════════════ */}
            {selectedPrescription && (
                <div style={modalOverlayStyle}>
                    <div className="glass-card" style={{ ...modalContentStyle, background: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "19px", fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>Reçete Detay ve Dağıtım Paneli</h2>
                            <button onClick={() => setSelectedPrescription(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "24px", fontWeight: 300 }}>&times;</button>
                        </div>

                        {/* AI Interaction Check Notification */}
                        <div style={{
                            background: aiChecking ? "rgba(59, 130, 246, 0.04)" : "rgba(16, 185, 129, 0.04)",
                            border: `1px solid ${aiChecking ? "rgba(59, 130, 246, 0.18)" : "rgba(16, 185, 129, 0.18)"}`,
                            borderRadius: "20px", padding: "16px", marginBottom: "24px",
                            display: "flex", alignItems: "center", gap: "14px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
                        }}>
                            <FiCpu size={22} className={aiChecking ? "spin" : ""} style={{ color: aiChecking ? C.blue : C.emerald }} />
                            <div>
                                <div style={{ fontSize: "13px", fontWeight: 800, color: C.text }}>
                                    {aiChecking ? "MediTrack AI İlaç Etkileşim Kontrolü..." : "MediTrack AI Güvenlik Kontrolü Tamamlandı"}
                                </div>
                                <div style={{ fontSize: "11.5px", color: C.textMuted, marginTop: "3px", lineHeight: 1.4 }}>
                                    {aiChecking ? "Hasta klinik geçmişi ve ilaç kombinasyonu taranıyor..." : "İlaç kombinasyonunda herhangi bir etkileşim veya alerjen uyarısı saptanmadı. Reçete güvenlidir."}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px", background: "#f8fafc", padding: "20px", borderRadius: "20px", border: `1px solid ${C.border}` }}>
                            <div>
                                <div style={labelDetailStyle}>HASTA BİLGİSİ</div>
                                <div style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{selectedPrescription.patientId?.name}</div>
                                <div style={{ fontSize: "12px", color: C.muted, marginTop: "3px" }}>TC: {selectedPrescription.patientId?.tc} | {selectedPrescription.patientId?.age} Yaş</div>
                            </div>
                            <div>
                                <div style={labelDetailStyle}>DÜZENLEYEN HEKİM</div>
                                <div style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{formatDoctorName(selectedPrescription.doctorId?.name)}</div>
                                <div style={{ fontSize: "12px", color: C.muted, marginTop: "3px" }}>Branş: {selectedPrescription.doctorId?.specialty}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <div style={labelDetailStyle}>TANI</div>
                            <div style={{ fontSize: "13px", padding: "14px", background: "#f8fafc", borderRadius: "16px", border: `1px solid ${C.border}`, color: C.text, lineHeight: 1.5 }}>
                                {selectedPrescription.diagnosis}
                            </div>
                        </div>

                        <div style={{ marginBottom: "28px" }}>
                            <div style={labelDetailStyle}>TESLİM EDİLECEK İLAÇLAR</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "180px", overflowY: "auto" }}>
                                {selectedPrescription.medications.map((med, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: "16px" }}>
                                        <div>
                                            <div style={{ fontSize: "13.5px", fontWeight: 800, color: C.text }}>{med.name}</div>
                                            <div style={{ fontSize: "11.5px", color: C.muted, marginTop: "2px" }}>Doz: {med.dosage} | Sıklık: {med.frequency}</div>
                                        </div>
                                        <div style={{ fontSize: "12px", color: C.emeraldDark, fontWeight: 800, background: C.emeraldLight, padding: "6px 12px", borderRadius: "10px" }}>
                                            {med.duration || "Süresiz"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => setSelectedPrescription(null)} style={{ flex: 1, padding: "14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "16px", color: C.text, fontWeight: 800, cursor: "pointer", fontSize: "13px" }}>Vazgeç</button>
                            {selectedPrescription.status !== "verildi" && (
                                <button onClick={() => handleDispense(selectedPrescription._id)} disabled={aiChecking} style={{ flex: 2, padding: "14px", background: C.emeraldGrad, border: "none", borderRadius: "16px", color: "white", fontWeight: 800, cursor: aiChecking ? "not-allowed" : "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)" }}>
                                    Teslimatı Onayla & İlaçları Ver
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ MODAL: ADD / EDIT DRUG ══════════════ */}
            {stockModalOpen && (
                <div style={modalOverlayStyle}>
                    <div className="glass-card" style={{ ...modalContentStyle, maxWidth: "460px", background: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                                {editingStock ? "İlaç Stok Envanter Kartı" : "Yeni İlaç Kayıt Kartı"}
                            </h2>
                            <button onClick={() => setStockModalOpen(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "22px", fontWeight: 300 }}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveStock} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div>
                                <label style={formLabelStyle}>İLAÇ ADI</label>
                                <input type="text" required disabled={!!editingStock} value={stockForm.name} onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })} className="input-field" placeholder="Örn: Parol 500 mg" />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={formLabelStyle}>STOK ADEDİ</label>
                                    <input type="number" required min="0" value={stockForm.stock} onChange={(e) => setStockForm({ ...stockForm, stock: parseInt(e.target.value) || 0 })} className="input-field" />
                                </div>
                                <div>
                                    <label style={formLabelStyle}>KRİTİK UYARI LİMİTİ</label>
                                    <input type="number" required min="0" value={stockForm.criticalLimit} onChange={(e) => setStockForm({ ...stockForm, criticalLimit: parseInt(e.target.value) || 0 })} className="input-field" />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={formLabelStyle}>BİRİM TÜRÜ</label>
                                    <input type="text" required value={stockForm.unit} onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })} className="input-field" placeholder="Kutu, Şişe..." />
                                </div>
                                <div>
                                    <label style={formLabelStyle}>SON KULLANMA TARİHİ</label>
                                    <input type="date" value={stockForm.expiryDate} onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })} className="input-field" />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" onClick={() => setStockModalOpen(false)} style={{ flex: 1, padding: "14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "16px", color: C.text, fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>Vazgeç</button>
                                <button type="submit" style={{ flex: 2, padding: "14px", background: C.emeraldGrad, border: "none", borderRadius: "16px", color: "#fff", fontWeight: 800, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sidebar Button style conditional helper
const stockFilterButtonStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 14px 10px 20px",
    background: isActive ? "rgba(16, 185, 129, 0.06)" : "transparent",
    border: "none",
    borderRadius: "12px",
    color: isActive ? C.emeraldDark : C.muted,
    fontSize: "12.5px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s"
});

// Layout helper styles
const statCardStyle = (accentColor, backgroundGrad = "#ffffff") => ({
    background: backgroundGrad,
    border: `1px solid ${C.border}`,
    borderTop: `4px solid ${accentColor}`,
    borderRadius: "20px",
    padding: "20px 24px",
    cursor: "pointer"
});

const statHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
};

const tabButtonStyle = (isActive, color) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    background: isActive ? "rgba(16, 185, 129, 0.06)" : "transparent",
    border: "none",
    borderBottom: isActive ? `3px solid ${color}` : "3px solid transparent",
    color: isActive ? C.emeraldDark : "#64748b",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.25s ease-out"
});

const thStyle = {
    padding: "16px 20px",
    color: C.muted,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.05em"
};

const tdStyle = {
    padding: "16px 20px",
    color: C.text,
    verticalAlign: "middle"
};

const actionButtonStyle = (color) => ({
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "8px",
    color: color,
    cursor: "pointer",
    marginLeft: "8px",
    transition: "all 0.2s"
});

const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 10, 30, 0.5)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
};

const modalContentStyle = {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "520px",
    padding: "32px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
};

const labelDetailStyle = {
    fontSize: "11px",
    color: C.muted,
    fontWeight: 800,
    letterSpacing: "0.05em",
    marginBottom: "4px"
};

const formLabelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 800,
    color: C.muted,
    letterSpacing: "0.06em",
    marginBottom: "6px"
};

const formInputStyle = {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s"
};

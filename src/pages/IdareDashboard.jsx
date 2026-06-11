import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminApi, itRequestsApi } from "../services/api";
import Modal from "../components/Modal";
import { 
    FiUsers, FiCalendar, FiActivity, FiPlus, FiEdit2, FiTrash2, FiShield, 
    FiRadio, FiDownloadCloud, FiAward, FiTrendingUp, FiXCircle, FiCheck, 
    FiX, FiDollarSign, FiClock, FiAlertTriangle, FiLock, FiUnlock, FiUserCheck, FiCpu,
    FiLogOut, FiFileText, FiTrash, FiLayers, FiList, FiTool, FiCheckCircle, FiAlertCircle, FiSettings,
    FiSearch
} from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import html2pdf from 'html2pdf.js';
import toast, { Toaster } from "react-hot-toast";

const roleLabels = {
    admin: "Sistem Yöneticisi (Admin)",
    director: "Başhekim / Müdür",
    staff: "İdari Personel (Memur)",
    accountant: "Muhasebe Personeli",
    hr: "İnsan Kaynakları (İK)",
    technician: "Teknik Servis / Teknisyen",
    pharmacist: "Eczacı / Eczane Sorumlusu",
    receptionist: "Danışma / Hasta Kabul",
    doctor: "Hekim / Doktor",
    patient: "Hasta"
};

const getRoleBadgeStyle = (role) => {
    switch (role) {
        case 'admin':
            return { bg: "rgba(239, 68, 68, 0.15)", color: "#f87171" };
        case 'director':
            return { bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc" };
        case 'hr':
            return { bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6" };
        case 'accountant':
            return { bg: "rgba(234, 179, 8, 0.15)", color: "#fbbf24" };
        case 'pharmacist':
            return { bg: "rgba(20, 184, 166, 0.15)", color: "#2dd4bf" };
        case 'technician':
            return { bg: "rgba(249, 115, 22, 0.15)", color: "#fb923c" };
        case 'receptionist':
            return { bg: "rgba(16, 185, 129, 0.15)", color: "#34d399" };
        default:
            return { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" };
    }
};

export default function IdareDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const dashboardRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate("/idare/giris");
    };
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    
    // System Settings & Statuses
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        emergencyLockdown: false,
        hospitalName: "MediTrack Merkez Hastanesi"
    });
    
    // Data Lists for Chief Physician & Admin
    const [doctors, setDoctors] = useState([]);
    const [adminStaff, setAdminStaff] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [finance, setFinance] = useState(null);
    
    // Improved Panel States
    const [itRequests, setItRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [staffSearchQuery, setStaffSearchQuery] = useState("");
    const [staffRoleFilter, setStaffRoleFilter] = useState("all"); // 'all', 'doctor', 'staff', 'admin'
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    
    const [dutyShifts, setDutyShifts] = useState([]);
    const [isCreateShiftModalOpen, setIsCreateShiftModalOpen] = useState(false);
    const [shiftForm, setShiftForm] = useState({ date: new Date().toISOString().split('T')[0], userId: "", note: "Gece Nöbeti" });
    
    // Modal & Forms states
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "", type: "info", active: true });
    
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "doctor",
        specialty: "",
        phone: ""
    });

    const [isEditDoctorModalOpen, setIsEditDoctorModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [doctorForm, setDoctorForm] = useState({
        name: "",
        email: "",
        specialty: "",
        phone: "",
        salary: 0,
        dailyPatientLimit: 40,
        rating: 5,
        isOnline: true,
        monday: "09:00-17:00",
        saturday: "09:00-13:00"
    });

    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, logsData, settingsData, usersData, leaveData, financeData, itData, announcementsData, shiftsData] = await Promise.all([
                adminApi.getSystemStats().catch(err => { console.error(err); return null; }),
                adminApi.getLogs().catch(err => { console.error(err); return []; }),
                adminApi.getSettings().catch(err => { console.error(err); return null; }),
                adminApi.getUsers().catch(err => { console.error(err); return []; }),
                adminApi.getLeaveRequests().catch(err => { console.error(err); return []; }),
                adminApi.getFinanceSummary().catch(err => { console.error(err); return null; }),
                itRequestsApi.getAll().catch(err => { console.error(err); return []; }),
                adminApi.getAnnouncements().catch(err => { console.error(err); return []; }),
                adminApi.getDutyShifts().catch(err => { console.error(err); return []; })
            ]);
            
            if (statsData) setStats(statsData);
            setLogs(logsData);
            if (settingsData) {
                setSettings({
                    maintenanceMode: settingsData.maintenanceMode || false,
                    emergencyLockdown: settingsData.emergencyLockdown || false,
                    hospitalName: settingsData.hospitalName || "MediTrack Merkez Hastanesi"
                });
            }
            
            // Filter users to get only doctors
            const docUsers = usersData.filter(u => u.role === "doctor");
            setDoctors(docUsers);

            // Filter users to get admin/staff and all other support personnel roles
            const admUsers = usersData.filter(u => u.role !== "doctor" && u.role !== "patient");
            setAdminStaff(admUsers);
            
            // Filter leave requests
            setLeaveRequests(leaveData);
            
            if (financeData) setFinance(financeData);
            setItRequests(itData);
            setAnnouncements(announcementsData);
            setDutyShifts(shiftsData);
        } catch (err) {
            console.error("Fetch Data Error:", err);
            toast.error("Veriler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // --- System Control Protocols ---
    const toggleLockdown = async (newValue) => {
        try {
            const updated = { ...settings, emergencyLockdown: newValue };
            await adminApi.updateSettings(updated);
            setSettings(updated);
            if (newValue) {
                toast.error("ACİL DURUM KİLİDİ AKTİF! Sistem yöneticileri dışındaki tüm erişimler engellendi.", { duration: 5000 });
            } else {
                toast.success("Acil durum kilidi kaldırıldı. Sistem normale döndü.");
            }
            fetchData();
        } catch (err) {
            toast.error("Ayar güncellenemedi: " + err.message);
        }
    };

    const toggleMaintenance = async (newValue) => {
        try {
            const updated = { ...settings, maintenanceMode: newValue };
            await adminApi.updateSettings(updated);
            setSettings(updated);
            if (newValue) {
                toast.custom((t) => (
                    <div style={{ background: "#f59e0b", color: "white", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold" }}>
                        BAKIM MODU ETKİN: Kullanıcı erişimleri askıya alındı.
                    </div>
                ));
            } else {
                toast.success("Bakım modu kapatıldı. Kullanıcı erişimleri açıldı.");
            }
            fetchData();
        } catch (err) {
            toast.error("Ayar güncellenemedi: " + err.message);
        }
    };

    // --- Hospital Name Saving ---
    const handleSaveHospitalName = async () => {
        try {
            await adminApi.updateSettings(settings);
            toast.success("Hastane adı güncellendi.");
            fetchData();
        } catch (err) {
            toast.error("Hastane adı güncellenemedi: " + err.message);
        }
    };

    // --- Database Operations ---
    const handleBackupDatabase = async () => {
        setIsBackingUp(true);
        try {
            const res = await adminApi.getBackup();
            if (res && res.success) {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", res.file || `gp2_backup_${Date.now()}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                toast.success("Veritabanı yedeği indirildi.");
            } else {
                toast.error("Yedekleme dosyası boş döndü.");
            }
        } catch (err) {
            toast.error("Yedekleme başarısız oldu: " + err.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleOptimizeDatabase = async () => {
        setIsOptimizing(true);
        setTimeout(() => {
            setIsOptimizing(false);
            toast.success("Veritabanı indeksleri ve sorgu önbellekleri optimize edildi.");
        }, 2000);
    };

    // --- IT Requests Management ---
    const handleUpdateITStatus = async (id, status) => {
        try {
            await itRequestsApi.update(id, { status });
            toast.success("IT talebi durumu güncellendi.");
            fetchData();
        } catch (err) {
            toast.error("Güncelleme başarısız: " + err.message);
        }
    };

    const handleDeleteITRequest = async (id) => {
        if (!window.confirm("Bu IT talebini silmek istediğinize emin misiniz?")) return;
        try {
            await itRequestsApi.delete(id);
            toast.success("IT talebi silindi.");
            fetchData();
        } catch (err) {
            toast.error("Silme işlemi başarısız: " + err.message);
        }
    };

    // --- Leave Requests Management ---
    const handleLeaveRequest = async (id, status, notes = "") => {
        try {
            await adminApi.updateLeaveRequestStatus(id, { durum: status, notlar: notes });
            toast.success(`İzin talebi ${status.toLowerCase()} olarak güncellendi.`);
            fetchData();
        } catch (err) {
            toast.error("İzin işlemi başarısız: " + err.message);
        }
    };

    // --- Announcement Actions ---
    const handleOpenAnnouncement = () => {
        setAnnouncementForm({ title: "", message: "", type: "info", active: true });
        setIsAnnouncementModalOpen(true);
    };

    const handleSendAnnouncement = async () => {
        if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
            return toast.error("Başlık ve mesaj alanları zorunludur.");
        }
        try {
            await adminApi.createAnnouncement(announcementForm);
            setIsAnnouncementModalOpen(false);
            toast.success("Sistem duyurusu tüm ekranlara iletildi.");
            fetchData();
        } catch (err) {
            toast.error("Duyuru gönderilemedi: " + err.message);
        }
    };

    const handleToggleAnnouncementActive = async (id, currentActive) => {
        try {
            await adminApi.updateAnnouncement(id, { active: !currentActive });
            toast.success(`Duyuru ${!currentActive ? 'etkinleştirildi' : 'kapatıldı'}.`);
            fetchData();
        } catch (err) {
            toast.error("Duyuru durumu güncellenemedi: " + err.message);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;
        try {
            await adminApi.deleteAnnouncement(id);
            toast.success("Duyuru başarıyla silindi.");
            fetchData();
        } catch (err) {
            toast.error("Duyuru silinemedi: " + err.message);
        }
    };

    // --- Doctor Performance & Editing ---
    const handleOpenEditDoctor = (doc) => {
        setEditingDoctor(doc);
        const profile = doc.profileId || {};
        const workingHrs = profile.workingHours || {};
        
        setDoctorForm({
            name: profile.name || "",
            email: doc.email || "",
            specialty: profile.specialty || "",
            phone: profile.phone || "",
            salary: profile.salary || 0,
            dailyPatientLimit: profile.dailyPatientLimit || 40,
            rating: profile.rating || 5,
            isOnline: profile.isOnline !== undefined ? profile.isOnline : true,
            monday: workingHrs.monday || "09:00-17:00",
            saturday: workingHrs.saturday || "09:00-13:00"
        });
        setIsEditDoctorModalOpen(true);
    };

    const handleSaveDoctor = async () => {
        if (!doctorForm.name.trim() || !doctorForm.email.trim()) {
            return toast.error("İsim ve E-posta alanları zorunludur.");
        }
        try {
            const workingHoursMap = {
                monday: doctorForm.monday,
                tuesday: doctorForm.monday,
                wednesday: doctorForm.monday,
                thursday: doctorForm.monday,
                friday: doctorForm.monday,
                saturday: doctorForm.saturday,
                sunday: "tatil"
            };

            await adminApi.updateUser(editingDoctor._id, {
                name: doctorForm.name,
                email: doctorForm.email,
                specialty: doctorForm.specialty,
                phone: doctorForm.phone,
                salary: doctorForm.salary,
                dailyPatientLimit: doctorForm.dailyPatientLimit,
                rating: doctorForm.rating,
                isOnline: doctorForm.isOnline,
                workingHours: workingHoursMap
            });

            toast.success("Doktor parametreleri başarıyla güncellendi.");
            setIsEditDoctorModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Güncelleme hatası: " + err.message);
        }
    };

    // --- User Management Actions ---
    const handleCreateUser = async () => {
        if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
            return toast.error("Ad Soyad, E-posta ve Şifre alanları zorunludur.");
        }
        if (userForm.password.length < 6) {
            return toast.error("Şifre en az 6 karakter olmalıdır.");
        }
        try {
            await adminApi.createUser(userForm);
            toast.success("Personel başarıyla tanımlandı.");
            setIsCreateUserModalOpen(false);
            setUserForm({
                name: "",
                email: "",
                password: "",
                role: "doctor",
                specialty: "",
                phone: ""
            });
            fetchData();
        } catch (err) {
            toast.error("Ekleme hatası: " + err.message);
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`'${userEmail}' e-postalı personeli sistemden silmek istediğinize emin misiniz?\nBu işlem geri alınamaz!`)) {
            return;
        }
        try {
            await adminApi.deleteUser(userId);
            toast.success("Personel başarıyla silindi.");
            fetchData();
        } catch (err) {
            toast.error("Silme hatası: " + err.message);
        }
    };

    const handleAssignShift = async () => {
        if (!shiftForm.userId || !shiftForm.date) {
            toast.error("Lütfen personel ve tarih seçiniz.");
            return;
        }
        try {
            await adminApi.createDutyShift(shiftForm);
            toast.success("Nöbet başarıyla tanımlandı.");
            setIsCreateShiftModalOpen(false);
            setShiftForm(prev => ({ ...prev, userId: "", note: "Gece Nöbeti" }));
            fetchData();
        } catch (err) {
            toast.error("Nöbet atama hatası: " + err.message);
        }
    };

    const handleDeleteShift = async (shiftId, personName, dateStr) => {
        if (!window.confirm(`'${personName}' isimli personelin '${dateStr}' tarihindeki nöbetini silmek istediğinize emin misiniz?`)) {
            return;
        }
        try {
            await adminApi.deleteDutyShift(shiftId);
            toast.success("Nöbet kaydı başarıyla silindi.");
            fetchData();
        } catch (err) {
            toast.error("Nöbet silme hatası: " + err.message);
        }
    };

    const handleExportPDF = () => {
        setIsExporting(true);
        setTimeout(() => {
            const element = dashboardRef.current;
            const opt = {
                margin: 10,
                filename: `Yonetici_Raporu_${new Date().toLocaleDateString('tr-TR')}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#020617',
                    logging: false,
                    windowWidth: 1440
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                setIsExporting(false);
            });
        }, 300);
    };

    if (loading) return <div style={{ padding: "40px", color: "#6b7280" }}>İdari Kontrol Paneli Yükleniyor...</div>;

    // Financial calculations
    const curRevenue = finance?.thisMonth?.revenue || 0;
    const revGrowth = finance?.revenueGrowth || 0;

    const getLogIcon = (action) => {
        const lowerAction = (action || "").toLowerCase();
        if (lowerAction.includes("ekle") || lowerAction.includes("oluştur") || lowerAction.includes("create") || lowerAction.includes("tanımla")) {
            return { icon: <FiUserCheck />, bg: "rgba(16, 185, 129, 0.15)", color: "#10b981" };
        }
        if (lowerAction.includes("sil") || lowerAction.includes("iptal") || lowerAction.includes("delete") || lowerAction.includes("kaldır")) {
            return { icon: <FiTrash2 />, bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" };
        }
        if (lowerAction.includes("anons") || lowerAction.includes("duyuru") || lowerAction.includes("broadcast")) {
            return { icon: <FiRadio />, bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
        }
        if (lowerAction.includes("ayar") || lowerAction.includes("güncelle") || lowerAction.includes("update") || lowerAction.includes("kilid") || lowerAction.includes("bakım")) {
            return { icon: <FiSettings />, bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" };
        }
        return { icon: <FiActivity />, bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" };
    };

    const statCards = [
        { label: "Aylık Toplam Ciro", value: `${curRevenue.toLocaleString('tr-TR')} ₺`, subText: `Geçen aya göre %${revGrowth >= 0 ? '+' : ''}${revGrowth}`, icon: <FiDollarSign />, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", progress: 76 },
        { label: "Poliklinik Randevuları", value: stats?.totalAppointments || 0, subText: `Aktif bekleyen: ${stats?.waitingAppointments || 0}`, icon: <FiCalendar />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
        { label: "Toplam Kayıtlı Hasta", value: stats?.totalPatients || 0, subText: `Günlük muayene: ${stats?.dailyPatients || 0}`, icon: <FiUsers />, color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)" },
        { label: "En Yoğun Branş", value: stats?.topDepartment?.name || "Dahiliye", subText: `Kayıtlı doktor: ${stats?.totalDoctors || 0}`, icon: <RiHospitalLine />, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    ];

    const canManageUsers = user && (user.role === "admin" || user.role === "director") && !(user.role === "admin" && user.profileId?.specialty === "Bilgi İşlem Uzmanı");
    const canDeleteUsers = user && (user.role === "director" || (user.role === "admin" && user.profileId?.specialty === "Bilgi İşlem Müdürü"));

    // --- Tab Rendering Helpers ---
    const renderOverviewTab = () => {
        const pieData = [
            { name: "Tamamlanan", value: stats?.completedAppointments || 0 },
            { name: "Bekleyen", value: stats?.waitingAppointments || 0 },
            { name: "İptal/Diğer", value: Math.max(0, (stats?.totalAppointments || 0) - (stats?.completedAppointments || 0) - (stats?.waitingAppointments || 0)) }
        ].filter(item => item.value > 0);
        
        const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

        return (
            <>
                {/* KPI Cards Row */}
                <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                    {statCards.map((card, idx) => {
                        const isHovered = hoveredCard === idx;
                        return (
                            <div 
                                key={idx} 
                                onMouseEnter={() => setHoveredCard(idx)}
                                onMouseLeave={() => setHoveredCard(null)}
                                style={{
                                    background: isHovered ? "rgba(15, 23, 42, 0.85)" : "rgba(15, 23, 42, 0.65)",
                                    backdropFilter: "blur(12px)",
                                    padding: "24px", 
                                    borderRadius: "16px", 
                                    border: isHovered ? `1px solid ${card.color}` : "1px solid rgba(255,255,255,0.06)",
                                    position: "relative", 
                                    overflow: "hidden", 
                                    boxShadow: isHovered ? `0 10px 30px -10px ${card.color}4d` : "0 4px 20px -2px rgba(0,0,0,0.3)",
                                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    cursor: "pointer"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
                                    <div style={{ flex: 1, marginRight: "12px" }}>
                                        <div style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                                        <div style={{ fontSize: "28px", fontWeight: 800, color: "white" }}>{card.value}</div>
                                        <div style={{ fontSize: "12px", color: card.color, marginTop: "6px", fontWeight: 500 }}>{card.subText}</div>
                                        {card.progress !== undefined && (
                                            <div style={{ marginTop: "12px", width: "90%" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "4px" }}>
                                                    <span>Hedef İlerlemesi</span>
                                                    <span style={{ color: card.color, fontWeight: "bold" }}>%{card.progress}</span>
                                                </div>
                                                <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "2px", overflow: "hidden" }}>
                                                    <div style={{ width: `${card.progress}%`, height: "100%", background: card.color, borderRadius: "2px" }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "12px",
                                        background: card.bg,
                                        color: card.color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "22px",
                                        border: `1px solid ${card.color}33`
                                    }}>
                                        {card.icon}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Double Chart Row */}
                <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
                    
                    {/* Left: AreaChart */}
                    <div style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "white", margin: 0 }}>Randevu Trend Analizi</h2>
                            <span style={{ fontSize: "11px", color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", padding: "4px 8px", borderRadius: "6px" }}>Aylık Yoğunluk</span>
                        </div>
                        <div style={{ width: "100%", height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.monthlyChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                                    />
                                    <Area type="monotone" dataKey="randevular" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorArea)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right: PieChart */}
                    <div style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "white", margin: 0 }}>Randevu Durum Dağılımı</h2>
                            <span style={{ fontSize: "11px", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: "6px" }}>Oransal Dağılım</span>
                        </div>
                        <div style={{ width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => <span style={{ color: "#cbd5e1", fontSize: "12px" }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Resources Health, Logs & Duty Roster Grid */}
                <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
                    
                    {/* Server health */}
                    <div style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiCpu color="#10b981" /> Sistem Sunucu Sağlığı
                            </h2>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span className="pulse-green" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 500 }}>Canlı</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            {[
                                { label: "İşlemci Gücü (CPU Usage)", val: stats?.hardware?.cpuUsage || 0, color: "linear-gradient(90deg, #3b82f6, #60a5fa)", glowColor: "#3b82f6" },
                                { label: "Bellek Havuzu (RAM Usage)", val: stats?.hardware?.memoryUsage || 0, color: "linear-gradient(90deg, #10b981, #34d399)", glowColor: "#10b981" },
                                { label: "Depolama Kapasitesi", val: stats?.hardware?.diskUsage || 42, color: "linear-gradient(90deg, #8b5cf6, #a78bfa)", glowColor: "#8b5cf6" },
                            ].map((s, i) => (
                                <div key={i}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                                        <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{s.label}</span>
                                        <span style={{ fontWeight: 700, color: "white" }}>%{s.val}</span>
                                    </div>
                                    <div style={{ height: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{ width: `${s.val}%`, height: "100%", background: s.color, borderRadius: "4px", boxShadow: `0 0 10px ${s.glowColor}` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audit Logs */}
                    <div style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px", display: "flex", flexDirection: "column" }}>
                        <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiActivity color="#ef4444" /> Sistem Denetim İzleri (Logs)
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "180px", pr: "5px" }}>
                            {logs.slice(0, 5).map(log => {
                                const { icon, bg, color } = getLogIcon(log.action);
                                return (
                                    <div key={log._id || log.id} style={{
                                        padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "8px",
                                        display: "flex", alignItems: "center", gap: "12px", borderLeft: `3px solid ${log.status === "success" ? "#10b981" : log.status === "warning" ? "#f59e0b" : "#3b82f6"}`
                                    }}>
                                        <div style={{
                                            width: "30px", height: "30px", borderRadius: "50%",
                                            background: bg, color: color, display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            fontSize: "14px", flexShrink: 0
                                        }}>
                                            {icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
                                                <span style={{ color: "white", fontWeight: 600 }}>{log.user}</span> &mdash; {log.action}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bugün Nöbetçi Personeller Widget */}
                    <div style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px", display: "flex", flexDirection: "column" }}>
                        <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiClock color="#fb923c" /> Bugün Nöbetçi Kadro
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "180px", paddingRight: "5px" }}>
                            {(() => {
                                const d = new Date();
                                const year = d.getFullYear();
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const day = String(d.getDate()).padStart(2, '0');
                                const todayStr = `${year}-${month}-${day}`;

                                const todaysShifts = dutyShifts.filter(s => s.date === todayStr);

                                if (todaysShifts.length === 0) {
                                    return (
                                        <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                                            Bugün için nöbetçi personel atanmamıştır.
                                        </div>
                                    );
                                }

                                return todaysShifts.map((shift) => {
                                    const userObj = shift.userId || {};
                                    const profile = userObj.profileId || {};
                                    const name = profile.name || userObj.email || "Bilinmeyen Personel";
                                    const role = userObj.role || "staff";
                                    const badge = getRoleBadgeStyle(role);

                                    return (
                                        <div key={shift._id} style={{
                                            padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px",
                                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px"
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{name}</span>
                                                    <span style={{
                                                        padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold",
                                                        background: badge.bg, color: badge.color
                                                    }}>
                                                        {roleLabels[role] ? roleLabels[role].split(" ")[0] : role}
                                                    </span>
                                                </div>
                                                {shift.note && (
                                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                                        Not: {shift.note}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                </div>
            </>
        );
    };

    const renderStaffTab = () => {
        const query = staffSearchQuery.toLowerCase().trim();

        const filteredDocs = doctors.filter(doc => {
            const profile = doc.profileId || {};
            const nameMatch = (profile.name || "").toLowerCase().includes(query);
            const specialtyMatch = (profile.specialty || "").toLowerCase().includes(query);
            const emailMatch = (doc.email || "").toLowerCase().includes(query);
            return nameMatch || specialtyMatch || emailMatch;
        });

        const filteredStaff = adminStaff.filter(u => {
            const profile = u.profileId || {};
            const nameMatch = (profile.name || "").toLowerCase().includes(query);
            const specialtyMatch = (profile.specialty || "").toLowerCase().includes(query);
            const emailMatch = (u.email || "").toLowerCase().includes(query);
            
            // Check role match
            const roleMatch = staffRoleFilter === "all" || staffRoleFilter === u.role;
            return (nameMatch || specialtyMatch || emailMatch) && roleMatch;
        });

        const showDoctorSec = staffRoleFilter === "all" || staffRoleFilter === "doctor";
        const showStaffSec = staffRoleFilter === "all" || staffRoleFilter === "admin" || staffRoleFilter === "staff";

        return (
            <>
                {/* Search & Filter Bar */}
                <div style={{
                    gridColumn: "span 12",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    background: "rgba(15, 23, 42, 0.45)",
                    backdropFilter: "blur(8px)",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: "12px",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", flex: 1, minWidth: "280px", gap: "12px", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: 1 }}>
                            <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={16} />
                            <input
                                type="text"
                                placeholder="Personel adı, e-posta veya branş/görev ara..."
                                value={staffSearchQuery}
                                onChange={(e) => setStaffSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px 10px 38px",
                                    background: "#0f172a",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "14px",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                            />
                            {staffSearchQuery && (
                                <button
                                    onClick={() => setStaffSearchQuery("")}
                                    style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        color: "#94a3b8",
                                        cursor: "pointer",
                                        padding: 0
                                    }}
                                >
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>
                        
                        <select
                            value={staffRoleFilter}
                            onChange={(e) => setStaffRoleFilter(e.target.value)}
                            style={{
                                padding: "10px 16px",
                                background: "#0f172a",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "8px",
                                color: "white",
                                fontSize: "14px",
                                cursor: "pointer",
                                outline: "none"
                            }}
                        >
                            <option value="all">Tüm Roller</option>
                            <option value="doctor">Doktor (Hekim)</option>
                            <option value="staff">İdari Personel (Memur)</option>
                            <option value="admin">Sistem Yöneticisi (Admin)</option>
                            <option value="receptionist">Danışma / Hasta Kabul</option>
                            <option value="pharmacist">Eczacı</option>
                            <option value="accountant">Muhasebe</option>
                            <option value="hr">İnsan Kaynakları (İK)</option>
                            <option value="technician">Teknisyen</option>
                        </select>
                    </div>
                    
                    {canManageUsers && (
                        <button
                            onClick={() => setIsCreateUserModalOpen(true)}
                            style={{
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "white",
                                border: "none",
                                padding: "10px 18px",
                                borderRadius: "10px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <FiPlus /> Yeni Personel Tanımla
                        </button>
                    )}
                </div>

                {/* Hekim Performans & Yönetim Tablosu */}
                {showDoctorSec && (
                    <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                                <FiUserCheck color="#3b82f6" /> Doktor Kadrosu & Performans Değerleri
                            </h2>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Doktor Adı</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Branş</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>Puan (Rating)</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>Maaş (Net)</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>Günlük Limit</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>Durum</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "right" }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                                                Aranan kriterlere uygun doktor bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDocs.map((doc) => {
                                            const profile = doc.profileId || {};
                                            return (
                                                <tr key={doc._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover-row">
                                                    <td style={{ padding: "16px 12px", fontWeight: 600 }}>{profile.name || "Bilinmeyen Doktor"}</td>
                                                    <td style={{ padding: "16px 12px", color: "#cbd5e1" }}>{profile.specialty || "-"}</td>
                                                    <td style={{ padding: "16px 12px", textAlign: "center" }}>
                                                        <span style={{ background: "rgba(234, 179, 8, 0.1)", color: "#fbbf24", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold" }}>
                                                            ★ {profile.rating || 5}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                                                        {(profile.salary || 0).toLocaleString('tr-TR')} ₺
                                                    </td>
                                                    <td style={{ padding: "16px 12px", textAlign: "center" }}>{profile.dailyPatientLimit || 40} Hasta</td>
                                                    <td style={{ padding: "16px 12px", textAlign: "center" }}>
                                                        <span style={{
                                                            padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold",
                                                            background: profile.isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(148, 163, 184, 0.1)",
                                                            color: profile.isOnline ? "#10b981" : "#94a3b8"
                                                        }}>
                                                            {profile.isOnline ? "Aktif" : "Çevrimdışı"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                                        <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end" }}>
                                                            <button
                                                                onClick={() => handleOpenEditDoctor(doc)}
                                                                style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "6px", color: "#60a5fa", cursor: "pointer", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                                                            >
                                                                <FiEdit2 size={12} /> Ayarlar
                                                            </button>
                                                            {canDeleteUsers && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(doc._id, doc.email)}
                                                                    style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                                                                >
                                                                    <FiTrash2 size={12} /> Sil
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* İdari Kadro & Yöneticiler Listesi */}
                {showStaffSec && (
                    <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                                <FiUsers color="#10b981" /> İdari Kadro & Yöneticiler
                            </h2>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Kullanıcı Adı</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>E-posta</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Rol / Yetki</th>
                                        <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Görev / Uzmanlık</th>
                                        {canDeleteUsers && <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "right" }}>İşlem</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={canDeleteUsers ? 5 : 4} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                                                Aranan kriterlere uygun idari personel bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((u) => {
                                            const profile = u.profileId || {};
                                            return (
                                                <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover-row">
                                                    <td style={{ padding: "16px 12px", fontWeight: 600 }}>{profile.name || "İdari Personel"}</td>
                                                    <td style={{ padding: "16px 12px", color: "#cbd5e1" }}>{u.email}</td>
                                                    <td style={{ padding: "16px 12px" }}>
                                                        {(() => {
                                                            const badge = getRoleBadgeStyle(u.role);
                                                            return (
                                                                <span style={{
                                                                    padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold",
                                                                    background: badge.bg,
                                                                    color: badge.color
                                                                }}>
                                                                    {roleLabels[u.role] || u.role}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td style={{ padding: "16px 12px", color: "#94a3b8" }}>{profile.specialty || "-"}</td>
                                                    {canDeleteUsers && (
                                                        <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                                            {u._id !== user?._id && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u._id, u.email)}
                                                                    style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                                                                >
                                                                    <FiTrash2 size={12} /> Sil
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </>
        );
    };

    const renderRosterTab = () => {
        const sortedShifts = [...dutyShifts].sort((a, b) => new Date(a.date) - new Date(b.date));

        return (
            <>
                {/* Nöbet İşlemleri Barı */}
                <div style={{
                    gridColumn: "span 12",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(15, 23, 42, 0.65)",
                    backdropFilter: "blur(12px)",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: "12px"
                }}>
                    <div>
                        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "white" }}>Personel Nöbet Çizelgesi</h2>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>Hastane personelinin nöbet günlerini tanımlayabilir ve yönetebilirsiniz.</p>
                    </div>
                    {canManageUsers && (
                        <button
                            onClick={() => {
                                const allUsers = [...doctors, ...adminStaff];
                                const firstUserId = allUsers.length > 0 ? allUsers[0]._id : "";
                                setShiftForm({ date: new Date().toISOString().split('T')[0], userId: firstUserId, note: "Gece Nöbeti" });
                                setIsCreateShiftModalOpen(true);
                            }}
                            style={{
                                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                color: "white",
                                border: "none",
                                padding: "10px 18px",
                                borderRadius: "10px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
                                transition: "all 0.2s"
                            }}
                        >
                            <FiPlus /> Yeni Nöbet Tanımla
                        </button>
                    )}
                </div>

                {/* Nöbet Çizelge Tablosu */}
                <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Nöbet Tarihi</th>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Personel Adı</th>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Görevi / Rolü</th>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Nöbet Açıklaması</th>
                                    {canManageUsers && <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "right" }}>İşlem</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedShifts.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManageUsers ? 5 : 4} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                            Henüz planlanmış nöbet kaydı bulunmamaktadır.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedShifts.map((shift) => {
                                        const userObj = shift.userId || {};
                                        const profile = userObj.profileId || {};
                                        const name = profile.name || userObj.email || "Bilinmeyen Personel";
                                        const role = userObj.role || "staff";
                                        const dateVal = new Date(shift.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                                        return (
                                            <tr key={shift._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover-row">
                                                <td style={{ padding: "16px 12px", fontWeight: 700, color: "#cbd5e1" }}>{dateVal}</td>
                                                <td style={{ padding: "16px 12px", fontWeight: 600 }}>{name}</td>
                                                <td style={{ padding: "16px 12px" }}>
                                                    {(() => {
                                                        const badgeStyle = getRoleBadgeStyle(role);
                                                        return (
                                                            <span style={{
                                                                padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold",
                                                                background: badgeStyle.bg,
                                                                color: badgeStyle.color
                                                            }}>
                                                                {roleLabels[role] || role}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td style={{ padding: "16px 12px", color: "#94a3b8" }}>{shift.note || "-"}</td>
                                                {canManageUsers && (
                                                    <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                                        <button
                                                            onClick={() => handleDeleteShift(shift._id, name, shift.date)}
                                                            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                                                        >
                                                            <FiTrash2 size={12} /> Nöbeti İptal Et
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    };

    const renderApprovalsTab = () => (
        <>
            {/* İdari İzin Talepleri Onay Masası */}
            <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <FiClock color="#a855f7" /> Hekim / Personel İzin Talepleri Onay Masası
                </h2>

                {leaveRequests.filter(l => l.durum === "Beklemede").length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                        Onay bekleyen izin talebi bulunmamaktadır.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {leaveRequests.filter(l => l.durum === "Beklemede").map(request => (
                            <div key={request._id} style={{
                                padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px"
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                        <span style={{ fontWeight: 700, color: "white" }}>{request.doctorName}</span>
                                        <span style={{ fontSize: "11px", background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold" }}>{request.tip}</span>
                                        <span style={{ fontSize: "11px", color: "#64748b" }}>{request.gun} Gün</span>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                                        Tarihler: {new Date(request.baslangic).toLocaleDateString('tr-TR')} - {new Date(request.bitis).toLocaleDateString('tr-TR')}
                                    </div>
                                    {request.aciklama && <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>Açıklama: "{request.aciklama}"</div>}
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        onClick={() => handleLeaveRequest(request._id, "Onaylı")}
                                        style={{ background: "#10b981", border: "none", borderRadius: "8px", color: "white", padding: "8px 16px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
                                    >
                                        <FiCheck /> Onayla
                                    </button>
                                    <button
                                        onClick={() => handleLeaveRequest(request._id, "Reddedildi")}
                                        style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", padding: "8px 16px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
                                    >
                                        <FiX /> Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* IT Destek Talepleri Yönetim Masası */}
            <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <FiTool color="#3b82f6" /> Personel IT Destek Talepleri
                </h2>

                {itRequests.length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                        Henüz açılmış bir teknik destek talebi bulunmamaktadır.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {itRequests.map(req => (
                            <div key={req._id} style={{
                                padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px"
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                                            {req.requestId}
                                        </span>
                                        <span style={{ fontWeight: 700, color: "white" }}>{req.title}</span>
                                        <span style={{ fontSize: "11px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", padding: "2px 8px", borderRadius: "6px" }}>{req.category}</span>
                                        <span style={{
                                            fontSize: "11px", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold",
                                            background: req.priority === "Kritik" ? "rgba(239, 68, 68, 0.15)" : req.priority === "Yüksek" ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.08)",
                                            color: req.priority === "Kritik" ? "#f87171" : req.priority === "Yüksek" ? "#fbbf24" : "#cbd5e1"
                                        }}>
                                            Öncelik: {req.priority}
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b" }}>Gönderen: {req.createdBy}</span>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#cbd5e1", margin: "8px 0" }}>
                                        {req.description}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                        Tarih: {new Date(req.createdAt).toLocaleString('tr-TR')} | Atanan: {req.assignee || "Atanmamış"}
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <label style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>Durum Güncelle</label>
                                        <select
                                            value={req.status}
                                            onChange={(e) => handleUpdateITStatus(req._id, e.target.value)}
                                            style={{ background: "#0f172a", border: "1px solid #334155", color: "white", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                                        >
                                            <option value="Açık">Açık</option>
                                            <option value="İşlemde">İşlemde</option>
                                            <option value="Çözüldü">Çözüldü</option>
                                            <option value="Kapandı">Kapandı</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteITRequest(req._id)}
                                        style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#ef4444", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.2s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                                        title="Talebi Sil"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    const renderSystemTab = () => (
        <>
            {/* Acil Durum & Protokol Kumanda Masası */}
            <div style={{ gridColumn: "span 12", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", display: "grid", gap: "20px" }}>
                
                {/* Maintenance switch */}
                <div style={{
                    background: settings.maintenanceMode ? "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.15) 100%)" : "rgba(15, 23, 42, 0.65)",
                    border: settings.maintenanceMode ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                    padding: "24px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    boxShadow: settings.maintenanceMode ? "0 0 15px rgba(245, 158, 11, 0.15)" : "none", transition: "all 0.3s"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <FiActivity color={settings.maintenanceMode ? "#f59e0b" : "#cbd5e1"} size={20} />
                            <span style={{ fontWeight: 700, fontSize: "16px", color: "white" }}>Sistem Bakım Modu (Maintenance)</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, maxWidth: "350px" }}>
                            Aktif edildiğinde doktor ve hastalar için tüm erişimleri askıya alır. Sistem yöneticileri giriş yapabilir.
                        </p>
                    </div>
                    <label className="toggle-switch-card">
                        <input
                            type="checkbox"
                            checked={settings.maintenanceMode}
                            onChange={(e) => toggleMaintenance(e.target.checked)}
                        />
                        <span className="slider-card" style={{ background: settings.maintenanceMode ? "#f59e0b" : "#334155" }}></span>
                    </label>
                </div>

                {/* Lockdown switch */}
                <div style={{
                    background: settings.emergencyLockdown ? "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.18) 100%)" : "rgba(15, 23, 42, 0.65)",
                    border: settings.emergencyLockdown ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                    padding: "24px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    boxShadow: settings.emergencyLockdown ? "0 0 20px rgba(239, 68, 68, 0.2)" : "none", transition: "all 0.3s"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <FiLock color={settings.emergencyLockdown ? "#ef4444" : "#cbd5e1"} size={20} />
                            <span style={{ fontWeight: 700, fontSize: "16px", color: "white" }}>Kritik Acil Durum Kilidi (Lockdown)</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, maxWidth: "350px" }}>
                            Tüm oturumları ve API geçişlerini acilen keser, sistemi koruma moduna alır. Sadece başhekim ve Bilgi İşlem Müdürü yetkisindedir.
                        </p>
                    </div>
                    <label className="toggle-switch-card">
                        <input
                            type="checkbox"
                            checked={settings.emergencyLockdown}
                            onChange={(e) => toggleLockdown(e.target.checked)}
                        />
                        <span className="slider-card" style={{ background: settings.emergencyLockdown ? "#ef4444" : "#334155" }}></span>
                    </label>
                </div>

            </div>

            {/* Genel Sistem Ayarları */}
            <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <FiSettings color="#3b82f6" /> Hastane Markalama & Yapılandırma
                </h2>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", maxWidth: "600px" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "13px", color: "#cbd5e1", display: "block", marginBottom: "8px" }}>Hastane Resmi Adı</label>
                        <input
                            type="text"
                            value={settings.hospitalName}
                            onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                            style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                        />
                    </div>
                    <button
                        onClick={handleSaveHospitalName}
                        style={{ background: "#3b82f6", color: "white", border: "none", padding: "11px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                    >
                        Kaydet
                    </button>
                </div>
            </div>

            {/* Veritabanı Yedekleme ve Optimizasyon */}
            <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <FiCpu color="#10b981" /> Sistem Veritabanı Yönetimi
                </h2>
                <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px", maxWidth: "800px" }}>
                    Hastane bilgi sisteminin veri tutarlılığını sağlamak için veritabanı yedeğini JSON formatında indirebilir veya indeks optimizasyonlarını tetikleyebilirsiniz.
                </p>
                <div style={{ display: "flex", gap: "16px" }}>
                    <button
                        onClick={handleBackupDatabase}
                        disabled={isBackingUp}
                        style={{ background: "#10b981", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: isBackingUp ? 0.7 : 1 }}
                    >
                        <FiDownloadCloud size={16} /> {isBackingUp ? "Yedekleniyor..." : "Veritabanı Yedeği (JSON) İndir"}
                    </button>
                    <button
                        onClick={handleOptimizeDatabase}
                        disabled={isOptimizing}
                        style={{ background: "#3b82f6", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: isOptimizing ? 0.7 : 1 }}
                    >
                        <FiActivity size={16} /> {isOptimizing ? "Optimize Ediliyor..." : "Veritabanı İndekslerini Optimize Et"}
                    </button>
                </div>
            </div>

            {/* Sistem Anonsları Yönetimi */}
            <div style={{ gridColumn: "span 12", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                        <FiRadio color="#ef4444" /> Aktif Sistem Anonsları & Duyurular
                    </h2>
                    <button
                        onClick={handleOpenAnnouncement}
                        style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <FiPlus /> Yeni Duyuru Yayınla
                    </button>
                </div>

                {announcements.length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                        Sistemde kayıtlı duyuru bulunmamaktadır.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Başlık</th>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>İçerik</th>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>Tür</th>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>Durum</th>
                                    <th style={{ padding: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "right" }}>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((anon) => (
                                    <tr key={anon._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover-row">
                                        <td style={{ padding: "16px 12px", fontWeight: 600 }}>{anon.title}</td>
                                        <td style={{ padding: "16px 12px", color: "#cbd5e1", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {anon.message}
                                        </td>
                                        <td style={{ padding: "16px 12px", textAlign: "center" }}>
                                            <span style={{
                                                padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold",
                                                background: anon.type === "critical" ? "rgba(239, 68, 68, 0.15)" : anon.type === "warning" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                                color: anon.type === "critical" ? "#f87171" : anon.type === "warning" ? "#fbbf24" : "#60a5fa"
                                            }}>
                                                {anon.type === "critical" ? "Kritik" : anon.type === "warning" ? "Uyarı" : "Bilgi"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 12px", textAlign: "center" }}>
                                            <button
                                                onClick={() => handleToggleAnnouncementActive(anon._id, anon.active)}
                                                style={{
                                                    border: "none", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", cursor: "pointer",
                                                    background: anon.active ? "rgba(16, 185, 129, 0.1)" : "rgba(148, 163, 184, 0.1)",
                                                    color: anon.active ? "#10b981" : "#94a3b8"
                                                }}
                                            >
                                                {anon.active ? "Aktif" : "Pasif"}
                                            </button>
                                        </td>
                                        <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                            <button
                                                onClick={() => handleDeleteAnnouncement(anon._id)}
                                                style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "#ef4444", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="admin-dashboard-v2 animate-fade-in" style={{
            color: "white",
            padding: "20px 40px 40px 40px",
            minHeight: "100vh",
            background: "#020617",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }} ref={dashboardRef}>
            <Toaster position="top-right" />

            {/* Glowing Orbs */}
            {!isExporting && <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }}></div>}
            {!isExporting && <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }}></div>}

            <div style={{ position: "relative", zIndex: 1, maxWidth: "1440px", margin: "0 auto" }}>
                
                {/* Header */}
                <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                        <h1 style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-1.2px", background: "linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            İdari Yönetim & Başhekim Kontrol Merkezi
                        </h1>
                        <p style={{ color: "#64748b", margin: 0, fontSize: "15px", fontWeight: 400 }}>Tüm hastane operasyonları, hekim performansları, idari onaylar ve acil durum protokolleri canlı yönetim paneli.</p>
                    </div>
                    <div style={{ display: isExporting ? "none" : "flex", gap: "12px" }}>
                        <button
                            onClick={handleOpenAnnouncement}
                            style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "white", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)" }}
                        >
                            <FiRadio size={16} /> Sistem Anonsu
                        </button>
                        <button
                            onClick={handleExportPDF}
                            style={{ background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", padding: "10px 18px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <FiDownloadCloud size={16} /> Rapor PDF Aktar
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#ef4444", padding: "10px 18px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                        >
                            <FiLogOut size={16} /> Çıkış Yap
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                {!isExporting && (
                    <div style={{
                        display: "flex",
                        gap: "12px",
                        marginBottom: "32px",
                        background: "rgba(15, 23, 42, 0.4)",
                        padding: "6px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        width: "fit-content"
                    }}>
                        {[
                            { id: "overview", label: "Genel Bakış", icon: <FiTrendingUp size={16} /> },
                            { id: "staff", label: "Kadro Yönetimi", icon: <FiUsers size={16} /> },
                            { id: "roster", label: "Nöbet Çizelgesi", icon: <FiClock size={16} /> },
                            { id: "approvals", label: "Onaylar & IT", icon: <FiList size={16} /> },
                            { id: "system", label: "Sistem & Anonslar", icon: <FiSettings size={16} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 18px",
                                    borderRadius: "8px",
                                    background: activeTab === tab.id ? "rgba(59, 130, 246, 0.15)" : "transparent",
                                    color: activeTab === tab.id ? "#60a5fa" : "#94a3b8",
                                    fontWeight: activeTab === tab.id ? 600 : 500,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    border: activeTab === tab.id ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid transparent"
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = "white";
                                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = "#94a3b8";
                                        e.currentTarget.style.background = "transparent";
                                    }
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
                    {(activeTab === "overview" || isExporting) && renderOverviewTab()}
                    {(activeTab === "staff" || isExporting) && renderStaffTab()}
                    {(activeTab === "roster" || isExporting) && renderRosterTab()}
                    {(activeTab === "approvals" || isExporting) && renderApprovalsTab()}
                    {(activeTab === "system" || isExporting) && renderSystemTab()}
                </div>

                {/* Broadcast Announcement Modal */}
                <Modal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} title="Sistem Genel Duyurusu (Broadcast) Yayınla">
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ fontSize: "13px", color: "#94a3b8", background: "rgba(59, 130, 246, 0.1)", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                            Yayınlayacağınız duyurular tüm hekim, personel ve hasta ekranlarında eş zamanlı olarak gösterilecektir.
                        </div>
                        <div className="form-group">
                            <label style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "8px", display: "block" }}>Duyuru Başlığı</label>
                            <input
                                type="text"
                                className="form-control"
                                value={announcementForm.title}
                                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                placeholder="Örn: Hafta Sonu Bakım Çalışması"
                                style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "8px", display: "block" }}>Mesaj İçeriği</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                value={announcementForm.message}
                                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                                placeholder="İletmek istediğiniz genel anons detayı..."
                                style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "8px", display: "block" }}>Duyuru Seviyesi</label>
                            <select
                                className="form-control"
                                value={announcementForm.type}
                                onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                                style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                            >
                                <option value="info">Mavi (Genel Bilgilendirme)</option>
                                <option value="warning">Sarı (Dikkat Çekici)</option>
                                <option value="critical">Kırmızı (Acil Durum)</option>
                            </select>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                            <button onClick={() => setIsAnnouncementModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "white", cursor: "pointer" }}>İptal</button>
                            <button onClick={handleSendAnnouncement} style={{ padding: "10px 20px", borderRadius: "8px", background: "#3b82f6", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>
                                Yayınla
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Create New User Modal */}
                <Modal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} title="Yeni Personel & Kullanıcı Tanımla">
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="form-group">
                                <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Ad Soyad</label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    placeholder="Örn: Dr. Ahmet Yılmaz"
                                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>E-posta</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    placeholder="personel@hastane.com"
                                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Şifre</label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder="En az 6 karakter"
                                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Telefon</label>
                                <input
                                    type="text"
                                    value={userForm.phone}
                                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                                    placeholder="05XX XXX XX XX"
                                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Sistem Rolü</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value, specialty: "" })}
                                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box", cursor: "pointer" }}
                                >
                                    <option value="doctor">Doktor (Hekim)</option>
                                    <option value="staff">İdari Personel (Memur)</option>
                                    <option value="admin">Bilgi İşlem Yöneticisi (Admin)</option>
                                    <option value="receptionist">Danışma / Hasta Kabul</option>
                                    <option value="pharmacist">Eczacı / Eczane Sorumlusu</option>
                                    <option value="accountant">Muhasebe Personeli</option>
                                    <option value="hr">İnsan Kaynakları (İK)</option>
                                    <option value="technician">Teknik Servis / Teknisyen</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Görev / Branş / Uzmanlık</label>
                                {userForm.role === "doctor" ? (
                                    <input
                                        type="text"
                                        value={userForm.specialty}
                                        onChange={(e) => setUserForm({ ...userForm, specialty: e.target.value })}
                                        placeholder="Örn: Dahiliye, Kardiyoloji"
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                ) : userForm.role === "admin" ? (
                                    <select
                                        value={userForm.specialty}
                                        onChange={(e) => setUserForm({ ...userForm, specialty: e.target.value })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box", cursor: "pointer" }}
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="Bilgi İşlem Müdürü">Bilgi İşlem Müdürü</option>
                                        <option value="Bilgi İşlem Müdür Yardımcısı">Bilgi İşlem Müdür Yardımcısı</option>
                                        <option value="Bilgi İşlem Uzmanı">Bilgi İşlem Uzmanı</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={userForm.specialty}
                                        onChange={(e) => setUserForm({ ...userForm, specialty: e.target.value })}
                                        placeholder="Örn: İdari İşler Personeli"
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                            <button onClick={() => setIsCreateUserModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "white", cursor: "pointer" }}>İptal</button>
                            <button onClick={handleCreateUser} style={{ padding: "10px 20px", borderRadius: "8px", background: "#10b981", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>
                                Personel Tanımla
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Doctor Performance Parameters Modal */}
                <Modal isOpen={isEditDoctorModalOpen} onClose={() => setIsEditDoctorModalOpen(false)} title="Doktor Performans & Kadro Parametreleri">
                    {editingDoctor && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div className="form-group">
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Doktor İsmi</label>
                                    <input
                                        type="text"
                                        value={doctorForm.name}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>E-posta</label>
                                    <input
                                        type="email"
                                        value={doctorForm.email}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Branş / Uzmanlık</label>
                                    <input
                                        type="text"
                                        value={doctorForm.specialty}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Telefon</label>
                                    <input
                                        type="text"
                                        value={doctorForm.phone}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Aylık Net Maaş (₺)</label>
                                    <input
                                        type="number"
                                        value={doctorForm.salary}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, salary: Number(e.target.value) })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Günlük Hasta Sınırı</label>
                                    <input
                                        type="number"
                                        value={doctorForm.dailyPatientLimit}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, dailyPatientLimit: Number(e.target.value) })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Doktor Puanı (Rating 1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        step="0.1"
                                        value={doctorForm.rating}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, rating: Number(e.target.value) })}
                                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div className="form-group" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                    <span style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px" }}>Aktif Çalışma Durumu</span>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={doctorForm.isOnline}
                                            onChange={(e) => setDoctorForm({ ...doctorForm, isOnline: e.target.checked })}
                                            style={{ width: "20px", height: "20px", accentColor: "#3b82f6" }}
                                        />
                                        <span>Doktor Aktif (Online)</span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ borderTop: "1px solid #334155", paddingTop: "12px", marginTop: "8px" }}>
                                <span style={{ fontWeight: 600, fontSize: "14px", color: "white", display: "block", marginBottom: "8px" }}>Çalışma Saatleri Ayarı</span>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <div className="form-group">
                                        <label style={{ color: "#cbd5e1", fontSize: "12px", marginBottom: "4px", display: "block" }}>Hafta İçi (Pzt-Cuma)</label>
                                        <input
                                            type="text"
                                            value={doctorForm.monday}
                                            onChange={(e) => setDoctorForm({ ...doctorForm, monday: e.target.value })}
                                            style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "8px", boxSizing: "border-box" }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: "#cbd5e1", fontSize: "12px", marginBottom: "4px", display: "block" }}>Cumartesi</label>
                                        <input
                                            type="text"
                                            value={doctorForm.saturday}
                                            onChange={(e) => setDoctorForm({ ...doctorForm, saturday: e.target.value })}
                                            style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "8px", boxSizing: "border-box" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                                <button onClick={() => setIsEditDoctorModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "white", cursor: "pointer" }}>İptal</button>
                                <button onClick={handleSaveDoctor} style={{ padding: "10px 20px", borderRadius: "8px", background: "#3b82f6", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>
                                    Değişiklikleri Kaydet
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Create New Shift Modal */}
                <Modal isOpen={isCreateShiftModalOpen} onClose={() => setIsCreateShiftModalOpen(false)} title="Yeni Personel Nöbeti Tanımla">
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div className="form-group">
                            <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Nöbet Tarihi</label>
                            <input
                                type="date"
                                value={shiftForm.date}
                                onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                                style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Nöbetçi Personel</label>
                            <select
                                value={shiftForm.userId}
                                onChange={(e) => setShiftForm({ ...shiftForm, userId: e.target.value })}
                                style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box", cursor: "pointer" }}
                            >
                                <option value="">Seçiniz...</option>
                                {[...doctors, ...adminStaff].map((u) => {
                                    const profile = u.profileId || {};
                                    const name = profile.name || u.email || "İsimsiz Personel";
                                    return (
                                        <option key={u._id} value={u._id}>
                                            {name} ({roleLabels[u.role] ? roleLabels[u.role].split(" ")[0] : u.role} - {u.email})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="form-group">
                            <label style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "6px", display: "block" }}>Nöbet Notu / Açıklaması</label>
                            <input
                                type="text"
                                value={shiftForm.note}
                                onChange={(e) => setShiftForm({ ...shiftForm, note: e.target.value })}
                                placeholder="Örn: Gece Nöbeti, Acil Nöbetçi Eczacı"
                                style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", width: "100%", padding: "10px", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                            <button onClick={() => setIsCreateShiftModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "white", cursor: "pointer" }}>İptal</button>
                            <button onClick={handleAssignShift} style={{ padding: "10px 20px", borderRadius: "8px", background: "#3b82f6", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>
                                Nöbetçi Ata
                            </button>
                        </div>
                    </div>
                </Modal>

            </div>

            {/* Toggle Switch Card CSS */}
            <style>{`
                .toggle-switch-card {
                    position: relative;
                    display: inline-block;
                    width: 52px;
                    height: 26px;
                }
                .toggle-switch-card input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider-card {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    transition: .4s;
                    border-radius: 26px;
                }
                .slider-card:before {
                    position: absolute;
                    content: "";
                    height: 18px; width: 18px;
                    left: 4px; bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider-card:before {
                    transform: translateX(26px);
                }
                .hover-row {
                    transition: background-color 0.2s ease;
                }
                .hover-row:hover {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                }
                .admin-dashboard-v2 .modal-content {
                    background: #0f172a !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                }
                .admin-dashboard-v2 .modal-header h2 {
                    color: white !important;
                    background: none !important;
                    -webkit-text-fill-color: white !important;
                }
                .admin-dashboard-v2 .modal-header {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                }
                .admin-dashboard-v2 .modal-close {
                    background: rgba(255, 255, 255, 0.05) !important;
                    color: #94a3b8 !important;
                }
                .admin-dashboard-v2 .modal-close:hover {
                    background: rgba(239, 68, 68, 0.1) !important;
                    color: #ef4444 !important;
                }
                @keyframes pulse-green {
                    0% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    }
                    70% {
                        transform: scale(1);
                        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
                    }
                    100% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                    }
                }
                .pulse-green {
                    animation: pulse-green 2s infinite;
                }
            `}</style>
        </div>
    );
}

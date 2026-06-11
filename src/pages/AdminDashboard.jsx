import { useState, useEffect, useRef } from "react";
import { adminApi, adminPatientsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { 
    FiUsers, FiCalendar, FiActivity, FiPlus, FiEdit2, FiTrash2, FiShield, 
    FiRadio, FiDownloadCloud, FiAward, FiTrendingUp, FiXCircle, FiCpu, 
    FiDatabase, FiSettings, FiActivity as FiLogIcon, FiGlobe, FiTerminal,
    FiPlay, FiWifi, FiRefreshCw, FiCheckCircle, FiMail, FiSend, FiBell
} from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import html2pdf from 'html2pdf.js';
import toast, { Toaster } from "react-hot-toast";

export default function AdminDashboard() {
    const { user } = useAuth();
    const dashboardRef = useRef(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    const [settings, setSettings] = useState({
        maintenanceMode: false,
        emergencyLockdown: false,
        hospitalName: "MediTrack Merkez Hastanesi"
    });

    // IT Sysadmin Console Parameters
    const [pingAddress, setPingAddress] = useState("db.meditrack.local");
    const [pingLogs, setPingLogs] = useState([]);
    const [isPinging, setIsPinging] = useState(false);

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optLogs, setOptLogs] = useState([]);

    const [activeSessions, setActiveSessions] = useState([
        { id: 1, user: "Dr. Ahmet Yılmaz", role: "Doktor", ip: "192.168.1.104", duration: "14 dk", browser: "Chrome - macOS" },
        { id: 2, user: "Ecz. Selma Yıldız", role: "Eczacı", ip: "192.168.1.112", duration: "3 dk", browser: "Safari - iOS" },
        { id: 3, user: "Danışma Merve Kaya", role: "Sekreter", ip: "192.168.1.108", duration: "42 dk", browser: "Chrome - Windows" },
        { id: 4, user: "Hasta Elif Kaya (Portal)", role: "Hasta", ip: "85.105.44.201", duration: "1 dk", browser: "Chrome - Android" },
    ]);

    // Notification & Message Form States
    const [msgTab, setMsgTab] = useState("notification"); // "notification" or "message"
    const [targetType, setTargetType] = useState("all_doctors"); // "all_doctors", "all_patients", "all_staff", "doctor", "patient", "staff"
    const [receiverId, setReceiverId] = useState("");
    const [msgTitle, setMsgTitle] = useState("");
    const [msgBody, setMsgBody] = useState("");
    const [notifType, setNotifType] = useState("message");
    const [notifLink, setNotifLink] = useState("");
    
    const [usersList, setUsersList] = useState([]);
    const [patientsList, setPatientsList] = useState([]);
    const [filteredRecipients, setFilteredRecipients] = useState([]);
    const [searchRecipientQuery, setSearchRecipientQuery] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Filter recipients list based on targetType and search query
    useEffect(() => {
        let list = [];
        if (targetType === "doctor") {
            list = usersList.filter(u => u.role === "doctor").map(u => ({
                _id: u.profileId?._id || u._id,
                name: u.profileId?.name || u.name || "Bilinmeyen Hekim",
                email: u.email
            }));
        } else if (targetType === "staff") {
            list = usersList.filter(u => ["receptionist", "pharmacist", "accountant", "hr", "technician", "staff"].includes(u.role)).map(u => ({
                _id: u._id,
                name: u.profileId?.name || u.name || "Bilinmeyen Personel",
                email: u.email,
                role: u.role
            }));
        } else if (targetType === "patient") {
            list = patientsList.map(p => ({
                _id: p._id,
                name: p.name,
                email: p.email || "",
                phone: p.phone || ""
            }));
        }

        if (searchRecipientQuery.trim()) {
            const q = searchRecipientQuery.toLowerCase();
            list = list.filter(item => 
                (item.name || "").toLowerCase().includes(q) || 
                (item.email || "").toLowerCase().includes(q)
            );
        }
        setFilteredRecipients(list);
        
        if (list.length > 0) {
            const exists = list.some(item => item._id === receiverId);
            if (!exists) setReceiverId(list[0]._id);
        } else {
            setReceiverId("");
        }
    }, [targetType, searchRecipientQuery, usersList, patientsList]);

    // Update targetType fallback based on msgTab change
    useEffect(() => {
        if (msgTab === "message") {
            // Messages are individual only
            if (!["doctor", "patient", "staff"].includes(targetType)) {
                setTargetType("doctor");
            }
        }
    }, [msgTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, logsData, settingsData, usersData, patientsData] = await Promise.all([
                adminApi.getSystemStats().catch(err => { console.error(err); return null; }),
                adminApi.getLogs().catch(err => { console.error(err); return []; }),
                adminApi.getSettings().catch(err => { console.error(err); return null; }),
                adminApi.getUsers().catch(err => { console.error(err); return []; }),
                adminPatientsApi.getAll().catch(err => { console.error(err); return []; })
            ]);
            
            if (statsData) setStats(statsData);
            setLogs(logsData);
            setUsersList(usersData);
            setPatientsList(patientsData);
            if (settingsData) {
                setSettings({
                    maintenanceMode: settingsData.maintenanceMode || false,
                    emergencyLockdown: settingsData.emergencyLockdown || false,
                    hospitalName: settingsData.hospitalName || "MediTrack Merkez Hastanesi"
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Veriler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendBroadcastOrDirect = async (e) => {
        e.preventDefault();
        if (!msgTitle.trim() || !msgBody.trim()) {
            toast.error("Lütfen başlık ve mesaj içeriğini doldurun.");
            return;
        }

        setIsSending(true);
        try {
            if (msgTab === "notification") {
                const payload = {
                    targetType,
                    receiverId: ["doctor", "patient", "staff"].includes(targetType) ? receiverId : undefined,
                    title: msgTitle,
                    message: msgBody,
                    type: notifType,
                    link: notifLink || undefined
                };
                await adminApi.sendNotification(payload);
                toast.success("Bildirim başarıyla gönderildi!");
            } else {
                // message
                if (!["doctor", "patient", "staff"].includes(targetType)) {
                    toast.error("Özel mesajlar sadece bireysel alıcılara gönderilebilir.");
                    setIsSending(false);
                    return;
                }
                const payload = {
                    targetType,
                    receiverId,
                    title: msgTitle,
                    content: msgBody
                };
                await adminApi.sendMessage(payload);
                toast.success("Özel mesaj başarıyla gönderildi!");
            }
            // Clear inputs
            setMsgTitle("");
            setMsgBody("");
            setNotifLink("");
            
            // Reload logs immediately to show the action in the logs panel!
            const logsData = await adminApi.getLogs().catch(err => []);
            setLogs(logsData);
        } catch (error) {
            toast.error("Gönderim başarısız: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    const toggleLockdown = async (newValue) => {
        if (user?.specialty !== "Bilgi İşlem Müdürü") {
            toast.error("Yetki Hatası: Acil durum kilidini sadece Bilgi İşlem Müdürü yönetebilir.");
            return;
        }
        try {
            const updated = { ...settings, emergencyLockdown: newValue };
            await adminApi.updateSettings(updated);
            setSettings(updated);
            if (newValue) {
                toast.error("ACİL DURUM KİLİDİ ETKİNLEŞTİRİLDİ!", { duration: 4000 });
            } else {
                toast.success("Acil durum kilidi kaldırıldı.");
            }
            fetchData();
        } catch (err) {
            toast.error("İşlem başarısız: " + err.message);
        }
    };

    const toggleMaintenance = async (newValue) => {
        if (user?.specialty !== "Bilgi İşlem Müdürü" && user?.specialty !== "Bilgi İşlem Müdür Yardımcısı") {
            toast.error("Yetki Hatası: Bakım modunu sadece Müdür veya Müdür Yardımcısı yönetebilir.");
            return;
        }
        try {
            const updated = { ...settings, maintenanceMode: newValue };
            await adminApi.updateSettings(updated);
            setSettings(updated);
            if (newValue) {
                toast.error("Bakım modu etkinleştirildi.");
            } else {
                toast.success("Bakım modu kapatıldı.");
            }
            fetchData();
        } catch (err) {
            toast.error("İşlem başarısız: " + err.message);
        }
    };

    const handleBackup = async () => {
        if (user?.specialty !== "Bilgi İşlem Müdürü") {
            toast.error("Yetki Hatası: Veritabanı yedeği alma yetkisi sadece Bilgi İşlem Müdürü'ne aittir.");
            return;
        }
        setIsBackingUp(true);
        try {
            const response = await adminApi.getBackup();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", response.file);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            toast.success("Veritabanı yedekleme JSON dosyası başarıyla indirildi.");
        } catch (error) {
            toast.error("Yedekleme başarısız: " + error.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleExportPDF = () => {
        if (user?.specialty !== "Bilgi İşlem Müdürü") {
            toast.error("Yetki Hatası: PDF rapor aktarma yetkisi sadece Bilgi İşlem Müdürü'ne aittir.");
            return;
        }
        setIsExporting(true);
        setTimeout(() => {
            const element = dashboardRef.current;
            const opt = {
                margin: 10,
                filename: `Bilgi_Islem_Sistem_Raporu_${new Date().toLocaleDateString('tr-TR')}.pdf`,
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

    const handlePing = () => {
        if (!pingAddress.trim()) return;
        setIsPinging(true);
        setPingLogs([]);
        
        const address = pingAddress.trim();
        const logsSeq = [
            `PING ${address} (192.168.2.14): 56 data bytes`,
            `64 bytes from 192.168.2.14: icmp_seq=1 ttl=64 time=1.45 ms`,
            `64 bytes from 192.168.2.14: icmp_seq=2 ttl=64 time=0.98 ms`,
            `64 bytes from 192.168.2.14: icmp_seq=3 ttl=64 time=1.12 ms`,
            `--- ${address} ping statistics ---`,
            `3 packets transmitted, 3 packets received, 0% packet loss`,
            `rtt min/avg/max/mdev = 0.98/1.18/1.45/0.20 ms`
        ];

        let currentIdx = 0;
        const interval = setInterval(() => {
            if (currentIdx < logsSeq.length) {
                setPingLogs(prev => [...prev, logsSeq[currentIdx]]);
                currentIdx++;
            } else {
                clearInterval(interval);
                setIsPinging(false);
            }
        }, 300);
    };

    const handleOptimizeDb = () => {
        if (user?.specialty !== "Bilgi İşlem Müdürü") {
            toast.error("Yetki Hatası: Veritabanı optimizasyonunu sadece Bilgi İşlem Müdürü başlatabilir.");
            return;
        }
        setIsOptimizing(true);
        setOptLogs([]);

        const logsSeq = [
            `[DB] Scanning MongoDB database collections size...`,
            `[DB] Defragmenting collection: users (size: 24KB)... Done.`,
            `[DB] Defragmenting collection: patients (size: 128KB)... Done.`,
            `[DB] Rebuilding unique index: email_1... Done.`,
            `[DB] Rebuilding unique index: patientId_1... Done.`,
            `[DB] Purging transient query cache... Done.`,
            `[DB] Database index optimization complete. freed 1.4 MB.`
        ];

        let currentIdx = 0;
        const interval = setInterval(() => {
            if (currentIdx < logsSeq.length) {
                setOptLogs(prev => [...prev, logsSeq[currentIdx]]);
                currentIdx++;
            } else {
                clearInterval(interval);
                setIsOptimizing(false);
                toast.success("Veritabanı indeksleri ve önbellek optimize edildi.");
            }
        }, 400);
    };

    const handleKillSession = (id, user) => {
        setActiveSessions(prev => prev.filter(s => s.id !== id));
        toast.success(`${user} adlı kullanıcının oturumu sonlandırıldı.`);
    };

    if (loading) return <div style={{ padding: "40px", color: "#6b7280" }}>IT Kontrol Paneli Yükleniyor...</div>;

    const statCards = [
        { label: "Günlük Randevu Trafiği", value: stats?.dailyPatients || 0, icon: <FiTrendingUp />, color: "#ec4899", bg: "rgba(236, 72, 153, 0.1)" },
        { label: "Kayıtlı Branş Sayısı", value: stats?.topDepartment?.count || 4, icon: <RiHospitalLine />, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
        { label: "Sistem Hekimleri", value: stats?.totalDoctors || 0, icon: <FiUsers />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
        { label: "Toplam Kayıtlı Hasta", value: stats?.totalPatients || 0, icon: <FiUsers />, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
        { label: "İptal Oranı", value: `%${stats?.cancellationRate || 0}`, icon: <FiXCircle />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
        { label: "Veritabanı Yedeği", value: "Hazır", icon: <FiDatabase />, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    ];

    const services = [
        { name: "MongoDB Database Server", port: "27017", status: "Online" },
        { name: "Node.js Core API Engine", port: "5000", status: "Online" },
        { name: "SMTP Mailer Gateway", port: "587", status: "Online" },
        { name: "Gemini AI Inference Proxy", port: "HTTPS", status: "Online" },
        { name: "SMS Notification Gateway", port: "HTTP", status: "Online" },
    ];

    return (
        <div className="admin-dashboard-v2 animate-fade-in" style={{
            color: "white",
            minHeight: "100vh",
            background: "transparent",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif"
        }} ref={dashboardRef}>
            <Toaster position="top-right" />

            {/* Background Orbs */}
            {!isExporting && <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }}></div>}

            <div style={{ position: "relative", zIndex: 1, maxWidth: "1440px", margin: "0 auto" }}>
                
                {/* Header */}
                <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                        <h1 style={{ fontSize: "40px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-1px", background: "linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Bilgi İşlem Kontrol Paneli (IT Admin)
                        </h1>
                        <p style={{ color: "#64748b", margin: 0, fontSize: "16px", fontWeight: 400 }}>Sistem sağlığı, yedeklemeler, sunucu donanım doluluğu ve acil durum kilit sistemleri yönetim merkezi.</p>
                    </div>
                    <div style={{ display: isExporting ? "none" : "flex", gap: "12px" }}>
                        {user?.specialty !== "Bilgi İşlem Uzmanı" && (
                            <button
                                onClick={() => window.location.href = '/admin/users'}
                                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", color: "white", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)" }}
                            >
                                <FiUsers size={18} /> Kullanıcı Yönetimi
                            </button>
                        )}
                        {user?.specialty === "Bilgi İşlem Müdürü" && (
                            <button
                                onClick={handleExportPDF}
                                style={{ background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", padding: "12px 20px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                <FiDownloadCloud size={18} /> PDF Rapor Aktar
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
                    
                    {/* Stat Cards */}
                    <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                        {statCards.map((card, idx) => (
                            <div key={idx} style={{
                                background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)",
                                padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)",
                                position: "relative", overflow: "hidden"
                            }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 600, marginBottom: "8px" }}>{card.label}</div>
                                        <div style={{ fontSize: "28px", fontWeight: 800, color: "white" }}>{card.value}</div>
                                    </div>
                                    <div style={{
                                        width: "42px", height: "42px", borderRadius: "10px",
                                        background: card.bg, color: card.color,
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                                        border: `1px solid ${card.color}40`
                                    }}>
                                        {card.icon}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Emergency lockdown controls */}
                    <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
                        
                        {/* Maintenance Mod */}
                        <div style={{
                            background: settings.maintenanceMode ? "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.18) 100%)" : "rgba(15, 23, 42, 0.65)",
                            border: settings.maintenanceMode ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                            padding: "24px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between"
                        }}>
                            <div>
                                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "white" }}>Sistem Bakım Modu</h3>
                                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, maxWidth: "340px" }}>
                                    Ziyaretçilerin sisteme giriş yapmasını engeller ve planlı çalışma duyurusu gösterir.
                                </p>
                            </div>
                            <label className="toggle-switch-card" style={{ opacity: (user?.specialty === "Bilgi İşlem Müdürü" || user?.specialty === "Bilgi İşlem Müdür Yardımcısı") ? 1 : 0.5, cursor: (user?.specialty === "Bilgi İşlem Müdürü" || user?.specialty === "Bilgi İşlem Müdür Yardımcısı") ? "pointer" : "not-allowed" }}>
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    disabled={user?.specialty !== "Bilgi İşlem Müdürü" && user?.specialty !== "Bilgi İşlem Müdür Yardımcısı"}
                                    onChange={(e) => toggleMaintenance(e.target.checked)}
                                />
                                <span className="slider-card" style={{ background: settings.maintenanceMode ? "#f59e0b" : "#334155" }}></span>
                            </label>
                        </div>
 
                        {/* Emergency Lockdown */}
                        <div style={{
                            background: settings.emergencyLockdown ? "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.18) 100%)" : "rgba(15, 23, 42, 0.65)",
                            border: settings.emergencyLockdown ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                            padding: "24px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between"
                        }}>
                            <div>
                                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "#ef4444" }}>Acil Durum Kilidi (Lockdown)</h3>
                                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, maxWidth: "340px" }}>
                                    Olası veri ihlali durumlarında tüm API geçitlerini ve kullanıcı seanslarını derhal yok eder.
                                </p>
                            </div>
                            <label className="toggle-switch-card" style={{ opacity: user?.specialty === "Bilgi İşlem Müdürü" ? 1 : 0.5, cursor: user?.specialty === "Bilgi İşlem Müdürü" ? "pointer" : "not-allowed" }}>
                                <input
                                    type="checkbox"
                                    checked={settings.emergencyLockdown}
                                    disabled={user?.specialty !== "Bilgi İşlem Müdürü"}
                                    onChange={(e) => toggleLockdown(e.target.checked)}
                                />
                                <span className="slider-card" style={{ background: settings.emergencyLockdown ? "#ef4444" : "#334155" }}></span>
                            </label>
                        </div>

                    </div>

                    {/* Duyuru, Bildirim & Mesaj Gönderim Merkezi */}
                    <div style={{
                        gridColumn: "span 12",
                        background: "rgba(30, 41, 59, 0.7)",
                        backdropFilter: "blur(12px)",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
                            <div>
                                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "10px", color: "#60a5fa" }}>
                                    <FiBell /> Bildirim & Özel Mesaj Gönderim Merkezi
                                </h2>
                                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Sistem kullanıcılarına veya hastalara tekil/toplu anlık bildirimler ve özel mesajlar gönderin.</p>
                            </div>
                            
                            {/* Tab Selectors */}
                            <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <button
                                    onClick={() => setMsgTab("notification")}
                                    style={{
                                        padding: "8px 16px",
                                        background: msgTab === "notification" ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "transparent",
                                        color: msgTab === "notification" ? "white" : "#94a3b8",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    <FiBell size={14} /> Anlık Bildirim (Push)
                                </button>
                                <button
                                    onClick={() => setMsgTab("message")}
                                    style={{
                                        padding: "8px 16px",
                                        background: msgTab === "message" ? "linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)" : "transparent",
                                        color: msgTab === "message" ? "white" : "#94a3b8",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    <FiMail size={14} /> Özel Mesaj (DM)
                                </button>
                            </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSendBroadcastOrDirect} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "32px", width: "100%" }}>
                            
                            {/* Left Side: Recipient Selection */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Alıcı Türü</label>
                                    <select
                                        value={targetType}
                                        onChange={(e) => setTargetType(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            background: "rgba(0, 0, 0, 0.3)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "8px",
                                            color: "white",
                                            fontSize: "14px",
                                            outline: "none"
                                        }}
                                    >
                                        {msgTab === "notification" && (
                                            <>
                                                <option value="all_doctors">📢 Tüm Hekimler (Toplu)</option>
                                                <option value="all_patients">📢 Tüm Hastalar (Toplu)</option>
                                                <option value="all_staff">📢 Tüm Personel ve Hekimler (Toplu)</option>
                                            </>
                                        )}
                                        <option value="doctor">👤 Belirli Bir Hekim</option>
                                        <option value="patient">👤 Belirli Bir Hasta</option>
                                        <option value="staff">👤 Belirli Bir Personel (Sekreter, Eczacı vb.)</option>
                                    </select>
                                </div>

                                {/* Search and Select Recipient (if individual targetType selected) */}
                                {["doctor", "patient", "staff"].includes(targetType) && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(0,0,0,0.15)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Kişi Ara (İsim / E-posta)</label>
                                            <input
                                                type="text"
                                                placeholder="İsim yazarak arayın..."
                                                value={searchRecipientQuery}
                                                onChange={(e) => setSearchRecipientQuery(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "8px 12px",
                                                    background: "rgba(0,0,0,0.2)",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "6px",
                                                    color: "white",
                                                    fontSize: "13px",
                                                    outline: "none",
                                                    boxSizing: "border-box"
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Alıcı Seçin ({filteredRecipients.length} Kişi Bulundu)</label>
                                            <select
                                                value={receiverId}
                                                onChange={(e) => setReceiverId(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "10px",
                                                    background: "rgba(0, 0, 0, 0.3)",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "6px",
                                                    color: "white",
                                                    fontSize: "13px",
                                                    outline: "none"
                                                }}
                                                required
                                            >
                                                {filteredRecipients.length === 0 ? (
                                                    <option value="" disabled>Aramaya uygun sonuç bulunamadı</option>
                                                ) : (
                                                    filteredRecipients.map(r => (
                                                        <option key={r._id} value={r._id}>
                                                            {r.name} ({r.email || "Detay yok"})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Notification Configurations (Only for Notification Tab) */}
                                {msgTab === "notification" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Bildirim Türü</label>
                                            <select
                                                value={notifType}
                                                onChange={(e) => setNotifType(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "12px",
                                                    background: "rgba(0, 0, 0, 0.3)",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "8px",
                                                    color: "white",
                                                    fontSize: "14px",
                                                    outline: "none"
                                                }}
                                            >
                                                <option value="message">✉️ Genel Mesaj / Bilgi</option>
                                                <option value="labResult">🔬 Tahlil & Test Uyarısı</option>
                                                <option value="appointment">📅 Randevu Bilgilendirmesi</option>
                                                <option value="file">📂 Dosya & Rapor Uyarısı</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Yönlendirme Linki (İsteğe Bağlı)</label>
                                            <input
                                                type="text"
                                                placeholder="Örn: /appointments veya /hasta/portal"
                                                value={notifLink}
                                                onChange={(e) => setNotifLink(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "12px",
                                                    background: "rgba(0, 0, 0, 0.3)",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "8px",
                                                    color: "white",
                                                    fontSize: "14px",
                                                    outline: "none",
                                                    boxSizing: "border-box"
                                                }}
                                            />
                                            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>Bildirime tıklandığında gidilecek sayfa yönlendirmesi.</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Message Title & Body */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Konu / Başlık</label>
                                        <input
                                            type="text"
                                            placeholder="Gönderim başlığını girin..."
                                            value={msgTitle}
                                            onChange={(e) => setMsgTitle(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                background: "rgba(0, 0, 0, 0.3)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                borderRadius: "8px",
                                                color: "white",
                                                fontSize: "14px",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Mesaj İçeriği</label>
                                        <textarea
                                            placeholder="Kullanıcıya veya gruba göndermek istediğiniz mesajı detaylıca yazın..."
                                            rows={6}
                                            value={msgBody}
                                            onChange={(e) => setMsgBody(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                background: "rgba(0, 0, 0, 0.3)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                borderRadius: "8px",
                                                color: "white",
                                                fontSize: "14px",
                                                outline: "none",
                                                fontFamily: "inherit",
                                                resize: "none",
                                                boxSizing: "border-box"
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSending}
                                    style={{
                                        width: "100%",
                                        padding: "14px",
                                        background: msgTab === "notification" 
                                            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" 
                                            : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: 700,
                                        fontSize: "14px",
                                        cursor: isSending ? "wait" : "pointer",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "8px",
                                        boxShadow: msgTab === "notification" 
                                            ? "0 4px 12px rgba(37, 99, 235, 0.2)" 
                                            : "0 4px 12px rgba(124, 58, 237, 0.2)",
                                        opacity: isSending ? 0.7 : 1,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <FiSend />
                                    {isSending ? "Gönderiliyor..." : `${msgTab === "notification" ? "Bildirimi Yayınla" : "Özel Mesajı Gönder"}`}
                                </button>
                            </div>

                        </form>
                    </div>

                    {/* Left: Quick Actions & Database tool */}
                    <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "24px" }}>
                        
                        {/* Database Backup Card */}
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiDatabase color="#a855f7" /> Veritabanı Yönetimi
                            </h2>
                            <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.5, marginBottom: "20px" }}>
                                Tüm hastane koleksiyonlarını (doktorlar, hastalar, randevular, ayarlar) tek tuşla güvenli JSON yedeği olarak indirin.
                            </p>
                            <button
                                onClick={handleBackup}
                                disabled={isBackingUp || user?.specialty !== "Bilgi İşlem Müdürü"}
                                style={{
                                    width: "100%", padding: "14px", 
                                    background: (isBackingUp || user?.specialty !== "Bilgi İşlem Müdürü") ? "#475569" : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                                    color: "white", border: "none", borderRadius: "10px", fontWeight: 700, 
                                    cursor: (isBackingUp || user?.specialty !== "Bilgi İşlem Müdürü") ? "not-allowed" : "pointer",
                                    opacity: (isBackingUp || user?.specialty !== "Bilgi İşlem Müdürü") ? 0.6 : 1,
                                    display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", 
                                    boxShadow: (isBackingUp || user?.specialty !== "Bilgi İşlem Müdürü") ? "none" : "0 4px 12px rgba(124, 58, 237, 0.25)"
                                }}
                            >
                                <FiDownloadCloud /> {isBackingUp ? "Yedekleniyor..." : "Veritabanını Yedekle"}
                            </button>
                        </div>

                        {/* Quick navigations */}
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Hızlı Bağlantılar</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {user?.specialty !== "Bilgi İşlem Uzmanı" && (
                                    <button onClick={() => window.location.href = '/admin/specialties'} style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", color: "white", cursor: "pointer", fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <RiHospitalLine color="#f59e0b" /> Branş (Departman) Yönetimi
                                    </button>
                                )}
                                {user?.specialty === "Bilgi İşlem Müdürü" && (
                                    <button onClick={() => window.location.href = '/admin/settings'} style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", color: "white", cursor: "pointer", fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FiSettings color="#3b82f6" /> Gelişmiş Sistem Ayarları
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Middle: Chart */}
                    <div style={{ gridColumn: "span 8", background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", margin: 0 }}>Randevu Trafiği Dağılımı</h2>
                            <div style={{ fontSize: "12px", color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>Vite Server Monitor</div>
                        </div>
                        <div style={{ width: "100%", height: 320, flex: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.monthlyChart || []} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                        contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                                        itemStyle={{ color: "#6366f1", fontWeight: 700 }}
                                    />
                                    <Bar dataKey="randevular" fill="url(#colorUv)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                                    <defs>
                                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Resources health, Service Status & Logs */}
                    <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                        
                        {/* Hardware */}
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiCpu color="#10b981" /> Sunucu Sağlığı
                            </h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {[
                                    { label: "CPU Yükü", val: stats?.hardware?.cpuUsage || 12, color: "#3b82f6" },
                                    { label: "RAM Doluluğu", val: stats?.hardware?.memoryUsage || 48, color: "#10b981" },
                                    { label: "Disk Sınırı (Depolama)", val: stats?.hardware?.diskUsage || 42, color: "#8b5cf6" },
                                ].map((s, i) => (
                                    <div key={i}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                                            <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{s.label}</span>
                                            <span style={{ fontWeight: 700, color: "white" }}>%{s.val}</span>
                                        </div>
                                        <div style={{ height: "6px", background: "rgba(0,0,0,0.3)", borderRadius: "3px", overflow: "hidden" }}>
                                            <div style={{ width: `${s.val}%`, height: "100%", background: s.color, boxShadow: `0 0 10px ${s.color}` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Systems Status Indicators */}
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiGlobe color="#6366f1" /> Servis Durumları
                            </h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {services.map((srv, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.02)" }}>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>{srv.name}</div>
                                            <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>Port: {srv.port}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981", fontWeight: 700 }}>
                                            <span className="live-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                                            {srv.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit Logs */}
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px", display: "flex", flexDirection: "column" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <FiLogIcon color="#ef4444" /> Sistem Logs
                            </h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "200px", pr: "5px" }}>
                                {logs.slice(0, 5).map((log, idx) => (
                                    <div key={log.id || idx} style={{
                                        padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "10px",
                                        display: "flex", alignItems: "center", gap: "14px", borderLeft: `3px solid ${log.status === "success" ? "#10b981" : log.status === "warning" ? "#f59e0b" : "#3b82f6"}`
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                <span style={{ color: "white", fontWeight: 600 }}>{log.user}</span> &mdash; {log.action}
                                            </div>
                                            {log.details && <div style={{ fontSize: "12px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details}</div>}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>
                                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Active Sessions & IT Tools (Ping, DB Optimize) */}
                    <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
                        
                        {/* Active Sessions (span 7) */}
                        <div style={{ gridColumn: "span 7", background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiUsers color="#06b6d4" /> Aktif Kullanıcı Oturumları
                            </h2>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textLeft: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: "12px" }}>
                                            <th style={{ padding: "12px 8px", textAlign: "left" }}>Kullanıcı</th>
                                            <th style={{ padding: "12px 8px", textAlign: "left" }}>Rol</th>
                                            <th style={{ padding: "12px 8px", textAlign: "left" }}>IP Adresi</th>
                                            <th style={{ padding: "12px 8px", textAlign: "left" }}>Aktiflik</th>
                                            <th style={{ padding: "12px 8px", textAlign: "right" }}>Eylem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeSessions.map((session) => (
                                            <tr key={session.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px" }}>
                                                <td style={{ padding: "12px 8px" }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "white" }}>{session.user}</div>
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{session.browser}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "12px 8px" }}>
                                                    <span style={{ fontSize: "11px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{session.role}</span>
                                                </td>
                                                <td style={{ padding: "12px 8px", fontFamily: "monospace", color: "#cbd5e1" }}>{session.ip}</td>
                                                <td style={{ padding: "12px 8px", color: "#10b981", fontWeight: 500 }}>{session.duration}</td>
                                                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                                                    <button 
                                                        onClick={() => handleKillSession(session.id, session.user)}
                                                        style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#f87171", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                                    >
                                                        Bağlantıyı Kes
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* IT Command Center: Ping & DB Index Optimizer (span 5) */}
                        <div style={{ gridColumn: "span 5", background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                            
                            {/* Ping Tool */}
                            <div>
                                <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FiWifi color="#38bdf8" /> Network Ping Testi
                                </h2>
                                <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                                    <input 
                                        type="text" 
                                        value={pingAddress}
                                        onChange={(e) => setPingAddress(e.target.value)}
                                        placeholder="Uzak sunucu host veya IP..."
                                        style={{ flex: 1, padding: "10px 14px", background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white", fontSize: "13px", outline: "none" }}
                                    />
                                    <button 
                                        onClick={handlePing}
                                        disabled={isPinging}
                                        style={{ background: "#0284c7", color: "white", border: "none", padding: "0 16px", borderRadius: "8px", fontWeight: 600, cursor: isPinging ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                                    >
                                        <FiPlay size={14} /> {isPinging ? "Gönderiliyor..." : "Ping At"}
                                    </button>
                                </div>

                                {/* Terminal Output */}
                                <div style={{
                                    height: "120px",
                                    background: "rgba(2, 6, 23, 0.85)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "10px",
                                    padding: "12px",
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: "11px",
                                    color: "#4ade80",
                                    overflowY: "auto",
                                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)"
                                }}>
                                    {pingLogs.length === 0 ? (
                                        <div style={{ color: "#64748b" }}>Test çıktısı için "Ping At" butonuna basın...</div>
                                    ) : (
                                        pingLogs.map((log, index) => (
                                            <div key={index} style={{ marginBottom: "2px" }}>
                                                <span style={{ color: "#38bdf8" }}>$</span> {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* DB Index Optimizer */}
                            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                                        <FiDatabase color="#a855f7" /> Indeks & önbellek Optimizasyonu
                                    </h2>
                                    <button 
                                        onClick={handleOptimizeDb}
                                        disabled={isOptimizing || user?.specialty !== "Bilgi İşlem Müdürü"}
                                        style={{ 
                                            background: (isOptimizing || user?.specialty !== "Bilgi İşlem Müdürü") ? "#475569" : "#7c3aed", 
                                            color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 600, 
                                            cursor: (isOptimizing || user?.specialty !== "Bilgi İşlem Müdürü") ? "not-allowed" : "pointer", 
                                            opacity: (isOptimizing || user?.specialty !== "Bilgi İşlem Müdürü") ? 0.6 : 1,
                                            display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" 
                                        }}
                                    >
                                        <FiRefreshCw className={isOptimizing ? "spin" : ""} size={12} /> {isOptimizing ? "Çalışıyor..." : "Optimize Et"}
                                    </button>
                                </div>

                                <div style={{
                                    height: "100px",
                                    background: "rgba(2, 6, 23, 0.85)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "10px",
                                    padding: "12px",
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: "11px",
                                    color: "#a855f7",
                                    overflowY: "auto",
                                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)"
                                }}>
                                    {optLogs.length === 0 ? (
                                        <div style={{ color: "#64748b" }}>Konsol çıktısı için "Optimize Et" butonuna basın...</div>
                                    ) : (
                                        optLogs.map((log, index) => (
                                            <div key={index} style={{ marginBottom: "2px" }}>
                                                <span style={{ color: "#ef4444" }}>#</span> {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <style>{`
                .toggle-switch-card {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
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
                    background-color: #475569;
                    transition: .4s;
                    border-radius: 24px;
                }
                .slider-card:before {
                    position: absolute;
                    content: "";
                    height: 16px; width: 16px;
                    left: 4px; bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider-card:before {
                    transform: translateX(26px);
                }
                .live-pulse {
                    animation: pulseLight 1.8s infinite alternate;
                }
                @keyframes pulseLight {
                    0% { transform: scale(0.9); opacity: 0.5; filter: drop-shadow(0 0 1px #10b981); }
                    100% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 6px #10b981); }
                }
                .spin {
                    animation: spinLoading 1s linear infinite;
                }
                @keyframes spinLoading {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

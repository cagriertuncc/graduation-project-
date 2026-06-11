import { useState, useEffect } from "react";
import { FiPlus, FiCpu, FiAlertCircle, FiCheckCircle, FiClock, FiSearch, FiSliders, FiTrash2, FiUser, FiActivity } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { itRequestsApi } from "../services/api";

// Pre-seeded IT requests for first load
const initialRequests = [
    {
        id: "IT-101",
        title: "Kardiyoloji Polikliniği Yazıcı Bağlantı Sorunu",
        category: "Donanım",
        priority: "Yüksek",
        status: "Açık",
        assignee: "Atanmamış",
        createdBy: "Dr. Ahmet Yılmaz",
        description: "Reçete yazıcısı bilgisayara bağlı görünmesine rağmen çıktı alınırken hata veriyor. Acil destek rica ederiz.",
        createdAt: "2026-06-10T09:15:00Z"
    },
    {
        id: "IT-102",
        title: "Laboratuvar Sonuç Entegrasyonu Gecikmesi",
        category: "Yazılım",
        priority: "Kritik",
        status: "İnceleniyor",
        assignee: "Can Tekin",
        createdBy: "Uzm. Dr. Zeynep Kaya",
        description: "Tahlil sonuçları sisteme düştükten sonra doktor paneline 5-10 dakika gecikmeli yansıyor. Entegrasyon servisinin kontrol edilmesi gerekiyor.",
        createdAt: "2026-06-10T08:30:00Z"
    },
    {
        id: "IT-103",
        title: "Yeni Danışma Personeli İçin Rol Tanımlaması",
        category: "Yetkilendirme",
        priority: "Orta",
        status: "Çözüldü",
        assignee: "Leyla Aslan",
        createdBy: "Sistem Yöneticisi",
        description: "Yeni işe başlayan danışma memuru Hilal Demir için sisteme kabul yetkisi tanımlandı.",
        createdAt: "2026-06-09T14:20:00Z"
    },
    {
        id: "IT-104",
        title: "Eczane Barkod Okuyucu Arızası",
        category: "Donanım",
        priority: "Yüksek",
        status: "İnceleniyor",
        assignee: "Can Tekin",
        createdBy: "Ecz. Murat Demir",
        description: "İlaç teslimatında kullanılan el terminali barkodları okumuyor. Yedek cihaz talep ediyoruz.",
        createdAt: "2026-06-10T10:05:00Z"
    },
    {
        id: "IT-105",
        title: "Muhasebe Faturalandırma Ekranı Donma Sorunu",
        category: "Yazılım",
        priority: "Orta",
        status: "Açık",
        assignee: "Atanmamış",
        createdBy: "Muh. Elif Aksu",
        description: "Hastalara fatura keserken tarayıcı kilitleniyor ve sayfanın yenilenmesi gerekiyor. Chrome güncellenmeli ya da kod optimize edilmeli.",
        createdAt: "2026-06-10T07:45:00Z"
    }
];

const IT_STAFF = ["Hakan Çelik", "Leyla Aslan", "Can Tekin"];

export default function ITRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("Tümü");
    const [selectedPriority, setSelectedPriority] = useState("Tümü");
    const [selectedAssignee, setSelectedAssignee] = useState("Tümü");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Form state
    const [form, setForm] = useState({
        title: "",
        category: "Yazılım",
        priority: "Orta",
        description: ""
    });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await itRequestsApi.getAll();
            setRequests(data || []);
        } catch (err) {
            console.error("IT requests fetch error:", err);
            toast.error("Destek talepleri yüklenemedi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            toast.error("Lütfen gerekli tüm alanları doldurun!");
            return;
        }

        try {
            const newReq = await itRequestsApi.create(form);
            setRequests([newReq, ...requests]);
            setIsAddModalOpen(false);
            setForm({ title: "", category: "Yazılım", priority: "Orta", description: "" });
            toast.success("Destek talebi başarıyla oluşturuldu.");
        } catch (err) {
            toast.error("Talep oluşturulamadı: " + err.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const updated = await itRequestsApi.update(id, { status: newStatus });
            setRequests(requests.map(r => r._id === id ? updated : r));
            toast.success(`Talep durumu "${newStatus}" olarak güncellendi.`);
        } catch (err) {
            toast.error("Durum güncellenemedi: " + err.message);
        }
    };

    const handlePriorityChange = async (id, newPriority) => {
        try {
            const updated = await itRequestsApi.update(id, { priority: newPriority });
            setRequests(requests.map(r => r._id === id ? updated : r));
            toast.success(`Talep önceliği "${newPriority}" olarak güncellendi.`);
        } catch (err) {
            toast.error("Öncelik güncellenemedi: " + err.message);
        }
    };

    const handleAssigneeChange = async (id, newAssignee) => {
        try {
            const updated = await itRequestsApi.update(id, { assignee: newAssignee });
            setRequests(requests.map(r => r._id === id ? updated : r));
            toast.success(`Talebe atanan kişi "${newAssignee}" olarak güncellendi.`);
        } catch (err) {
            toast.error("Atanan kişi güncellenemedi: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bu destek talebini silmek istediğinize emin misiniz?")) {
            try {
                await itRequestsApi.delete(id);
                setRequests(requests.filter(r => r._id !== id));
                toast.success("Talep silindi.");
            } catch (err) {
                toast.error("Talep silinemedi: " + err.message);
            }
        }
    };

    // Filter requests
    const filteredRequests = requests.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.requestId || r.id || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === "Tümü" || r.status === selectedStatus;
        const matchesPriority = selectedPriority === "Tümü" || r.priority === selectedPriority;
        const matchesAssignee = selectedAssignee === "Tümü" || (r.assignee || "Atanmamış") === selectedAssignee;
        return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });

    // Counts for Stats Card
    const totalCount = requests.length;
    const openCount = requests.filter(r => r.status === "Açık").length;
    const activeCount = requests.filter(r => r.status === "İnceleniyor").length;
    const resolvedCount = requests.filter(r => r.status === "Çözüldü").length;

    // Active (non-resolved) tickets by staff
    const getActiveTicketCount = (staffName) => {
        return requests.filter(r => (r.assignee || "Atanmamış") === staffName && r.status !== "Çözüldü").length;
    };

    // Resolution rate percentage
    const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Kritik": return { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" };
            case "Yüksek": return { bg: "rgba(249, 115, 22, 0.15)", text: "#fb923c", border: "1px solid rgba(249, 115, 22, 0.3)" };
            case "Orta": return { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" };
            default: return { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af", border: "1px solid rgba(156, 163, 175, 0.3)" };
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Çözüldü": return <FiCheckCircle style={{ color: "#34d399" }} />;
            case "İnceleniyor": return <FiClock style={{ color: "#fbbf24" }} />;
            default: return <FiAlertCircle style={{ color: "#f87171" }} />;
        }
    };

    return (
        <div className="it-requests-page animate-fade-in" style={{ color: "white" }}>
            <Toaster position="top-right" />
            
            {/* Header section */}
            <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        IT & Altyapı Destek Talepleri
                    </h1>
                    <p style={{ color: "#64748b", margin: 0 }}>Sistem içi hata bildirimleri, rol yetkilendirmeleri ve donanımsal destek talepleri.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                        background: "#ef4444", color: "white", border: "none",
                        padding: "12px 24px", borderRadius: "12px", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                    <FiPlus /> Yeni Destek Talebi Aç
                </button>
            </div>

            {/* Stats section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiCpu color="#94a3b8" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Toplam Talep</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "white" }}>{totalCount}</div>
                    </div>
                </div>

                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiAlertCircle color="#ef4444" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Açık Talepler</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#ef4444" }}>{openCount}</div>
                    </div>
                </div>

                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiClock color="#f59e0b" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>İşlemdekiler</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#f59e0b" }}>{activeCount}</div>
                    </div>
                </div>

                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiCheckCircle color="#10b981" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Çözülen Talepler</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>{resolvedCount}</div>
                    </div>
                </div>
            </div>

            {/* IT Ekip Dağılımı ve Çözüm Performansı */}
            <div style={{
                background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
                backdropFilter: "blur(12px)",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "24px",
                alignItems: "stretch"
            }}>
                <div style={{ flex: "2", minWidth: "300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <FiActivity color="#ef4444" size={20} />
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white", margin: 0 }}>
                            IT Ekip İş Yükü Dağılımı (Aktif Talepler)
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[...IT_STAFF, "Atanmamış"].map(person => {
                            const count = getActiveTicketCount(person);
                            let progressColor = "#10b981";
                            if (count >= 4) progressColor = "#ef4444";
                            else if (count >= 2) progressColor = "#f59e0b";
                            
                            const maxScale = Math.max(5, ...[...IT_STAFF, "Atanmamış"].map(p => getActiveTicketCount(p)));
                            const pct = (count / maxScale) * 100;

                            return (
                                <div key={person} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "120px", fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
                                        {person}
                                    </div>
                                    <div style={{ flex: 1, height: "8px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{ width: `${pct}%`, height: "100%", background: progressColor, borderRadius: "4px", transition: "width 0.4s ease" }}></div>
                                    </div>
                                    <div style={{ width: "70px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: count > 0 ? "white" : "#64748b" }}>
                                        {count} Talep
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ width: "1px", background: "rgba(255, 255, 255, 0.08)", alignSelf: "stretch" }}></div>

                <div style={{ flex: "1", minWidth: "220px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                        Genel Çözüm Performansı
                    </div>
                    <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                        <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                            <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="transparent"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * resolutionRate) / 100}
                                style={{ transition: "stroke-dashoffset 0.5s ease" }}
                            />
                        </svg>
                        <div style={{ position: "absolute", fontSize: "20px", fontWeight: 800, color: "white" }}>
                            %{resolutionRate}
                        </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Toplam {totalCount} talepten {resolvedCount} adedi çözüme ulaştı.
                    </div>
                </div>
            </div>

            {/* Filter controls */}
            <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 2, minWidth: "250px" }}>
                        <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                        <input
                            type="text"
                            placeholder="Talep ID, oluşturan veya başlık ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%", padding: "12px 12px 12px 42px",
                                background: "#0f172a", border: "1px solid #334155",
                                borderRadius: "10px", color: "white", outline: "none",
                                fontSize: "14px", boxSizing: "border-box"
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "12px", flex: 1.5, minWidth: "400px" }}>
                        <div style={{ flex: 1 }}>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                style={{
                                    width: "100%", padding: "12px", background: "#0f172a",
                                    border: "1px solid #334155", borderRadius: "10px", color: "white",
                                    outline: "none", fontSize: "14px", cursor: "pointer"
                                }}
                            >
                                <option value="Tümü">Tüm Durumlar</option>
                                <option value="Açık">Açık</option>
                                <option value="İnceleniyor">İnceleniyor</option>
                                <option value="Çözüldü">Çözüldü</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                style={{
                                    width: "100%", padding: "12px", background: "#0f172a",
                                    border: "1px solid #334155", borderRadius: "10px", color: "white",
                                    outline: "none", fontSize: "14px", cursor: "pointer"
                                }}
                            >
                                <option value="Tümü">Tüm Öncelikler</option>
                                <option value="Kritik">Kritik</option>
                                <option value="Yüksek">Yüksek</option>
                                <option value="Orta">Orta</option>
                                <option value="Düşük">Düşük</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <select
                                value={selectedAssignee}
                                onChange={(e) => setSelectedAssignee(e.target.value)}
                                style={{
                                    width: "100%", padding: "12px", background: "#0f172a",
                                    border: "1px solid #334155", borderRadius: "10px", color: "white",
                                    outline: "none", fontSize: "14px", cursor: "pointer"
                                }}
                            >
                                <option value="Tümü">Tüm Atananlar</option>
                                <option value="Atanmamış">Atanmamış</option>
                                {IT_STAFF.map(staff => (
                                    <option key={staff} value={staff}>{staff}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* List of IT requests */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {loading ? (
                    <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "40px", textAlign: "center", color: "#64748b" }}>
                        Destek talepleri yükleniyor...
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "40px", textAlign: "center", color: "#64748b" }}>
                        <FiSliders size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
                        <div>Kriterlere uygun herhangi bir destek talebi bulunamadı.</div>
                    </div>
                ) : (
                    filteredRequests.map(req => {
                        const prio = getPriorityColor(req.priority);
                        return (
                            <div key={req._id} style={{
                                background: "#1e293b", border: "1px solid #334155", borderRadius: "16px",
                                padding: "24px", transition: "all 0.2s", position: "relative"
                            }}>
                                {/* Top info row */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <span style={{ fontFamily: "monospace", color: "#94a3b8", fontWeight: 700, fontSize: "14px" }}>{req.requestId || req.id}</span>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                                            background: prio.bg, color: prio.text, border: prio.border
                                        }}>{req.priority} Öncelik</span>
                                        <span style={{ fontSize: "12px", color: "#64748b", background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: "6px" }}>{req.category}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, background: "rgba(0,0,0,0.15)", padding: "4px 10px", borderRadius: "8px" }}>
                                            {getStatusIcon(req.status)}
                                            <span style={{ color: req.status === "Açık" ? "#f87171" : req.status === "İnceleniyor" ? "#fbbf24" : "#34d399" }}>{req.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px 0", color: "#f8fafc" }}>{req.title}</h3>
                                <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0 0 20px 0", lineHeight: "1.6" }}>{req.description}</p>

                                {/* Talebi Yönet (IT Operations Panel) */}
                                <div style={{
                                    background: "rgba(0,0,0,0.15)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    marginBottom: "20px",
                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                    gap: "16px",
                                    alignItems: "center"
                                }}>
                                    <div>
                                        <label style={{ display: "block", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>Durum</label>
                                        <select
                                            value={req.status}
                                            onChange={(e) => handleStatusChange(req._id, e.target.value)}
                                            style={{
                                                width: "100%", padding: "8px 10px", background: "#0f172a",
                                                border: "1px solid #334155", borderRadius: "8px", color: req.status === "Açık" ? "#f87171" : req.status === "İnceleniyor" ? "#fbbf24" : "#34d399",
                                                outline: "none", fontSize: "13px", cursor: "pointer", fontWeight: 600
                                            }}
                                        >
                                            <option value="Açık" style={{ color: "#f87171", background: "#1e293b" }}>🔴 Açık</option>
                                            <option value="İnceleniyor" style={{ color: "#fbbf24", background: "#1e293b" }}>🟡 İnceleniyor</option>
                                            <option value="Çözüldü" style={{ color: "#34d399", background: "#1e293b" }}>🟢 Çözüldü</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>Öncelik</label>
                                        <select
                                            value={req.priority}
                                            onChange={(e) => handlePriorityChange(req._id, e.target.value)}
                                            style={{
                                                width: "100%", padding: "8px 10px", background: "#0f172a",
                                                border: "1px solid #334155", borderRadius: "8px", color: getPriorityColor(req.priority).text,
                                                outline: "none", fontSize: "13px", cursor: "pointer", fontWeight: 600
                                            }}
                                        >
                                            <option value="Kritik" style={{ color: "#f87171", background: "#1e293b" }}>🔥 Kritik</option>
                                            <option value="Yüksek" style={{ color: "#fb923c", background: "#1e293b" }}>⚡ Yüksek</option>
                                            <option value="Orta" style={{ color: "#60a5fa", background: "#1e293b" }}>🔵 Orta</option>
                                            <option value="Düşük" style={{ color: "#9ca3af", background: "#1e293b" }}>⚪ Düşük</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>Atanan Personel</label>
                                        <select
                                            value={req.assignee || "Atanmamış"}
                                            onChange={(e) => handleAssigneeChange(req._id, e.target.value)}
                                            style={{
                                                width: "100%", padding: "8px 10px", background: "#0f172a",
                                                border: "1px solid #334155", borderRadius: "8px", color: (req.assignee && req.assignee !== "Atanmamış") ? "#f8fafc" : "#64748b",
                                                outline: "none", fontSize: "13px", cursor: "pointer", fontWeight: 600
                                            }}
                                        >
                                            <option value="Atanmamış" style={{ color: "#64748b", background: "#1e293b" }}>Atanmamış</option>
                                            {IT_STAFF.map(staff => (
                                                <option key={staff} value={staff} style={{ color: "#f8fafc", background: "#1e293b" }}>{staff}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Footer of card */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #334155", paddingTop: "16px", flexWrap: "wrap", gap: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiUser /> {req.createdBy}</span>
                                        <span>•</span>
                                        <span>{new Date(req.createdAt).toLocaleString("tr-TR")}</span>
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => handleDelete(req._id)}
                                            style={{ background: "rgba(239,68,68,0.1)", border: "none", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}
                                            title="Talebi Sil"
                                        >
                                            <FiTrash2 color="#ef4444" size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal for adding a new IT request */}
            {isAddModalOpen && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(15, 23, 42, 0.75)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 1000,
                    backdropFilter: "blur(4px)"
                }}>
                    <div style={{
                        background: "#1e293b", border: "1px solid #334155",
                        borderRadius: "16px", width: "100%", maxWidth: "500px",
                        padding: "28px", color: "white", position: "relative",
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)"
                    }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 20px 0" }}>Yeni IT Destek Talebi</h2>
                        
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "6px" }}>Talep Başlığı</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Örn: Yazıcı bağlantısı yapılamıyor"
                                    style={{
                                        width: "100%", padding: "10px", background: "#0f172a",
                                        border: "1px solid #334155", borderRadius: "8px", color: "white",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "6px" }}>Kategori</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                        style={{
                                            width: "100%", padding: "10px", background: "#0f172a",
                                            border: "1px solid #334155", borderRadius: "8px", color: "white",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <option value="Yazılım">Yazılım</option>
                                        <option value="Donanım">Donanım</option>
                                        <option value="Yetkilendirme">Yetkilendirme</option>
                                        <option value="Ağ/İnternet">Ağ/İnternet</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "6px" }}>Öncelik Seviyesi</label>
                                    <select
                                        value={form.priority}
                                        onChange={e => setForm({ ...form, priority: e.target.value })}
                                        style={{
                                            width: "100%", padding: "10px", background: "#0f172a",
                                            border: "1px solid #334155", borderRadius: "8px", color: "white",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <option value="Düşük">Düşük</option>
                                        <option value="Orta">Orta</option>
                                        <option value="Yüksek">Yüksek</option>
                                        <option value="Kritik">Kritik</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "6px" }}>Sorun/Talep Açıklaması</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Lütfen sorunu veya talebinizi detaylıca açıklayınız..."
                                    style={{
                                        width: "100%", padding: "10px", background: "#0f172a",
                                        border: "1px solid #334155", borderRadius: "8px", color: "white",
                                        fontFamily: "inherit", boxSizing: "border-box", resize: "none"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ padding: "10px 18px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "white", cursor: "pointer" }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "10px 18px", borderRadius: "8px", background: "#ef4444", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}
                                >
                                    Talebi Gönder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

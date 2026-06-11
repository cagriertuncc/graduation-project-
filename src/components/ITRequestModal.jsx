import { useState, useEffect } from "react";
import { FiCpu, FiX, FiCheck, FiList, FiPlus, FiAlertCircle, FiClock, FiCheckCircle } from "react-icons/fi";
import { itRequestsApi } from "../services/api";
import toast from "react-hot-toast";

const inp = {
    width: "100%", padding: "10px 14px",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, color: "#1e293b", fontSize: 13,
    fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box",
};

export default function ITRequestModal({ onClose }) {
    const [activeTab, setActiveTab] = useState("create"); // "create" or "list"
    const [myRequests, setMyRequests] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    const [form, setForm] = useState({
        title: "",
        category: "Yazılım",
        priority: "Orta",
        description: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Fetch user's requests when opening the list tab
    useEffect(() => {
        if (activeTab === "list") {
            fetchMyRequests();
        }
    }, [activeTab]);

    const fetchMyRequests = async () => {
        setLoadingList(true);
        try {
            const data = await itRequestsApi.getMy();
            setMyRequests(data || []);
        } catch (err) {
            console.error("IT requests fetch error:", err);
            toast.error("Geçmiş talepler yüklenemedi: " + err.message);
        } finally {
            setLoadingList(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            setError("Lütfen gerekli tüm alanları doldurun.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            await itRequestsApi.create(form);
            toast.success("IT destek talebi başarıyla oluşturuldu.");
            setForm({ title: "", category: "Yazılım", priority: "Orta", description: "" });
            setActiveTab("list"); // Switch to list to see the created ticket
        } catch (err) {
            setError(err.message || "Talep oluşturulurken bir hata oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Çözüldü":
                return { bg: "#e6fbf4", text: "#10b981", icon: <FiCheckCircle style={{ marginRight: 4 }} /> };
            case "İnceleniyor":
                return { bg: "#fffbeb", text: "#f59e0b", icon: <FiClock style={{ marginRight: 4 }} /> };
            default:
                return { bg: "#fef2f2", text: "#ef4444", icon: <FiAlertCircle style={{ marginRight: 4 }} /> };
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Kritik": return "#ef4444";
            case "Yüksek": return "#f97316";
            case "Orta": return "#3b82f6";
            default: return "#94a3b8";
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: "white", borderRadius: 24, padding: 36, width: 540, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 72px rgba(0,0,0,0.25)", boxSizing: "border-box" }}>
                
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
                        <FiCpu color="#ef4444" size={20} /> IT & Altyapı Desteği
                    </h3>
                    <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "7px 8px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}><FiX size={14} /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 10, marginBottom: 20 }}>
                    <button
                        onClick={() => setActiveTab("create")}
                        style={{
                            flex: 1, padding: "8px 12px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                            background: activeTab === "create" ? "white" : "transparent",
                            color: activeTab === "create" ? "#1e293b" : "#64748b",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            boxShadow: activeTab === "create" ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                        }}
                    >
                        <FiPlus size={14} /> Yeni Destek Talebi
                    </button>
                    <button
                        onClick={() => setActiveTab("list")}
                        style={{
                            flex: 1, padding: "8px 12px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                            background: activeTab === "list" ? "white" : "transparent",
                            color: activeTab === "list" ? "#1e293b" : "#64748b",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            boxShadow: activeTab === "list" ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                        }}
                    >
                        <FiList size={14} /> Taleplerim
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 10 }}>
                    {activeTab === "create" ? (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Talep Başlığı</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Örn: Barkod tarayıcı bilgisayarı görmüyor"
                                    style={inp}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Kategori</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                        style={inp}
                                    >
                                        <option value="Yazılım">Yazılım</option>
                                        <option value="Donanım">Donanım</option>
                                        <option value="Yetkilendirme">Yetkilendirme</option>
                                        <option value="Ağ/İnternet">Ağ/İnternet</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Öncelik</label>
                                    <select
                                        value={form.priority}
                                        onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                        style={inp}
                                    >
                                        <option value="Düşük">Düşük</option>
                                        <option value="Orta">Orta</option>
                                        <option value="Yüksek">Yüksek</option>
                                        <option value="Kritik">Kritik</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Açıklama</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Lütfen yaşadığınız sorunu veya talebinizi detaylı olarak açıklayın..."
                                    style={{ ...inp, resize: "none", lineHeight: 1.5 }}
                                />
                            </div>

                            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "#ef4444" }}>{error}</div>}

                            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 11, color: "#64748b", fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13 }}>İptal</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: 12, background: submitting ? "#cbd5e1" : "#ef4444", border: "none", borderRadius: 11, color: "white", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}>
                                    {submitting ? "Gönderiliyor..." : <><FiCheck size={14} /> Talebi Gönder</>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {loadingList ? (
                                <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: 13 }}>Yükleniyor...</div>
                            ) : myRequests.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>Henüz açılmış bir destek talebiniz bulunmuyor.</div>
                            ) : (
                                myRequests.map(req => {
                                    const badge = getStatusStyle(req.status);
                                    return (
                                        <div key={req._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "#64748b" }}>{req.requestId}</span>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: getPriorityColor(req.priority) }}>
                                                        {req.priority} Öncelik
                                                    </span>
                                                    <span style={{
                                                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                        background: badge.bg, color: badge.text, display: "inline-flex", alignItems: "center"
                                                    }}>
                                                        {badge.icon} {req.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{req.title}</h4>
                                            <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{req.description}</p>
                                            
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf2f7", paddingTop: 8, marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
                                                <span>Atanan: <strong style={{ color: "#475569" }}>{req.assignee}</strong></span>
                                                <span>{new Date(req.createdAt).toLocaleDateString("tr-TR")}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { FiBell, FiX, FiInfo, FiAlertTriangle, FiAlertCircle } from "react-icons/fi";
import { adminApi } from "../services/api";
import toast from "react-hot-toast";

export default function AnnouncementsModal({ onClose }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getActiveAnnouncements();
            setAnnouncements(data || []);
        } catch (err) {
            console.error("Announcements fetch error:", err);
            toast.error("Duyurular yüklenemedi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTypeDetails = (type) => {
        switch (type) {
            case "critical":
                return { 
                    bg: "#fef2f2", 
                    text: "#ef4444", 
                    border: "#fecaca", 
                    label: "Kritik",
                    icon: <FiAlertCircle style={{ marginRight: 4 }} /> 
                };
            case "warning":
                return { 
                    bg: "#fffbeb", 
                    text: "#d97706", 
                    border: "#fef3c7", 
                    label: "Uyarı",
                    icon: <FiAlertTriangle style={{ marginRight: 4 }} /> 
                };
            default:
                return { 
                    bg: "#eff6ff", 
                    text: "#3b82f6", 
                    border: "#bfdbfe", 
                    label: "Bilgi",
                    icon: <FiInfo style={{ marginRight: 4 }} /> 
                };
        }
    };

    return (
        <div style={{ 
            position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            zIndex: 9999, backdropFilter: "blur(8px)" 
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            
            <div style={{ 
                background: "white", borderRadius: 24, padding: 36, 
                width: 550, maxHeight: "80vh", display: "flex", 
                flexDirection: "column", boxShadow: "0 32px 72px rgba(15, 23, 42, 0.15)", 
                border: "1px solid #f1f5f9", boxSizing: "border-box" 
            }}>
                
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
                        <FiBell color="#ef4444" size={20} /> Hastane Duyuruları
                    </h3>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            background: "#f8fafc", border: "1px solid #e2e8f0", 
                            borderRadius: 9, padding: "7px 8px", cursor: "pointer", 
                            color: "#64748b", display: "flex", alignItems: "center",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; }}
                    >
                        <FiX size={14} />
                    </button>
                </div>

                {/* Announcement List */}
                <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 12 }}>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#ef4444", animation: "spin 0.8s linear infinite" }} />
                            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Yükleniyor...</div>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                            <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📢</span>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Aktif duyuru bulunmuyor.</div>
                        </div>
                    ) : (
                        announcements.map((anon) => {
                            const badge = getTypeDetails(anon.type);
                            const isExpanded = selectedId === anon._id;
                            const dateStr = new Date(anon.createdAt).toLocaleDateString("tr-TR", { 
                                day: "numeric", 
                                month: "long", 
                                year: "numeric", 
                                hour: "2-digit", 
                                minute: "2-digit" 
                            });

                            return (
                                <div 
                                    key={anon._id} 
                                    onClick={() => setSelectedId(isExpanded ? null : anon._id)}
                                    style={{ 
                                        border: "1px solid #e2e8f0", 
                                        borderRadius: 16, 
                                        padding: 16, 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        gap: 8, 
                                        background: isExpanded ? "#fff" : "#f8fafc",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        boxShadow: isExpanded ? "0 10px 15px -3px rgba(0,0,0,0.05)" : "none",
                                        borderColor: isExpanded ? "#cbd5e1" : "#e2e8f0"
                                    }}
                                    onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                    onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1e293b", flex: 1 }}>
                                            {anon.title}
                                        </h4>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                                            background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
                                            display: "inline-flex", alignItems: "center", flexShrink: 0
                                        }}>
                                            {badge.icon} {badge.label}
                                        </span>
                                    </div>
                                    
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: 13, 
                                        color: "#475569", 
                                        lineHeight: 1.5,
                                        whiteSpace: isExpanded ? "pre-wrap" : "nowrap",
                                        overflow: isExpanded ? "visible" : "hidden",
                                        textOverflow: isExpanded ? "clip" : "ellipsis"
                                    }}>
                                        {anon.message}
                                    </p>
                                    
                                    <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center", 
                                        borderTop: "1px solid #f1f5f9", 
                                        paddingTop: 8, 
                                        marginTop: 4, 
                                        fontSize: 11, 
                                        color: "#94a3b8" 
                                    }}>
                                        <span>Yayınlayan: <strong style={{ color: "#475569" }}>Başhekimlik</strong></span>
                                        <span>{dateStr}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}

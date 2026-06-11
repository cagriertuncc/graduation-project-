import { useState, useEffect } from "react";
import { FiCheck, FiX, FiCalendar, FiClock, FiRefreshCw } from "react-icons/fi";
import { useIKAuth } from "../../context/IKAuthContext";
import { C, StatCard, AVA_COLORS } from "./IKConstants";

const API = "http://localhost:5001";

function DurumBadge({ durum }) {
    const s = {
        "Onaylı": { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
        "Beklemede": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        "Reddedildi": { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    }[durum] || { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)" };
    return (
        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}28`, whiteSpace: "nowrap" }}>{durum}</span>
    );
}

function formatDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function IKIzinYonetimi() {
    const { token } = useIKAuth();
    const [izinler, setIzinler] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("Tümü");

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/leave-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setIzinler(data);
        } catch (e) {
            console.error("İzin talepleri alınamadı:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const updateDurum = async (id, durum) => {
        try {
            const res = await fetch(`${API}/api/leave-requests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ durum }),
            });
            if (res.ok) {
                setIzinler(p => p.map(i => i._id === id ? { ...i, durum } : i));
            }
        } catch (e) {
            console.error("Güncelleme hatası:", e);
        }
    };

    const filtered = filter === "Tümü" ? izinler : izinler.filter(i => i.durum === filter);
    const bekleyen = izinler.filter(i => i.durum === "Beklemede");

    return (
        <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <StatCard icon={<FiCalendar size={20} />} label="Toplam Talep" value={izinler.length} color="#6366f1" />
                <StatCard icon={<FiClock size={20} />} label="Bekleyen" value={bekleyen.length} sub={bekleyen.length > 0 ? "Onay gerekiyor" : ""} color="#f59e0b" />
                <StatCard icon={<FiCheck size={20} />} label="Onaylı" value={izinler.filter(i => i.durum === "Onaylı").length} color="#22c55e" />
                <StatCard icon={<FiX size={20} />} label="Reddedilen" value={izinler.filter(i => i.durum === "Reddedildi").length} color="#ef4444" />
            </div>

            {/* Urgent banner */}
            {bekleyen.length > 0 && (
                <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "14px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>⏰</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{bekleyen.length} Bekleyen Talep</div>
                        <div style={{ fontSize: 12, color: "rgba(245,158,11,0.6)", marginTop: 2 }}>{bekleyen.map(b => b.doctorName).join(", ")} · Onay bekliyor</div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                {["Tümü", "Beklemede", "Onaylı", "Reddedildi"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: "8px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif",
                        background: filter === f ? "linear-gradient(135deg,#4f46e5,#6366f1)" : "rgba(255,255,255,0.05)",
                        color: filter === f ? "white" : C.muted,
                        boxShadow: filter === f ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                    }}>{f}{filter === f ? ` (${filtered.length})` : ""}</button>
                ))}
                <button onClick={fetchLeaves} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 10px", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: "Inter,sans-serif", fontWeight: 600 }}>
                    <FiRefreshCw size={12} /> Yenile
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted, fontSize: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <div>Yükleniyor...</div>
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted, fontSize: 14 }}>
                    {filter === "Tümü" ? "Henüz izin talebi yok." : `${filter} durumunda talep bulunamadı.`}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filtered.map((iz, i) => (
                        <div key={iz._id} style={{
                            background: C.card, border: `1px solid ${iz.durum === "Beklemede" ? "rgba(245,158,11,0.25)" : C.border}`,
                            borderRadius: 16, padding: "18px 22px",
                            display: "flex", alignItems: "center", gap: 16,
                            transition: "all 0.2s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
                            onMouseLeave={e => e.currentTarget.style.background = C.card}
                        >
                            {/* Avatar */}
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: AVA_COLORS[i % AVA_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0 }}>
                                {(iz.doctorName || "?")[0]}
                            </div>

                            {/* Name + type */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{iz.doctorName}</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{iz.tip}</div>
                                {iz.aciklama && <div style={{ fontSize: 11, color: C.dim, marginTop: 3, fontStyle: "italic" }}>"{iz.aciklama}"</div>}
                            </div>

                            {/* Dates */}
                            <div style={{ textAlign: "center", minWidth: 110 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{formatDate(iz.baslangic)}</div>
                                <div style={{ fontSize: 10, color: C.dim, margin: "3px 0" }}>→</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{formatDate(iz.bitis)}</div>
                            </div>

                            {/* Days */}
                            <div style={{ textAlign: "center", minWidth: 50 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: "#818cf8" }}>{iz.gun}</div>
                                <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.04em" }}>Gün</div>
                            </div>

                            <DurumBadge durum={iz.durum} />

                            {/* Actions */}
                            {iz.durum === "Beklemede" ? (
                                <div style={{ display: "flex", gap: 7 }}>
                                    <button onClick={() => updateDurum(iz._id, "Onaylı")} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 9, padding: "8px 14px", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>
                                        <FiCheck size={13} /> Onayla
                                    </button>
                                    <button onClick={() => updateDurum(iz._id, "Reddedildi")} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 9, padding: "8px 14px", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>
                                        <FiX size={13} /> Reddet
                                    </button>
                                </div>
                            ) : (
                                <div style={{ width: 130 }} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

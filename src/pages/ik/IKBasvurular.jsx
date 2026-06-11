import { useState, useEffect } from "react";
import { FiSearch, FiCheck, FiX, FiBriefcase } from "react-icons/fi";
import { C, DurumBadge, AVA_COLORS } from "./IKConstants";

export default function IKBasvurular() {
    const [basvurular, setBasvurular] = useState([]);
    const [filter, setFilter] = useState("Tümü");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchApps = async () => {
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/hr/applications", {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) setBasvurular(await res.json());
        } catch (err) { console.error("Başvurular alınamadı", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchApps(); }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const res = await fetch(`http://localhost:5001/api/hr/applications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...token ? { Authorization: `Bearer ${token}` } : {} },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchApps();
        } catch (err) { console.error("Durum güncellenemedi", err); }
    };

    const statuses = ["Tümü", "Yeni", "İnceleniyor", "Mülakata Çağrıldı", "Kabul", "Ret"];
    const filtered = basvurular.filter(b => {
        const matchF = filter === "Tümü" || b.status === filter;
        const matchS = b.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
            b.jobId?.title?.toLowerCase().includes(search.toLowerCase());
        return matchF && matchS;
    });

    if (loading) return <div style={{ color: "white", padding: 20 }}>Yükleniyor...</div>;

    return (
        <div>
            {/* Filter pills + search */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", marginRight: 4 }}>
                    <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Aday ara..."
                        style={{ padding: "9px 14px 9px 34px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", width: 200 }} />
                </div>
                {statuses.map(s => (
                    <button key={s} onClick={() => setFilter(s)} style={{
                        padding: "8px 15px", borderRadius: 999, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif",
                        background: filter === s ? C.grad : "rgba(255,255,255,0.05)",
                        color: filter === s ? "white" : C.muted,
                        boxShadow: filter === s ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                    }}>{s} {filter === s && `(${filtered.length})`}</button>
                ))}
            </div>

            {/* Kanban-style cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((b, i) => (
                    <div key={b._id} style={{
                        background: selected?._id === b._id ? C.cardHover : C.card, border: `1px solid ${selected?._id === b._id ? "rgba(99,102,241,0.5)" : C.border}`,
                        borderRadius: 16, padding: "18px 22px",
                        display: "flex", flexDirection: "column", gap: 16,
                        transition: "all 0.2s", cursor: "pointer",
                    }}
                        onMouseEnter={e => { if (selected?._id !== b._id) { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.background = C.cardHover; } }}
                        onMouseLeave={e => { if (selected?._id !== b._id) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; } }}
                        onClick={() => setSelected(selected?._id === b._id ? null : b)}
                    >
                        {/* Main row */}
                        <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 16 }}>
                            {/* Avatar */}
                            <div style={{ width: 46, height: 46, borderRadius: "50%", background: AVA_COLORS[i % AVA_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "white", flexShrink: 0, boxShadow: `0 4px 12px rgba(99,102,241,0.25)` }}>
                                {b.applicantName ? b.applicantName[0].toUpperCase() : "?"}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{b.applicantName}</span>
                                    <span style={{ fontSize: 11, color: C.dim }}>·</span>
                                    <span style={{ fontSize: 11, color: C.muted }}>{b.experienceYears} yıl deneyim</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <FiBriefcase size={11} color={C.muted} />
                                    <span style={{ fontSize: 12, color: C.muted }}>{b.jobId?.title || "Bilinmiyor"}</span>
                                    <span style={{ fontSize: 11, color: C.dim }}>·</span>
                                    <span style={{ fontSize: 11, color: C.dim }}>{new Date(b.createdAt).toLocaleDateString("tr-TR")}</span>
                                </div>
                            </div>

                            {/* Score ring */}
                            <div style={{ textAlign: "center", minWidth: 52 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: "50%",
                                    background: (b.score || 0) >= 80 ? "rgba(34,197,94,0.12)" : (b.score || 0) >= 65 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.1)",
                                    border: `2px solid ${(b.score || 0) >= 80 ? "#22c55e" : (b.score || 0) >= 65 ? "#f59e0b" : "#ef4444"}40`,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                                }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: (b.score || 0) >= 80 ? "#22c55e" : (b.score || 0) >= 65 ? "#f59e0b" : "#ef4444" }}>{b.score || "N/A"}</span>
                                </div>
                                <div style={{ fontSize: 9, color: C.dim, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Puan</div>
                            </div>

                            <DurumBadge durum={b.status} />

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 6 }}>
                                {b.status !== "Kabul" && (
                                    <button onClick={e => { e.stopPropagation(); updateStatus(b._id, "Kabul"); }} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 9, padding: "8px 12px", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                                        <FiCheck size={13} /> Onayla
                                    </button>
                                )}
                                {b.status !== "Ret" && (
                                    <button onClick={e => { e.stopPropagation(); updateStatus(b._id, "Ret"); }} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 9, padding: "8px 10px", color: "#ef4444", cursor: "pointer" }}>
                                        <FiX size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {selected?._id === b._id && (
                            <div onClick={e => e.stopPropagation()} style={{
                                marginTop: 10, paddingTop: 16, borderTop: `1px dashed ${C.border}`,
                                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, cursor: "default"
                            }}>
                                <div>
                                    <h4 style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>İletişim Bilgileri</h4>
                                    <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>E-Posta: {b.email || "-"}</div>
                                    <div style={{ fontSize: 14, color: C.text }}>Telefon: {b.phone || "-"}</div>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>CV & Belgeler</h4>
                                    {b.cvUrl ? (
                                        <a href={b.cvUrl.startsWith("/uploads") ? `http://localhost:5001${b.cvUrl}` : b.cvUrl} target="_blank" rel="noreferrer" style={{
                                            display: "inline-block", background: C.grad, color: "white", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none"
                                        }}>
                                            CV Görüntüle / İndir
                                        </a>
                                    ) : (
                                        <div style={{ fontSize: 13, color: C.dim }}>CV Eklenmemiş</div>
                                    )}
                                </div>
                                {b.notes && (
                                    <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                                        <h4 style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Ön Yazı / Not</h4>
                                        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                            {b.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted, fontSize: 14 }}>
                    Bu kriterlere uygun başvuru bulunamadı.
                </div>
            )}
        </div>
    );
}

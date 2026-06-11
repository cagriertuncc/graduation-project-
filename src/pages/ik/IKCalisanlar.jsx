import { useState, useEffect } from "react";
import { FiSearch, FiMail, FiPhone, FiStar, FiX } from "react-icons/fi";
import { C, DurumBadge, AVA_COLORS } from "./IKConstants";

export default function IKCalisanlar() {
    const [calisanlar, setCalisanlar] = useState([]);
    const [search, setSearch] = useState("");
    const [depFilter, setDepFilter] = useState("Tümü");
    const [modal, setModal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmps = async () => {
            try {
                const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
                const res = await fetch("http://localhost:5001/api/hr/employees", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (res.ok) setCalisanlar(await res.json());
            } catch (err) { console.error("Çalışanlar alınamadı", err); }
            finally { setLoading(false); }
        };
        fetchEmps();
    }, []);

    const deps = ["Tümü", ...new Set(calisanlar.map(c => c.specialty))];
    const filtered = calisanlar.filter(c => {
        const matchS = c.name?.toLowerCase().includes(search.toLowerCase());
        const matchD = depFilter === "Tümü" || c.specialty === depFilter;
        return matchS && matchD;
    });

    if (loading) return <div style={{ color: "white", padding: 20 }}>Yükleniyor...</div>;

    return (
        <div>
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                    <FiSearch style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Çalışan ara..."
                        style={{ padding: "10px 14px 10px 36px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", width: 220 }} />
                </div>
                {deps.map(d => (
                    <button key={d} onClick={() => setDepFilter(d)} style={{
                        padding: "9px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif",
                        background: depFilter === d ? C.grad : "rgba(255,255,255,0.05)",
                        color: depFilter === d ? "white" : C.muted,
                        boxShadow: depFilter === d ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                    }}>{d}</button>
                ))}
                <div style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{filtered.length} çalışan</div>
            </div>

            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
                {filtered.map((c, i) => (
                    <div key={c.id} style={{
                        background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 18, padding: "22px",
                        transition: "all 0.22s", cursor: "pointer",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        onClick={() => setModal(c)}
                    >
                        {/* Top row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 50, height: 50, borderRadius: "50%", background: AVA_COLORS[i % AVA_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 800, color: "white", boxShadow: `0 4px 14px rgba(99,102,241,0.3)`, flexShrink: 0 }}>
                                    {c.name ? c.name[0].toUpperCase() : "?"}
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.title || c.role}</div>
                                </div>
                            </div>
                            <DurumBadge durum={c.status} />
                        </div>

                        {/* Tags */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                            <span style={{ fontSize: 11, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", padding: "3px 9px", borderRadius: 999, fontWeight: 700 }}>{c.specialty}</span>
                        </div>

                        {/* Footer */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 11, color: C.dim }}>↗ {new Date(c.joinDate).toLocaleDateString("tr-TR")}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <FiStar key={star} size={11} fill={star <= 4 ? C.yellow : "transparent"} color={star <= 4 ? C.yellow : "rgba(255,255,255,0.15)"} />
                                ))}
                                <span style={{ fontSize: 12, fontWeight: 800, color: C.text, marginLeft: 3 }}>4.0</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {modal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(6px)" }}
                    onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div style={{ background: "#0c0e1f", border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 24, padding: 36, width: 480, boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 60, height: 60, borderRadius: "50%", background: AVA_COLORS[calisanlar.indexOf(modal) % AVA_COLORS.length] || AVA_COLORS[0], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "white", boxShadow: "0 6px 20px rgba(99,102,241,0.35)" }}>
                                    {modal.name ? modal.name[0].toUpperCase() : "?"}
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{modal.name}</div>
                                    <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{modal.title || modal.role} · {modal.specialty}</div>
                                </div>
                            </div>
                            <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 10, padding: "8px 9px", color: C.muted, cursor: "pointer" }}><FiX size={16} /></button>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 22 }}>
                            {[
                                { l: "Performans", v: `4.0/5.0`, c: C.yellow },
                                { l: "Durum", v: modal.status, c: modal.status === "Aktif" ? "#22c55e" : "#f97316" },
                            ].map(s => (
                                <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>{s.l}</div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Contact */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <FiMail size={14} color="#818cf8" />
                                <span style={{ fontSize: 13, color: C.text }}>{modal.email}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 14 }}>📅</span>
                                <span style={{ fontSize: 13, color: C.text }}>Katılım: {new Date(modal.joinDate).toLocaleDateString("tr-TR")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

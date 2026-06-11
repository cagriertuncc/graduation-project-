import { useState, useEffect } from "react";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiX } from "react-icons/fi";
import { C, DurumBadge } from "./IKConstants";

export default function IKPersonelAlimi() {
    const [ilanlar, setIlanlar] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Tümü");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create", "edit", "view"
    const [selectedPosting, setSelectedPosting] = useState(null);
    const [loading, setLoading] = useState(true);

    const initialFormState = {
        title: "",
        department: "",
        type: "Tam Zamanlı",
        location: "Merkez Şube",
        description: "",
        requirements: "",
        status: "Aktif",
    };
    const [form, setForm] = useState(initialFormState);

    const fetchIlanlar = async () => {
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/hr/postings/all", {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) setIlanlar(await res.json());
        } catch (err) { console.error("İlanlar alınamadı", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchIlanlar(); }, []);

    const handleCreate = async () => {
        if (!form.title || !form.department || !form.description) {
            return alert("Lütfen Başlık, Departman ve İlan Açıklamasını doldurun.");
        }
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const payload = {
                ...form,
                requirements: form.requirements.split("\n").map(r => r.trim()).filter(Boolean)
            };
            const res = await fetch("http://localhost:5001/api/hr/postings", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...token ? { Authorization: `Bearer ${token}` } : {} },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowModal(false);
                setForm(initialFormState);
                fetchIlanlar();
            } else {
                const data = await res.json();
                alert("İlan oluşturulamadı: " + (data.error || "Bilinmeyen sunucu hatası."));
            }
        } catch (err) {
            console.error("İlan oluşturulamadı", err);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const handleUpdate = async () => {
        if (!form.title || !form.department || !form.description) {
            return alert("Lütfen Başlık, Departman ve İlan Açıklamasını doldurun.");
        }
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const payload = {
                ...form,
                requirements: form.requirements.split("\n").map(r => r.trim()).filter(Boolean)
            };
            const res = await fetch(`http://localhost:5001/api/hr/postings/${selectedPosting._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...token ? { Authorization: `Bearer ${token}` } : {} },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowModal(false);
                setSelectedPosting(null);
                setForm(initialFormState);
                fetchIlanlar();
            } else {
                const data = await res.json();
                alert("İlan güncellenemedi: " + (data.error || "Bilinmeyen sunucu hatası."));
            }
        } catch (err) {
            console.error("İlan güncellenemedi", err);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu ilanı ve bu ilana ait tüm başvuruları silmek istediğinize emin misiniz?")) return;
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const res = await fetch(`http://localhost:5001/api/hr/postings/${id}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                fetchIlanlar();
            } else {
                const data = await res.json();
                alert("İlan silinemedi: " + (data.error || "Bilinmeyen sunucu hatası."));
            }
        } catch (err) {
            console.error("İlan silinemedi", err);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const openCreateModal = () => {
        setModalMode("create");
        setForm(initialFormState);
        setSelectedPosting(null);
        setShowModal(true);
    };

    const openEditModal = (posting) => {
        setModalMode("edit");
        setSelectedPosting(posting);
        setForm({
            title: posting.title || "",
            department: posting.department || "",
            type: posting.type || "Tam Zamanlı",
            location: posting.location || "Merkez Şube",
            description: posting.description || "",
            requirements: Array.isArray(posting.requirements) ? posting.requirements.join("\n") : "",
            status: posting.status || "Aktif",
        });
        setShowModal(true);
    };

    const openViewModal = (posting) => {
        setModalMode("view");
        setSelectedPosting(posting);
        setForm({
            title: posting.title || "",
            department: posting.department || "",
            type: posting.type || "Tam Zamanlı",
            location: posting.location || "Merkez Şube",
            description: posting.description || "",
            requirements: Array.isArray(posting.requirements) ? posting.requirements.join("\n") : "",
            status: posting.status || "Aktif",
        });
        setShowModal(true);
    };

    const filtered = ilanlar.filter(i => {
        const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.department.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "Tümü" || i.status === filter;
        return matchSearch && matchFilter;
    });

    if (loading) return <div style={{ color: "white", padding: 20 }}>Yükleniyor...</div>;

    const inp = {
        width: "100%", padding: "11px 14px",
        background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
        borderRadius: 10, color: C.text, fontSize: 13,
        fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box",
    };

    return (
        <div>
            {/* Stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
                {[
                    { l: "Toplam İlan", v: ilanlar.length, color: "#6366f1" },
                    { l: "Aktif", v: ilanlar.filter(i => i.status === "Aktif").length, color: "#22c55e" },
                    { l: "Kapalı", v: ilanlar.filter(i => i.status === "Kapalı").length, color: "#ef4444" },
                ].map(s => (
                    <div key={s.l} style={{ background: C.card, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: C.muted }}>{s.l}</span>
                        <span style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.v}</span>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pozisyon veya departman ara..."
                        style={{ ...inp, paddingLeft: 40 }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {["Tümü", "Aktif", "Kapalı"].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                            fontFamily: "Inter,sans-serif",
                            background: filter === f ? `linear-gradient(135deg,#4f46e5,#6366f1)` : "rgba(255,255,255,0.05)",
                            color: filter === f ? "white" : C.muted,
                            boxShadow: filter === f ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                        }}>{f}</button>
                    ))}
                </div>
                <button onClick={openCreateModal} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 18px", background: C.grad,
                    border: "none", borderRadius: 10, color: "white", fontWeight: 700,
                    fontSize: 13, cursor: "pointer", fontFamily: "Inter,sans-serif",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
                }}>
                    <FiPlus size={15} /> Yeni İlan
                </button>
            </div>

            {/* Table */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}` }}>
                            {["Pozisyon", "Departman", "Tip", "Son Güncelleme", "Başvuru Sayısı", "Durum", ""].map(h => (
                                <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((il, i) => (
                            <tr key={il._id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <td style={{ padding: "14px 18px" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{il.title}</div>
                                </td>
                                <td style={{ padding: "14px 18px" }}>
                                    <span style={{ fontSize: 12, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", padding: "3px 9px", borderRadius: 999, fontWeight: 600 }}>{il.department}</span>
                                </td>
                                <td style={{ padding: "14px 18px", fontSize: 12, color: C.muted }}>{il.type}</td>
                                <td style={{ padding: "14px 18px", fontSize: 12, color: C.muted }}>{new Date(il.updatedAt || il.createdAt).toLocaleDateString("tr-TR")}</td>
                                <td style={{ padding: "14px 18px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ height: 5, width: 60, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                                            <div style={{ width: `${Math.min(100, ((il.applicationCount || 0) / 35) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#4f46e5,#818cf8)", borderRadius: 999 }} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: "#a5b4fc" }}>{il.applicationCount || 0}</span>
                                    </div>
                                </td>
                                <td style={{ padding: "14px 18px" }}><DurumBadge durum={il.status} /></td>
                                <td style={{ padding: "14px 18px" }}>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => openViewModal(il)} title="Görüntüle" style={{ background: "rgba(6,182,212,0.1)", border: "none", borderRadius: 8, padding: "6px 8px", color: "#06b6d4", cursor: "pointer" }}><FiEye size={14} /></button>
                                        <button onClick={() => openEditModal(il)} title="Düzenle" style={{ background: "rgba(99,102,241,0.1)", border: "none", borderRadius: 8, padding: "6px 8px", color: "#a5b4fc", cursor: "pointer" }}><FiEdit2 size={14} /></button>
                                        <button onClick={() => handleDelete(il._id)} title="Sil" style={{ background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 8, padding: "6px 8px", color: "#ef4444", cursor: "pointer" }}><FiTrash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}
                    onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div style={{ background: "#0c0e1f", border: `1px solid ${C.border}`, borderRadius: 22, padding: 36, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.7)", position: "relative" }}>
                        
                        <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: C.muted, cursor: "pointer" }}>
                            <FiX size={20} />
                        </button>

                        <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 24, letterSpacing: "-0.01em" }}>
                            {modalMode === "create" ? "🎯 Yeni İş İlanı Oluştur" : modalMode === "edit" ? "✏️ İş İlanını Düzenle" : "👁️ İş İlanı Detayları"}
                        </h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Pozisyon Adı</label>
                                <input type="text" placeholder="örn. Kardiyoloji Uzmanı" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    disabled={modalMode === "view"} style={inp} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Departman</label>
                                <input type="text" placeholder="örn. Kardiyoloji" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                                    disabled={modalMode === "view"} style={inp} />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Konum</label>
                                <input type="text" placeholder="Merkez Şube" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                    disabled={modalMode === "view"} style={inp} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Çalışma Tipi</label>
                                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} disabled={modalMode === "view"} style={{ ...inp, appearance: "none" }}>
                                    {["Tam Zamanlı", "Yarı Zamanlı", "Sözleşmeli", "Stajyer"].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {modalMode !== "create" && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>İlan Durumu</label>
                                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} disabled={modalMode === "view"} style={{ ...inp, appearance: "none" }}>
                                    {["Aktif", "Kapalı"].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>İlan Açıklaması</label>
                            <textarea rows="4" placeholder="İlanın genel tanımını ve görevlerini buraya girin..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                disabled={modalMode === "view"} style={{ ...inp, resize: "vertical" }} />
                        </div>

                        <div style={{ marginBottom: 26 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
                                Aranan Nitelikler (Her satıra bir özellik)
                            </label>
                            <textarea rows="4" placeholder="örn. En az 5 yıl uzmanlık deneyimi olan&#10;İletişim becerisi yüksek" value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
                                disabled={modalMode === "view"} style={{ ...inp, resize: "vertical" }} />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            {modalMode === "view" ? (
                                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 13, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 11, color: C.muted, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13 }}>Kapat</button>
                            ) : (
                                <>
                                    <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 13, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 11, color: C.muted, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13 }}>İptal</button>
                                    <button onClick={modalMode === "create" ? handleCreate : handleUpdate} style={{ flex: 2, padding: 13, background: C.grad, border: "none", borderRadius: 11, color: "white", fontWeight: 800, cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>
                                        {modalMode === "create" ? "İlanı Yayınla 🚀" : "Değişiklikleri Kaydet 💾"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { procedureNotesApi, patientsApi } from "../services/api";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import {
    FiPlus, FiCalendar, FiChevronRight,
    FiCheckCircle, FiClock, FiTrash2, FiXCircle,
    FiScissors, FiAlertTriangle
} from "react-icons/fi";

const PROCEDURE_TYPES = ["Ameliyat", "Küçük Cerrahi", "Biyopsi", "Endoskopi", "Enjeksiyon", "Pansuman", "Diğer"];
const ANESTHESIA_TYPES = ["Genel", "Lokal", "Spinal", "Sedasyon", "Yok", "Diğer"];
const STATUS_OPTIONS = ["planlandı", "tamamlandı", "iptal"];

const procedureTypeConfig = {
    "Ameliyat": { color: "#ef4444", bg: "#fef2f2", emoji: "🔪" },
    "Küçük Cerrahi": { color: "#f97316", bg: "#fff7ed", emoji: "✂️" },
    "Biyopsi": { color: "#8b5cf6", bg: "#f5f3ff", emoji: "🔬" },
    "Endoskopi": { color: "#06b6d4", bg: "#ecfeff", emoji: "🔍" },
    "Enjeksiyon": { color: "#10b981", bg: "#ecfdf5", emoji: "💉" },
    "Pansuman": { color: "#f59e0b", bg: "#fffbeb", emoji: "🩹" },
    "Diğer": { color: "#6b7280", bg: "#f9fafb", emoji: "🏥" },
};

const statusConfig = {
    "tamamlandı": { color: "#10b981", bg: "#ecfdf5", icon: <FiCheckCircle size={11} />, label: "Tamamlandı" },
    "planlandı": { color: "#3b82f6", bg: "#eff6ff", icon: <FiClock size={11} />, label: "Planlandı" },
    "iptal": { color: "#ef4444", bg: "#fef2f2", icon: <FiXCircle size={11} />, label: "İptal" },
};

export default function ProcedureNotesPage() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [newNote, setNewNote] = useState({
        patientId: "", procedureType: "Ameliyat", procedureName: "",
        indication: "", technique: "", findings: "", complications: "",
        anesthesia: "Genel", duration: "", status: "tamamlandı",
        postOpInstructions: "", notes: "",
    });

    const fetchNotes = () => {
        procedureNotesApi.getAll().then(data => {
            setNotes(data);
            setLoading(false);
        }).catch(err => {
            console.error("İşlem notları yüklenemedi:", err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchNotes(); }, []);

    const openModal = () => {
        setNewNote({
            patientId: "", procedureType: "Ameliyat", procedureName: "",
            indication: "", technique: "", findings: "", complications: "",
            anesthesia: "Genel", duration: "", status: "tamamlandı",
            postOpInstructions: "", notes: "",
        });
        patientsApi.getAll().then(setPatientsList).catch(console.error);
        setIsModalOpen(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await procedureNotesApi.create(newNote);
            setIsModalOpen(false);
            fetchNotes();
        } catch (err) {
            alert("İşlem notu oluşturulamadı: " + err.message);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Bu işlem notunu silmek istediğinize emin misiniz?")) return;
        try {
            await procedureNotesApi.delete(id);
            fetchNotes();
        } catch (err) {
            alert("Silinemedi: " + err.message);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString("tr-TR", {
        day: "numeric", month: "long", year: "numeric",
    });

    const getPatientName = (item) => {
        if (item.patientId && typeof item.patientId === "object") return item.patientId.name;
        return "Bilinmeyen";
    };

    const getPatientInfo = (item) => {
        if (item.patientId && typeof item.patientId === "object") {
            const p = item.patientId;
            return `${p.age} yaş • ${p.gender}${p.bloodType ? " • " + p.bloodType : ""}`;
        }
        return "";
    };

    const getPatientId = (item) => {
        if (item.patientId && typeof item.patientId === "object") return item.patientId._id;
        return item.patientId;
    };

    const filtered = notes.filter(n => {
        const name = getPatientName(n).toLowerCase();
        const proc = (n.procedureName || "").toLowerCase();
        const type = (n.procedureType || "").toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || proc.includes(q) || type.includes(q);
    });

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div style={{ fontSize: "16px", color: "#9ca3af" }}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Ameliyat / İşlem Notları</h1>
                <p>Yapılan prosedür ve ameliyat kayıtlarını yönetin</p>
            </div>

            <div className="header-bar">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Hasta adı, işlem adı veya tür ara..." />
                <button className="btn btn-primary" onClick={openModal}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <FiPlus size={15} /> Yeni İşlem Notu
                </button>
            </div>

            {/* ═══ STATS CARDS ═══ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {[
                    { label: "Toplam İşlem", value: notes.length, color: "#ef4444", bg: "#fef2f2" },
                    { label: "Tamamlanan", value: notes.filter(n => n.status === "tamamlandı").length, color: "#10b981", bg: "#ecfdf5" },
                    { label: "Planlanan", value: notes.filter(n => n.status === "planlandı").length, color: "#3b82f6", bg: "#eff6ff" },
                    { label: "Ameliyat", value: notes.filter(n => n.procedureType === "Ameliyat").length, color: "#8b5cf6", bg: "#f5f3ff" },
                ].map((stat, i) => (
                    <div key={i} className="glass-card animate-fade-in" style={{
                        animationDelay: `${i * 60}ms`, padding: "16px 20px",
                        display: "flex", alignItems: "center", gap: "14px",
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: "10px", background: stat.bg,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "18px", fontWeight: 800, color: stat.color,
                        }}>
                            {stat.value}
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280" }}>{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* ═══ NOTES LIST ═══ */}
            {filtered.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map((item, i) => {
                        const st = statusConfig[item.status] || statusConfig["tamamlandı"];
                        const pt = procedureTypeConfig[item.procedureType] || procedureTypeConfig["Diğer"];
                        return (
                            <div key={item._id} className="glass-card animate-fade-in"
                                style={{
                                    animationDelay: `${i * 60}ms`, padding: "20px 24px",
                                    cursor: "pointer", transition: "all 0.2s",
                                }}
                                onClick={() => navigate(`/patients/${getPatientId(item)}`)}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "translateX(4px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = "translateX(0)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: "12px",
                                            background: `linear-gradient(135deg, ${pt.color}, ${pt.color}dd)`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "white", flexShrink: 0, fontSize: "18px",
                                        }}>
                                            {pt.emoji}
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                                                    {getPatientName(item)}
                                                </span>
                                                <span style={{
                                                    fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                                                    borderRadius: "6px", background: pt.bg, color: pt.color,
                                                }}>
                                                    {item.procedureType}
                                                </span>
                                                <span style={{
                                                    fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                                                    borderRadius: "6px", background: st.bg, color: st.color,
                                                    display: "flex", alignItems: "center", gap: "3px",
                                                }}>
                                                    {st.icon} {st.label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                                {getPatientInfo(item)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button onClick={(e) => handleDelete(item._id, e)}
                                            style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                color: "#d1d5db", padding: "4px", borderRadius: "6px",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                                            onMouseLeave={e => e.currentTarget.style.color = "#d1d5db"}
                                            title="Sil"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#9ca3af" }}>
                                            <FiCalendar size={12} />
                                            {formatDate(item.date || item.createdAt)}
                                            <FiChevronRight size={14} style={{ color: "#d1d5db" }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Procedure Name & Info */}
                                <div style={{
                                    padding: "10px 14px", borderRadius: "10px", background: "#fafafa",
                                    borderLeft: `3px solid ${pt.color}`, marginBottom: "12px",
                                }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                                        {item.procedureName}
                                    </div>
                                    {item.indication && (
                                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                            <strong>Endikasyon:</strong> {item.indication}
                                        </div>
                                    )}
                                </div>

                                {/* Detail cards */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "8px" }}>
                                    {item.technique && (
                                        <div style={{
                                            padding: "10px 14px", borderRadius: "10px",
                                            background: "white", border: "1px solid #f3f4f6",
                                        }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>
                                                ⚙️ Teknik
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}>
                                                {item.technique}
                                            </div>
                                        </div>
                                    )}
                                    {item.findings && (
                                        <div style={{
                                            padding: "10px 14px", borderRadius: "10px",
                                            background: "white", border: "1px solid #f3f4f6",
                                        }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>
                                                🔍 Bulgular
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}>
                                                {item.findings}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tags row */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {item.anesthesia && item.anesthesia !== "Yok" && (
                                        <div style={{
                                            padding: "5px 10px", borderRadius: "8px",
                                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                                            fontSize: "11px", fontWeight: 600, color: "#15803d",
                                        }}>
                                            💉 {item.anesthesia} Anestezi
                                        </div>
                                    )}
                                    {item.duration && (
                                        <div style={{
                                            padding: "5px 10px", borderRadius: "8px",
                                            background: "#eff6ff", border: "1px solid #bfdbfe",
                                            fontSize: "11px", fontWeight: 600, color: "#1d4ed8",
                                        }}>
                                            ⏱️ {item.duration}
                                        </div>
                                    )}
                                    {item.complications && (
                                        <div style={{
                                            padding: "5px 10px", borderRadius: "8px",
                                            background: "#fef2f2", border: "1px solid #fecaca",
                                            fontSize: "11px", fontWeight: 600, color: "#dc2626",
                                            display: "flex", alignItems: "center", gap: "4px",
                                        }}>
                                            <FiAlertTriangle size={11} /> Komplikasyon: {item.complications}
                                        </div>
                                    )}
                                </div>

                                {item.postOpInstructions && (
                                    <div style={{
                                        marginTop: "10px", padding: "8px 12px", borderRadius: "8px",
                                        background: "#fffbeb", border: "1px solid #fde68a",
                                        fontSize: "12px", color: "#92400e",
                                    }}>
                                        📋 <strong>Post-op Talimatlar:</strong> {item.postOpInstructions}
                                    </div>
                                )}

                                {item.notes && (
                                    <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px", fontStyle: "italic" }}>
                                        📝 {item.notes}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ fontSize: "40px", opacity: 0.4 }}>
                        <FiScissors />
                    </div>
                    <h3>İşlem notu bulunamadı</h3>
                    <p>Henüz işlem/ameliyat notu eklenmemiş veya arama kriterlerine uygun kayıt yok.</p>
                </div>
            )}

            {/* ═══ CREATE PROCEDURE NOTE MODAL ═══ */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni İşlem / Ameliyat Notu">
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Hasta</label>
                        <select className="form-control" value={newNote.patientId}
                            onChange={e => setNewNote({ ...newNote, patientId: e.target.value })} required>
                            <option value="">Hasta seçin...</option>
                            {patientsList.map(p => (
                                <option key={p._id} value={p._id}>{p.name} — {p.age} yaş, {p.gender}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>İşlem Türü</label>
                            <select className="form-control" value={newNote.procedureType}
                                onChange={e => setNewNote({ ...newNote, procedureType: e.target.value })}>
                                {PROCEDURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>İşlem Adı</label>
                            <input type="text" className="form-control" placeholder="Örn: Apendektomi"
                                value={newNote.procedureName} onChange={e => setNewNote({ ...newNote, procedureName: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Anestezi Türü</label>
                            <select className="form-control" value={newNote.anesthesia}
                                onChange={e => setNewNote({ ...newNote, anesthesia: e.target.value })}>
                                {ANESTHESIA_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Süre</label>
                            <input type="text" className="form-control" placeholder="Örn: 45 dakika"
                                value={newNote.duration} onChange={e => setNewNote({ ...newNote, duration: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Durum</label>
                        <select className="form-control" value={newNote.status}
                            onChange={e => setNewNote({ ...newNote, status: e.target.value })}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Endikasyon</label>
                        <textarea className="form-control" placeholder="İşlem endikasyonu / neden..." rows={2}
                            value={newNote.indication} onChange={e => setNewNote({ ...newNote, indication: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Uygulanan Teknik</label>
                        <textarea className="form-control" placeholder="İşlem tekniğinin detayları..." rows={3}
                            value={newNote.technique} onChange={e => setNewNote({ ...newNote, technique: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Bulgular</label>
                        <textarea className="form-control" placeholder="İşlem sırasında tespit edilen bulgular..." rows={2}
                            value={newNote.findings} onChange={e => setNewNote({ ...newNote, findings: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Komplikasyonlar</label>
                        <textarea className="form-control" placeholder="Varsa komplikasyonlar (opsiyonel)..." rows={2}
                            value={newNote.complications} onChange={e => setNewNote({ ...newNote, complications: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Post-op Talimatlar</label>
                        <textarea className="form-control" placeholder="Operasyon sonrası talimatlar..." rows={2}
                            value={newNote.postOpInstructions} onChange={e => setNewNote({ ...newNote, postOpInstructions: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Notlar</label>
                        <textarea className="form-control" placeholder="Ek notlar (opsiyonel)..." rows={2}
                            value={newNote.notes} onChange={e => setNewNote({ ...newNote, notes: e.target.value })} />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>İptal</button>
                        <button type="submit" className="btn btn-primary">İşlem Notu Kaydet</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

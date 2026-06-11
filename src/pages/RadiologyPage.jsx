import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { radiologyApi, patientsApi } from "../services/api";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import {
    FiPlus, FiUser, FiCalendar, FiChevronRight,
    FiMonitor, FiAlertCircle, FiCheckCircle, FiClock,
    FiTrash2, FiMapPin, FiFileText
} from "react-icons/fi";

const IMAGING_TYPES = ["Röntgen", "MR", "BT", "Ultrason", "Diğer"];
const STATUS_OPTIONS = ["beklemede", "tamamlandı", "anormal"];

const BODY_PARTS = [
    "Baş / Beyin", "Boyun", "Göğüs", "Karın", "Pelvis",
    "Omurga", "Üst Ekstremite", "Alt Ekstremite", "Tüm Vücut", "Diğer"
];

const imagingIcons = {
    "Röntgen": "☢️",
    "MR": "🧲",
    "BT": "🔄",
    "Ultrason": "🔊",
    "Diğer": "📷",
};

const statusConfig = {
    "tamamlandı": { color: "#10b981", bg: "#ecfdf5", icon: <FiCheckCircle size={11} />, label: "Tamamlandı" },
    "beklemede": { color: "#f59e0b", bg: "#fffbeb", icon: <FiClock size={11} />, label: "Beklemede" },
    "anormal": { color: "#ef4444", bg: "#fef2f2", icon: <FiAlertCircle size={11} />, label: "Anormal" },
};

export default function RadiologyPage() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [newRad, setNewRad] = useState({
        patientId: "", imagingType: "Röntgen", bodyPart: "", status: "beklemede",
        findings: "", impression: "", notes: "",
    });

    const fetchResults = () => {
        radiologyApi.getAll().then(data => {
            setResults(data);
            setLoading(false);
        }).catch(err => {
            console.error("Radyoloji sonuçları yüklenemedi:", err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchResults(); }, []);

    const openModal = () => {
        setNewRad({
            patientId: "", imagingType: "Röntgen", bodyPart: "", status: "beklemede",
            findings: "", impression: "", notes: "",
        });
        patientsApi.getAll().then(setPatientsList).catch(console.error);
        setIsModalOpen(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await radiologyApi.create(newRad);
            setIsModalOpen(false);
            fetchResults();
        } catch (err) {
            alert("Radyoloji sonucu oluşturulamadı: " + err.message);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Bu radyoloji sonucunu silmek istediğinize emin misiniz?")) return;
        try {
            await radiologyApi.delete(id);
            fetchResults();
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

    const filtered = results.filter(r => {
        const name = getPatientName(r).toLowerCase();
        const body = (r.bodyPart || "").toLowerCase();
        const type = (r.imagingType || "").toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || body.includes(q) || type.includes(q);
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
                <h1>Radyoloji / Görüntüleme</h1>
                <p>Hastalarınızın görüntüleme sonuçlarını yönetin</p>
            </div>

            <div className="header-bar">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Hasta adı, bölge veya tür ara..." />
                <button className="btn btn-primary" onClick={openModal}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <FiPlus size={15} /> Yeni Görüntüleme
                </button>
            </div>

            {/* ═══ STATS CARDS ═══ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {[
                    { label: "Toplam Görüntüleme", value: results.length, color: "#8b5cf6", bg: "#f5f3ff" },
                    { label: "Tamamlanan", value: results.filter(r => r.status === "tamamlandı").length, color: "#10b981", bg: "#ecfdf5" },
                    { label: "Beklemede", value: results.filter(r => r.status === "beklemede").length, color: "#f59e0b", bg: "#fffbeb" },
                    { label: "Anormal", value: results.filter(r => r.status === "anormal").length, color: "#ef4444", bg: "#fef2f2" },
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

            {/* ═══ RESULTS LIST ═══ */}
            {filtered.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map((item, i) => {
                        const st = statusConfig[item.status] || statusConfig["beklemede"];
                        const emoji = imagingIcons[item.imagingType] || "📷";
                        return (
                            <div key={item._id} className="glass-card animate-fade-in"
                                style={{
                                    animationDelay: `${i * 60}ms`, padding: "20px 24px",
                                    cursor: "pointer", transition: "all 0.2s",
                                }}
                                onClick={() => navigate(`/patients/${getPatientId(item)}`)}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c4b5fd"; e.currentTarget.style.transform = "translateX(4px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = "translateX(0)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: "12px",
                                            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "white", flexShrink: 0, fontSize: "18px",
                                        }}>
                                            {emoji}
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                                                    {getPatientName(item)}
                                                </span>
                                                <span style={{
                                                    fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                                                    borderRadius: "6px", background: "#f5f3ff", color: "#8b5cf6",
                                                }}>
                                                    {item.imagingType}
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
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

                                {/* Body Part & Imaging Info */}
                                <div style={{
                                    padding: "10px 14px", borderRadius: "10px", background: "#fafafa",
                                    borderLeft: "3px solid #8b5cf6", marginBottom: "12px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                        <FiMapPin size={12} style={{ color: "#8b5cf6" }} />
                                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
                                            İncelenen Bölge
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                                        {item.bodyPart}
                                    </div>
                                </div>

                                {/* Findings & Impression */}
                                <div style={{ display: "grid", gridTemplateColumns: item.impression ? "1fr 1fr" : "1fr", gap: "10px" }}>
                                    {item.findings && (
                                        <div style={{
                                            padding: "10px 14px", borderRadius: "10px",
                                            background: "white", border: "1px solid #f3f4f6",
                                        }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <FiFileText size={10} /> Bulgular
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}>
                                                {item.findings}
                                            </div>
                                        </div>
                                    )}
                                    {item.impression && (
                                        <div style={{
                                            padding: "10px 14px", borderRadius: "10px",
                                            background: "white", border: "1px solid #f3f4f6",
                                        }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                💡 İzlenim
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}>
                                                {item.impression}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {item.notes && (
                                    <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px", fontStyle: "italic" }}>
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
                        <FiMonitor />
                    </div>
                    <h3>Radyoloji sonucu bulunamadı</h3>
                    <p>Henüz görüntüleme sonucu eklenmemiş veya arama kriterlerine uygun sonuç yok.</p>
                </div>
            )}

            {/* ═══ CREATE RADIOLOGY MODAL ═══ */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Görüntüleme Sonucu">
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Hasta</label>
                        <select className="form-control" value={newRad.patientId}
                            onChange={e => setNewRad({ ...newRad, patientId: e.target.value })} required>
                            <option value="">Hasta seçin...</option>
                            {patientsList.map(p => (
                                <option key={p._id} value={p._id}>{p.name} — {p.age} yaş, {p.gender}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Görüntüleme Türü</label>
                            <select className="form-control" value={newRad.imagingType}
                                onChange={e => setNewRad({ ...newRad, imagingType: e.target.value })}>
                                {IMAGING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>İncelenen Bölge</label>
                            <select className="form-control" value={newRad.bodyPart}
                                onChange={e => setNewRad({ ...newRad, bodyPart: e.target.value })} required>
                                <option value="">Bölge seçin...</option>
                                {BODY_PARTS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Durum</label>
                        <select className="form-control" value={newRad.status}
                            onChange={e => setNewRad({ ...newRad, status: e.target.value })}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Bulgular</label>
                        <textarea className="form-control" placeholder="Görüntüleme bulguları..." rows={3}
                            value={newRad.findings} onChange={e => setNewRad({ ...newRad, findings: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>İzlenim / Yorum</label>
                        <textarea className="form-control" placeholder="Radyolojik izlenim ve yorum..." rows={2}
                            value={newRad.impression} onChange={e => setNewRad({ ...newRad, impression: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Notlar</label>
                        <textarea className="form-control" placeholder="Ek notlar (opsiyonel)..." rows={2}
                            value={newRad.notes} onChange={e => setNewRad({ ...newRad, notes: e.target.value })} />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>İptal</button>
                        <button type="submit" className="btn btn-primary">Sonuç Kaydet</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

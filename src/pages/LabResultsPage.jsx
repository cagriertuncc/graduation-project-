import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { labResultsApi, patientsApi } from "../services/api";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import {
    FiPlus, FiUser, FiCalendar, FiChevronRight,
    FiDroplet, FiAlertCircle, FiCheckCircle, FiClock, FiTrash2
} from "react-icons/fi";

const TEST_TYPES = ["Kan", "İdrar", "Biyokimya", "Hormon", "Diğer"];
const STATUS_OPTIONS = ["beklemede", "tamamlandı", "anormal"];

const statusConfig = {
    "tamamlandı": { color: "#10b981", bg: "#ecfdf5", icon: <FiCheckCircle size={11} />, label: "Tamamlandı" },
    "beklemede": { color: "#f59e0b", bg: "#fffbeb", icon: <FiClock size={11} />, label: "Beklemede" },
    "anormal": { color: "#ef4444", bg: "#fef2f2", icon: <FiAlertCircle size={11} />, label: "Anormal" },
};

export default function LabResultsPage() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [newLab, setNewLab] = useState({
        patientId: "", testType: "Kan", testName: "", status: "beklemede",
        labName: "", notes: "",
        results: [{ parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }],
    });

    const fetchResults = () => {
        labResultsApi.getAll().then(data => {
            setResults(data);
            setLoading(false);
        }).catch(err => {
            console.error("Lab sonuçları yüklenemedi:", err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchResults(); }, []);

    const openModal = () => {
        setNewLab({
            patientId: "", testType: "Kan", testName: "", status: "beklemede",
            labName: "", notes: "",
            results: [{ parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }],
        });
        patientsApi.getAll().then(setPatientsList).catch(console.error);
        setIsModalOpen(true);
    };

    const addResultRow = () => {
        setNewLab({
            ...newLab,
            results: [...newLab.results, { parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }],
        });
    };

    const removeResultRow = (idx) => {
        setNewLab({
            ...newLab,
            results: newLab.results.filter((_, i) => i !== idx),
        });
    };

    const updateResult = (idx, field, value) => {
        const r = [...newLab.results];
        r[idx] = { ...r[idx], [field]: value };
        setNewLab({ ...newLab, results: r });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const validResults = newLab.results.filter(r => r.parameter && r.value);
        try {
            await labResultsApi.create({ ...newLab, results: validResults });
            setIsModalOpen(false);
            fetchResults();
        } catch (err) {
            alert("Lab sonucu oluşturulamadı: " + err.message);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Bu lab sonucunu silmek istediğinize emin misiniz?")) return;
        try {
            await labResultsApi.delete(id);
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
        const test = (r.testName || "").toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || test.includes(q);
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
                <h1>Laboratuvar Sonuçları</h1>
                <p>Hastalarınızın tahlil ve test sonuçlarını yönetin</p>
            </div>

            <div className="header-bar">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Hasta adı veya test ara..." />
                <button className="btn btn-primary" onClick={openModal}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <FiPlus size={15} /> Yeni Sonuç
                </button>
            </div>

            {/* ═══ STATS CARDS ═══ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {[
                    { label: "Toplam Test", value: results.length, color: "#6366f1", bg: "#eef2ff" },
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
                        return (
                            <div key={item._id} className="glass-card animate-fade-in"
                                style={{
                                    animationDelay: `${i * 60}ms`, padding: "20px 24px",
                                    cursor: "pointer", transition: "all 0.2s",
                                }}
                                onClick={() => navigate(`/patients/${getPatientId(item)}`)}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.transform = "translateX(4px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = "translateX(0)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: "12px",
                                            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "white", flexShrink: 0,
                                        }}>
                                            <FiDroplet size={18} />
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                                                    {getPatientName(item)}
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

                                {/* Test Info */}
                                <div style={{
                                    padding: "10px 14px", borderRadius: "10px", background: "#fafafa",
                                    borderLeft: "3px solid #6366f1", marginBottom: "12px",
                                }}>
                                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                                        <div>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>
                                                Test Türü
                                            </div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                                                {item.testType}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>
                                                Test Adı
                                            </div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                                                {item.testName}
                                            </div>
                                        </div>
                                        {item.labName && (
                                            <div>
                                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>
                                                    Laboratuvar
                                                </div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                                                    {item.labName}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Results Table */}
                                {item.results && item.results.length > 0 && (
                                    <div style={{ overflowX: "auto", marginBottom: "8px" }}>
                                        <table style={{
                                            width: "100%", fontSize: "12px", borderCollapse: "collapse",
                                            borderRadius: "8px", overflow: "hidden",
                                        }}>
                                            <thead>
                                                <tr style={{ background: "#f9fafb" }}>
                                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "10px", textTransform: "uppercase" }}>Parametre</th>
                                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "10px", textTransform: "uppercase" }}>Sonuç</th>
                                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "10px", textTransform: "uppercase" }}>Birim</th>
                                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "10px", textTransform: "uppercase" }}>Referans</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {item.results.map((r, ri) => (
                                                    <tr key={ri} style={{
                                                        borderTop: "1px solid #f3f4f6",
                                                        background: r.isAbnormal ? "#fef2f2" : "white",
                                                    }}>
                                                        <td style={{ padding: "7px 12px", fontWeight: 600, color: "#374151" }}>{r.parameter}</td>
                                                        <td style={{
                                                            padding: "7px 12px",
                                                            fontWeight: 700,
                                                            color: r.isAbnormal ? "#ef4444" : "#111827",
                                                        }}>
                                                            {r.value} {r.isAbnormal && <FiAlertCircle size={11} style={{ verticalAlign: "-1px", marginLeft: "3px" }} />}
                                                        </td>
                                                        <td style={{ padding: "7px 12px", color: "#6b7280" }}>{r.unit}</td>
                                                        <td style={{ padding: "7px 12px", color: "#9ca3af" }}>{r.referenceRange}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {item.notes && (
                                    <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px", fontStyle: "italic" }}>
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
                        <FiDroplet />
                    </div>
                    <h3>Lab sonucu bulunamadı</h3>
                    <p>Henüz lab sonucu eklenmemiş veya arama kriterlerine uygun sonuç yok.</p>
                </div>
            )}

            {/* ═══ CREATE LAB RESULT MODAL ═══ */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Lab Sonucu Ekle">
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Hasta</label>
                        <select className="form-control" value={newLab.patientId}
                            onChange={e => setNewLab({ ...newLab, patientId: e.target.value })} required>
                            <option value="">Hasta seçin...</option>
                            {patientsList.map(p => (
                                <option key={p._id} value={p._id}>{p.name} — {p.age} yaş, {p.gender}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Test Türü</label>
                            <select className="form-control" value={newLab.testType}
                                onChange={e => setNewLab({ ...newLab, testType: e.target.value })}>
                                {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Test Adı</label>
                            <input type="text" className="form-control" placeholder="Örn: Tam Kan Sayımı"
                                value={newLab.testName} onChange={e => setNewLab({ ...newLab, testName: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Durum</label>
                            <select className="form-control" value={newLab.status}
                                onChange={e => setNewLab({ ...newLab, status: e.target.value })}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Laboratuvar</label>
                            <input type="text" className="form-control" placeholder="Laboratuvar adı (opsiyonel)"
                                value={newLab.labName} onChange={e => setNewLab({ ...newLab, labName: e.target.value })} />
                        </div>
                    </div>

                    {/* Result Parameters */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <label style={{ fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                                🔬 Test Parametreleri
                            </label>
                            <button type="button" onClick={addResultRow} style={{
                                padding: "4px 10px", borderRadius: "6px", border: "1px solid #e0e7ff",
                                background: "#eef2ff", color: "#6366f1", fontSize: "11px", fontWeight: 600,
                                cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                            }}>
                                <FiPlus size={11} /> Parametre Ekle
                            </button>
                        </div>
                        {newLab.results.map((r, idx) => (
                            <div key={idx} style={{
                                padding: "12px", borderRadius: "10px", border: "1px solid #f3f4f6",
                                marginBottom: "8px", background: "#fafafa",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af" }}>Parametre #{idx + 1}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <label style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                            <input type="checkbox" checked={r.isAbnormal}
                                                onChange={e => updateResult(idx, "isAbnormal", e.target.checked)} />
                                            Anormal
                                        </label>
                                        {newLab.results.length > 1 && (
                                            <button type="button" onClick={() => removeResultRow(idx)}
                                                style={{
                                                    fontSize: "11px", color: "#ef4444", background: "none",
                                                    border: "none", cursor: "pointer", fontWeight: 600,
                                                }}>✕ Kaldır</button>
                                        )}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: "6px" }}>
                                        <input type="text" className="form-control" placeholder="Parametre (örn: WBC)"
                                            value={r.parameter} onChange={e => updateResult(idx, "parameter", e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: "6px" }}>
                                        <input type="text" className="form-control" placeholder="Sonuç (örn: 7.5)"
                                            value={r.value} onChange={e => updateResult(idx, "value", e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <input type="text" className="form-control" placeholder="Birim (örn: 10^3/uL)"
                                            value={r.unit} onChange={e => updateResult(idx, "unit", e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <input type="text" className="form-control" placeholder="Referans (örn: 4.0-10.0)"
                                            value={r.referenceRange} onChange={e => updateResult(idx, "referenceRange", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="form-group">
                        <label>Notlar</label>
                        <textarea className="form-control" placeholder="Ek notlar (opsiyonel)..." rows={2}
                            value={newLab.notes} onChange={e => setNewLab({ ...newLab, notes: e.target.value })} />
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

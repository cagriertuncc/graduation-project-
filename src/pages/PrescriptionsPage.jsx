import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { prescriptionsApi, patientsApi } from "../services/api";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import {
    FiFileText, FiPlus, FiUser, FiCalendar, FiSearch,
    FiChevronRight, FiPackage, FiClock, FiClipboard
} from "react-icons/fi";
import { RiCapsuleLine } from "react-icons/ri";

export default function PrescriptionsPage() {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [newRx, setNewRx] = useState({
        patientId: "", diagnosis: "", notes: "",
        medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
    });

    const fetchPrescriptions = () => {
        prescriptionsApi.getAll().then(data => {
            setPrescriptions(data);
            setLoading(false);
        }).catch(err => {
            console.error("Reçete verisi yüklenemedi:", err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchPrescriptions(); }, []);

    const openModal = () => {
        setNewRx({
            patientId: "", diagnosis: "", notes: "",
            medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
        });
        patientsApi.getAll().then(setPatientsList).catch(console.error);
        setIsModalOpen(true);
    };

    const addMedRow = () => {
        setNewRx({
            ...newRx,
            medications: [...newRx.medications, { name: "", dosage: "", frequency: "", duration: "" }],
        });
    };

    const removeMedRow = (idx) => {
        setNewRx({
            ...newRx,
            medications: newRx.medications.filter((_, i) => i !== idx),
        });
    };

    const updateMed = (idx, field, value) => {
        const meds = [...newRx.medications];
        meds[idx] = { ...meds[idx], [field]: value };
        setNewRx({ ...newRx, medications: meds });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const validMeds = newRx.medications.filter(m => m.name && m.dosage && m.frequency);
        if (validMeds.length === 0) {
            alert("En az bir ilaç ekleyin.");
            return;
        }
        try {
            await prescriptionsApi.create({ ...newRx, medications: validMeds });
            setIsModalOpen(false);
            fetchPrescriptions();
        } catch (err) {
            alert("Reçete oluşturulamadı: " + err.message);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString("tr-TR", {
        day: "numeric", month: "long", year: "numeric",
    });

    const getPatientName = (rx) => {
        if (rx.patientId && typeof rx.patientId === "object") return rx.patientId.name;
        return "Bilinmeyen";
    };

    const getPatientInfo = (rx) => {
        if (rx.patientId && typeof rx.patientId === "object") {
            const p = rx.patientId;
            return `${p.age} yaş • ${p.gender}${p.bloodType ? " • " + p.bloodType : ""}`;
        }
        return "";
    };

    const getPatientId = (rx) => {
        if (rx.patientId && typeof rx.patientId === "object") return rx.patientId._id;
        return rx.patientId;
    };

    const filtered = prescriptions.filter(rx => {
        const name = getPatientName(rx).toLowerCase();
        const diag = (rx.diagnosis || "").toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || diag.includes(q);
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
                <h1>Reçetelerim</h1>
                <p>Hastalarınıza yazdığınız reçeteleri yönetin</p>
            </div>

            <div className="header-bar">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Hasta adı veya tanı ara..." />
                <button className="btn btn-primary" onClick={openModal}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <FiPlus size={15} /> Yeni Reçete
                </button>
            </div>

            {filtered.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map((rx, i) => (
                        <div key={rx._id} className="glass-card animate-fade-in"
                            style={{
                                animationDelay: `${i * 60}ms`, padding: "20px 24px",
                                cursor: "pointer", transition: "all 0.2s",
                            }}
                            onClick={() => navigate(`/patients/${getPatientId(rx)}`)}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.transform = "translateX(4px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = "translateX(0)"; }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: "12px",
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "white", flexShrink: 0,
                                    }}>
                                        <FiFileText size={18} />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                                                {getPatientName(rx)}
                                            </span>
                                            <span style={{
                                                fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                                                borderRadius: "6px", background: "#fef2f2", color: "#ef4444",
                                            }}>
                                                Reçete
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                            {getPatientInfo(rx)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#9ca3af" }}>
                                    <FiCalendar size={12} />
                                    {formatDate(rx.date || rx.createdAt)}
                                    <FiChevronRight size={14} style={{ color: "#d1d5db" }} />
                                </div>
                            </div>

                            {/* Diagnosis */}
                            <div style={{
                                padding: "10px 14px", borderRadius: "10px", background: "#fafafa",
                                borderLeft: "3px solid #ef4444", marginBottom: "12px",
                            }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "3px" }}>
                                    Tanı
                                </div>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                                    {rx.diagnosis}
                                </div>
                            </div>

                            {/* Medications */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {(rx.medications || []).map((med, mi) => (
                                    <div key={mi} style={{
                                        padding: "8px 12px", borderRadius: "10px",
                                        background: "white", border: "1px solid #f3f4f6",
                                        display: "flex", alignItems: "center", gap: "8px",
                                        fontSize: "12px",
                                    }}>
                                        <RiCapsuleLine size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                                        <div>
                                            <span style={{ fontWeight: 700, color: "#111827" }}>{med.name}</span>
                                            <span style={{ color: "#6b7280" }}> — {med.dosage}</span>
                                            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "1px" }}>
                                                {med.frequency}{med.duration ? ` • ${med.duration}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {rx.notes && (
                                <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px", fontStyle: "italic" }}>
                                    📝 {rx.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ fontSize: "40px", opacity: 0.4 }}>
                        <FiFileText />
                    </div>
                    <h3>Reçete bulunamadı</h3>
                    <p>Henüz reçete yazılmamış veya arama kriterlerine uygun reçete yok.</p>
                </div>
            )}

            {/* ═══ CREATE PRESCRIPTION MODAL ═══ */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Reçete Yaz">
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Hasta</label>
                        <select className="form-control" value={newRx.patientId}
                            onChange={e => setNewRx({ ...newRx, patientId: e.target.value })} required>
                            <option value="">Hasta seçin...</option>
                            {patientsList.map(p => (
                                <option key={p._id} value={p._id}>{p.name} — {p.age} yaş, {p.gender}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tanı</label>
                        <input type="text" className="form-control" placeholder="Örn: Üst solunum yolu enfeksiyonu"
                            value={newRx.diagnosis} onChange={e => setNewRx({ ...newRx, diagnosis: e.target.value })} required />
                    </div>

                    {/* Medications */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <label style={{ fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                                <RiCapsuleLine size={13} style={{ marginRight: "4px", verticalAlign: "-1px" }} />
                                İlaçlar
                            </label>
                            <button type="button" onClick={addMedRow} style={{
                                padding: "4px 10px", borderRadius: "6px", border: "1px solid #fee2e2",
                                background: "#fef2f2", color: "#ef4444", fontSize: "11px", fontWeight: 600,
                                cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                            }}>
                                <FiPlus size={11} /> İlaç Ekle
                            </button>
                        </div>
                        {newRx.medications.map((med, idx) => (
                            <div key={idx} style={{
                                padding: "12px", borderRadius: "10px", border: "1px solid #f3f4f6",
                                marginBottom: "8px", background: "#fafafa",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af" }}>İlaç #{idx + 1}</span>
                                    {newRx.medications.length > 1 && (
                                        <button type="button" onClick={() => removeMedRow(idx)}
                                            style={{
                                                fontSize: "11px", color: "#ef4444", background: "none",
                                                border: "none", cursor: "pointer", fontWeight: 600,
                                            }}>✕ Kaldır</button>
                                    )}
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: "6px" }}>
                                        <input type="text" className="form-control" placeholder="İlaç adı"
                                            value={med.name} onChange={e => updateMed(idx, "name", e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: "6px" }}>
                                        <input type="text" className="form-control" placeholder="Doz (örn: 500mg)"
                                            value={med.dosage} onChange={e => updateMed(idx, "dosage", e.target.value)} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <input type="text" className="form-control" placeholder="Sıklık (örn: Günde 2 kez)"
                                            value={med.frequency} onChange={e => updateMed(idx, "frequency", e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <input type="text" className="form-control" placeholder="Süre (örn: 7 gün)"
                                            value={med.duration} onChange={e => updateMed(idx, "duration", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="form-group">
                        <label>Notlar</label>
                        <textarea className="form-control" placeholder="Ek notlar (opsiyonel)..." rows={2}
                            value={newRx.notes} onChange={e => setNewRx({ ...newRx, notes: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>İptal</button>
                        <button type="submit" className="btn btn-primary">Reçete Oluştur</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

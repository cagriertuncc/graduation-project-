import { useState, useEffect } from "react";
import { adminPatientsApi } from "../services/api";
import Modal from "../components/Modal";
import { FiSearch, FiTrash2, FiClock, FiShield, FiAlertTriangle, FiUserX, FiCheckCircle, FiTrash } from "react-icons/fi";

export default function AdminPatientsPage() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [includeDeleted, setIncludeDeleted] = useState(false);

    // Modals
    const [appointmentsModal, setAppointmentsModal] = useState({ open: false, patientId: null, data: [], loading: false, patientName: "" });
    const [penaltyModal, setPenaltyModal] = useState({ open: false, patient: null, points: 0, blacklisted: false });
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchPatients();
    }, [includeDeleted]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const data = await adminPatientsApi.getAll({ includeDeleted: includeDeleted ? "true" : "false" });
            setPatients(data);
        } catch (err) {
            console.error("Hastalar yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.phone && p.phone.includes(searchTerm)) ||
        (p.email && p.email.toLowerCase().includes(searchTerm))
    );

    // -- Past Appointments ---
    const openAppointments = async (patient) => {
        setAppointmentsModal({ open: true, patientId: patient._id, data: [], loading: true, patientName: patient.name });
        try {
            const history = await adminPatientsApi.getAppointments(patient._id);
            setAppointmentsModal(prev => ({ ...prev, data: history, loading: false }));
        } catch (err) {
            alert("Geçmiş randevular alınamadı.");
            setAppointmentsModal(prev => ({ ...prev, loading: false }));
        }
    };

    // -- Penalty & Blacklist --
    const openPenalty = (patient) => {
        setPenaltyModal({
            open: true,
            patient,
            points: patient.penaltyPoints || 0,
            blacklisted: patient.isBlacklisted || false
        });
    };

    const handleSavePenalty = async () => {
        try {
            const { patient, points, blacklisted } = penaltyModal;
            await adminPatientsApi.updatePenalty(patient._id, {
                penaltyPoints: parseInt(points, 10),
                isBlacklisted: blacklisted
            });
            setPenaltyModal({ open: false, patient: null, points: 0, blacklisted: false });
            fetchPatients();
        } catch (err) {
            alert("Ceza kaydedilemedi: " + err.message);
        }
    };

    // -- Soft Delete --
    const confirmDelete = (patient) => {
        if (patient.isDeleted) return;
        setDeleteConfirm(patient);
    };

    const handleDelete = async () => {
        try {
            await adminPatientsApi.softDelete(deleteConfirm._id);
            setDeleteConfirm(null);
            fetchPatients();
        } catch (err) {
            alert("Hasta silinemedi: " + err.message);
        }
    };

    return (
        <div className="admin-dashboard-v2 animate-fade-in" style={{ color: "white", minHeight: "100vh" }}>
            <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #60a5fa, #93c5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Sistem Hasta Yönetimi
                    </h1>
                    <p style={{ color: "#94a3b8", margin: 0 }}>Tüm kayıtlı hastaların detaylı denetim merkezi.</p>
                </div>
            </div>

            <div style={{
                background: "#1e293b", borderRadius: "16px", padding: "24px", border: "1px solid #334155"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ position: "relative", width: "300px" }}>
                        <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Ad, telefon veya e-posta ile ara..."
                            value={searchTerm}
                            onChange={handleSearch}
                            style={{
                                width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px",
                                background: "#0f172a", border: "1px solid #334155", color: "white", outline: "none"
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1", fontSize: "14px", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={includeDeleted}
                                onChange={(e) => setIncludeDeleted(e.target.checked)}
                                style={{ accentColor: "#ef4444" }}
                            />
                            Silinmiş Hastaları Göster
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Hastalar yükleniyor...</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
                                    <th style={{ padding: "16px 12px" }}>Hasta</th>
                                    <th style={{ padding: "16px 12px" }}>İletişim</th>
                                    <th style={{ padding: "16px 12px" }}>Durum</th>
                                    <th style={{ padding: "16px 12px" }}>Uyarı / Ceza</th>
                                    <th style={{ padding: "16px 12px", textAlign: "right" }}>Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Kayıt bulunamadı.</td>
                                    </tr>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: patient.isDeleted ? 0.5 : 1 }}>
                                            <td style={{ padding: "16px 12px" }}>
                                                <div style={{ fontWeight: 600 }}>{patient.name}</div>
                                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{patient.age} Yaş, {patient.gender}</div>
                                            </td>
                                            <td style={{ padding: "16px 12px" }}>
                                                <div style={{ fontSize: "14px" }}>{patient.phone || "-"}</div>
                                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{patient.email || "-"}</div>
                                            </td>
                                            <td style={{ padding: "16px 12px" }}>
                                                {patient.isDeleted ? (
                                                    <span style={{ padding: "4px 8px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>Silindi</span>
                                                ) : patient.isBlacklisted ? (
                                                    <span style={{ padding: "4px 8px", borderRadius: "12px", background: "rgba(0, 0, 0, 0.3)", color: "#f87171", border: "1px solid #ef4444", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <FiUserX /> Kara Liste
                                                    </span>
                                                ) : (
                                                    <span style={{ padding: "4px 8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>Aktif</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "16px 12px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <FiAlertTriangle color={patient.penaltyPoints >= 3 ? "#ef4444" : patient.penaltyPoints > 0 ? "#f59e0b" : "#94a3b8"} />
                                                    <span style={{ fontWeight: 600, color: patient.penaltyPoints >= 3 ? "#ef4444" : "white" }}>
                                                        {patient.penaltyPoints || 0} Puan
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                    <button
                                                        onClick={() => openAppointments(patient)}
                                                        title="Geçmiş Randevular"
                                                        style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", transition: "0.2s" }}
                                                    >
                                                        <FiClock size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openPenalty(patient)}
                                                        title="Ceza/Kara Liste Yönetimi"
                                                        style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", transition: "0.2s" }}
                                                    >
                                                        <FiShield size={16} />
                                                    </button>
                                                    {!patient.isDeleted && (
                                                        <button
                                                            onClick={() => confirmDelete(patient)}
                                                            title="Sistemden Sil (Soft)"
                                                            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", transition: "0.2s" }}
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PAst Appointments Modal */}
            <Modal isOpen={appointmentsModal.open} onClose={() => setAppointmentsModal({ ...appointmentsModal, open: false })} title={`${appointmentsModal.patientName} - Geçmiş Randevular`}>
                <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}>
                    {appointmentsModal.loading ? (
                        <p style={{ color: "#94a3b8" }}>Yükleniyor...</p>
                    ) : appointmentsModal.data.length === 0 ? (
                        <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>Geçmiş randevu kaydı bulunamadı.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {appointmentsModal.data.map(apt => (
                                <div key={apt._id} style={{ background: "#0f172a", border: "1px solid #334155", padding: "16px", borderRadius: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <strong style={{ color: "white" }}>{new Date(apt.date).toLocaleDateString("tr-TR")} - {apt.time}</strong>
                                        <span style={{ fontSize: "12px", background: apt.status === "iptal" ? "#ef4444" : apt.status === "tamamlandı" ? "#10b981" : "#3b82f6", padding: "2px 8px", borderRadius: "8px", color: "white" }}>
                                            {apt.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#cbd5e1" }}>Dr. {apt.doctorId?.name} ({apt.doctorId?.specialty})</div>
                                    <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Tür: {apt.type} | Süre: {apt.duration} dk</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Penalty Modal */}
            <Modal isOpen={penaltyModal.open} onClose={() => setPenaltyModal({ open: false, patient: null, points: 0, blacklisted: false })} title="Ceza ve Kara Liste Yönetimi">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "rgba(59, 130, 246, 0.1)", borderLeft: "4px solid #3b82f6", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#cbd5e1" }}>
                        Hastanın randevulara gelmeme durumlarında ceza puanını artırabilirsiniz. 3 puana ulaşan hastalar otomatik olarak kara listeye alınacaktır.
                    </div>

                    <div className="form-group">
                        <label style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "8px", display: "block" }}>Ceza Puanı</label>
                        <input
                            type="number"
                            className="form-control"
                            value={penaltyModal.points}
                            onChange={(e) => setPenaltyModal({ ...penaltyModal, points: e.target.value })}
                            min="0"
                            max="10"
                            style={{ background: "#0f172a", border: "1px solid #334155", color: "white", width: "100%", padding: "10px", margin: 0 }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "white", cursor: "pointer", background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                            <input
                                type="checkbox"
                                checked={penaltyModal.blacklisted}
                                onChange={(e) => setPenaltyModal({ ...penaltyModal, blacklisted: e.target.checked })}
                                style={{ width: "20px", height: "20px", accentColor: "#ef4444" }}
                            />
                            Kullanıcıyı Kara Listeye Al (Sistemden Randevu Alamaz)
                        </label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                        <button onClick={() => setPenaltyModal({ open: false, patient: null, points: 0, blacklisted: false })} style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "white", cursor: "pointer" }}>İptal</button>
                        <button onClick={handleSavePenalty} style={{ padding: "10px 20px", borderRadius: "8px", background: "#3b82f6", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>
                            Kaydet
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hastayı Sistemden Sil">
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.1)", margin: "0 auto 16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <FiTrash size={26} color="#ef4444" />
                    </div>
                    <h3 style={{ fontSize: "16px", color: "white", marginBottom: "8px" }}>
                        Emin misiniz?
                    </h3>
                    <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
                        <strong style={{ color: "#ef4444" }}>{deleteConfirm?.name}</strong> adlı hastayı sistemden silmek üzeresiniz.
                        Hasta "Silindi" (Soft Delete) olarak işaretlenecektir ve listelerde görünmeyecektir.
                    </p>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 20px", borderRadius: "8px", background: "#334155", border: "none", color: "white", cursor: "pointer", fontWeight: 600 }}>
                        İptal
                    </button>
                    <button
                        onClick={handleDelete}
                        style={{
                            background: "#ef4444", color: "white", border: "none", padding: "10px 20px",
                            borderRadius: "8px", fontWeight: 600, cursor: "pointer",
                        }}
                    >
                        Evet, Sil
                    </button>
                </div>
            </Modal>
        </div>
    );
}

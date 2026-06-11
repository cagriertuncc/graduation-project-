import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { patientsApi, adminApi, labResultsApi, radiologyApi, prescriptionsApi, procedureNotesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DiseaseTag from "../components/DiseaseTag";
import Modal from "../components/Modal";
import { FiArrowLeft, FiEdit2, FiPlus, FiPhone, FiMail, FiCalendar, FiCheckCircle, FiClock, FiDownload, FiTrash2, FiAlertTriangle, FiDroplet, FiMonitor, FiFileText, FiScissors, FiActivity } from "react-icons/fi";
import { RiHospitalLine, RiHeartPulseLine, RiCapsuleLine, RiStethoscopeLine } from "react-icons/ri";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PatientDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    // Tab state
    const [activeTab, setActiveTab] = useState("hastalik");
    const [labResults, setLabResults] = useState([]);
    const [radiologyData, setRadiologyData] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [procedureNotes, setProcedureNotes] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);

    const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newDisease, setNewDisease] = useState({
        name: "", severity: "hafif", notes: "", medications: "",
    });
    const [editForm, setEditForm] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef(null);

    const { user } = useAuth();
    const [allDoctors, setAllDoctors] = useState([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                const data = await patientsApi.getById(id);
                setPatient(data);
                if (user?.isAdmin) {
                    const docs = await adminApi.getDoctors();
                    setAllDoctors(docs);
                }
            } catch (err) {
                console.error("Hasta bulunamadı:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatientDetails();
    }, [id, user]);

    // Tab verisi yükle
    useEffect(() => {
        if (!id) return;
        setTabLoading(true);
        const loaders = {
            lab: () => labResultsApi.getByPatient(id).then(setLabResults),
            radyoloji: () => radiologyApi.getByPatient(id).then(setRadiologyData),
            recete: () => prescriptionsApi.getByPatient(id).then(setPrescriptions),
            islem: () => procedureNotesApi.getByPatient(id).then(setProcedureNotes),
        };
        if (loaders[activeTab]) {
            loaders[activeTab]().catch(() => {}).finally(() => setTabLoading(false));
        } else {
            setTabLoading(false);
        }
    }, [activeTab, id]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div style={{ fontSize: "16px", color: "#9ca3af" }}>Yükleniyor...</div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div>
                <span className="back-link" onClick={() => navigate("/patients")}>
                    <FiArrowLeft size={14} /> Geri
                </span>
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ opacity: 0.4 }}><FiCheckCircle size={48} /></div>
                    <h3>Hasta bulunamadı</h3>
                    <p>Bu ID ile kayıtlı bir hasta yok.</p>
                </div>
            </div>
        );
    }

    const initials = patient.name.split(" ").map((n) => n[0]).join("");

    const handleAddDisease = async (e) => {
        e.preventDefault();
        try {
            const diseaseData = {
                name: newDisease.name,
                diagnosedDate: new Date().toISOString(),
                status: "tedavi",
                severity: newDisease.severity,
                notes: newDisease.notes,
                medications: newDisease.medications.split(",").map((m) => m.trim()).filter(Boolean),
            };
            const updated = await patientsApi.addDisease(patient._id, diseaseData);
            setPatient(updated);
            setIsDiseaseModalOpen(false);
            setNewDisease({ name: "", severity: "hafif", notes: "", medications: "" });
        } catch (err) {
            alert("Hastalık eklenemedi: " + err.message);
        }
    };

    const handleToggleDiseaseStatus = async (diseaseId) => {
        const disease = patient.diseases.find(d => d._id === diseaseId);
        if (!disease) return;
        try {
            const newStatus = disease.status === "tedavi" ? "iyileşti" : "tedavi";
            const updated = await patientsApi.updateDisease(patient._id, diseaseId, { status: newStatus });
            setPatient(updated);
        } catch (err) {
            alert("Durum güncellenemedi: " + err.message);
        }
    };

    const handleEditPatient = async (e) => {
        e.preventDefault();
        try {
            const updated = await patientsApi.update(patient._id, { ...editForm, age: parseInt(editForm.age) });
            setPatient(updated);
            setIsEditModalOpen(false);
        } catch (err) {
            alert("Hasta güncellenemedi: " + err.message);
        }
    };

    const openEditModal = () => {
        setEditForm({
            name: patient.name, age: patient.age, gender: patient.gender,
            phone: patient.phone, email: patient.email, bloodType: patient.bloodType,
            chronicDiseases: patient.chronicDiseases, allergies: patient.allergies, smokingAlcoholStatus: patient.smokingAlcoholStatus,
            emergencyContact: patient.emergencyContact || { name: "", phone: "" },
            doctorId: patient.doctorId?._id || patient.doctorId
        });
        setIsEditModalOpen(true);
    };

    const handleDeletePatient = async () => {
        try {
            await patientsApi.delete(patient._id);
            navigate("/patients");
        } catch (err) {
            alert("Hasta silinemedi: " + err.message);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("tr-TR");
    };

    const handleExportPDF = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        try {
            // Elementin görünür şekilde render edilebilmesi için display blok yap
            exportRef.current.style.display = "block";

            const canvas = await html2canvas(exportRef.current, {
                scale: 2, // Daha net görüntü
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });

            exportRef.current.style.display = "none";

            const imgData = canvas.toDataURL("image/png");
            // A4 page dimensions in mm
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            const safeName = patient.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            pdf.save(`${safeName}_saglik_raporu.pdf`);
        } catch (error) {
            console.error("PDF oluşturulurken hata:", error);
            alert("Rapor oluşturulurken bir hata meydana geldi.");
        } finally {
            setIsExporting(false);
        }
    };

    const SeverityDot = ({ severity }) => {
        const colors = { ciddi: "#dc2626", orta: "#d97706", hafif: "#3b82f6" };
        return (
            <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: colors[severity] || "#9ca3af", display: "inline-block", marginRight: "4px",
            }} />
        );
    };

    return (
        <div className="patient-detail">
            <span className="back-link" onClick={() => navigate("/patients")}>
                <FiArrowLeft size={14} /> Hastalarıma Dön
            </span>

            {/* Patient Header */}
            <div className="patient-detail-header animate-fade-in">
                <div className="patient-detail-avatar">{initials}</div>
                <div style={{ flex: 1 }}>
                    <div className="patient-detail-name">{patient.name}</div>
                    <div className="patient-detail-subtitle">
                        {patient.age} yaş • {patient.gender} • Kan Grubu: {patient.bloodType}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={handleExportPDF} disabled={isExporting}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: "white" }}>
                        <FiDownload size={14} /> {isExporting ? "Hazırlanıyor..." : "Rapor Al"}
                    </button>
                    <button className="btn btn-secondary" onClick={openEditModal}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiEdit2 size={14} /> Düzenle
                    </button>
                    {(user?.isAdmin || (patient.doctorId && (patient.doctorId._id === user?._id || patient.doctorId === user?._id))) && (
                        <button className="btn btn-secondary" onClick={() => setIsDeleteDialogOpen(true)}
                            style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", borderColor: "#fecaca", background: "#fef2f2" }}>
                            <FiTrash2 size={14} /> Sil
                        </button>
                    )}
                </div>
            </div>

            {/* Patient Info */}
            <div className="patient-info-grid animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="glass-card patient-info-item">
                    <label>Telefon</label>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiPhone size={14} style={{ color: "#dc2626" }} /> {patient.phone}
                    </span>
                </div>
                <div className="glass-card patient-info-item">
                    <label>E-posta</label>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiMail size={14} style={{ color: "#dc2626" }} /> {patient.email}
                    </span>
                </div>
                <div className="glass-card patient-info-item">
                    <label>Kayıt Tarihi</label>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiCalendar size={14} style={{ color: "#dc2626" }} /> {formatDate(patient.registeredDate)}
                    </span>
                </div>
                <div className="glass-card patient-info-item">
                    <label>Aktif Hastalık</label>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <RiHeartPulseLine size={14} style={{ color: "#dc2626" }} />
                        {(patient.diseases || []).filter((d) => d.status === "tedavi").length} hastalık
                    </span>
                </div>
            </div>

            {/* NEW: Medical & Emergency Info */}
            <div className="patient-info-grid animate-fade-in" style={{ animationDelay: "150ms", marginTop: "20px" }}>
                <div className="glass-card patient-info-item">
                    <label>Kronik Hastalıklar</label>
                    <span style={{ fontWeight: 600 }}>{patient.chronicDiseases || "Belirtilmedi"}</span>
                </div>
                <div className="glass-card patient-info-item">
                    <label>Alerjiler</label>
                    <span style={{ fontWeight: 600 }}>{patient.allergies || "Belirtilmedi"}</span>
                </div>
                <div className="glass-card patient-info-item">
                    <label>Sigara / Alkol</label>
                    <span style={{ fontWeight: 600 }}>{patient.smokingAlcoholStatus || "Belirtilmedi"}</span>
                </div>
                <div className="glass-card patient-info-item">
                    <label>Acil İletişim</label>
                    <span style={{ fontWeight: 600 }}>
                        {patient.emergencyContact?.name ? `${patient.emergencyContact.name} (${patient.emergencyContact.phone})` : "Belirtilmedi"}
                    </span>
                </div>
            </div>

            {/* ═══ TAB NAV ═══ */}
            <div className="animate-fade-in" style={{ animationDelay: "200ms", marginTop: 8 }}>
                {/* Tab Bar */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "2px solid #f1f5f9", paddingBottom: 0 }}>
                    {[
                        { id: "hastalik", label: "Hastalık Geçmişi", icon: <FiActivity size={14} /> },
                        { id: "lab", label: "Laboratuvar", icon: <FiDroplet size={14} /> },
                        { id: "radyoloji", label: "Radyoloji", icon: <FiMonitor size={14} /> },
                        { id: "recete", label: "Reçeteler", icon: <RiCapsuleLine size={14} /> },
                        { id: "islem", label: "İşlem Notları", icon: <FiScissors size={14} /> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "10px 16px", borderRadius: "10px 10px 0 0",
                            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                            background: activeTab === tab.id ? "white" : "transparent",
                            color: activeTab === tab.id ? "#ef4444" : "#64748b",
                            borderBottom: activeTab === tab.id ? "2px solid #ef4444" : "2px solid transparent",
                            marginBottom: "-2px", transition: "all 0.2s", fontFamily: "inherit",
                        }}
                            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#1e293b"; }}
                            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#64748b"; }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                    {activeTab === "hastalik" && (
                        <button className="btn btn-primary btn-sm" onClick={() => setIsDiseaseModalOpen(true)}
                            style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", marginBottom: 4 }}>
                            <FiPlus size={13} /> Hastalık Ekle
                        </button>
                    )}
                </div>

                {/* Loading spinner */}
                {tabLoading && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #f1f5f9", borderTopColor: "#ef4444", animation: "spin 0.8s linear infinite" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* ── TAB: Hastalık ── */}
                {!tabLoading && activeTab === "hastalik" && (<div>

                {(patient.diseases || []).length > 0 ? (
                    <div className="disease-list">
                        {patient.diseases.map((disease) => (
                            <div
                                key={disease._id}
                                className={`glass-card disease-item ${disease.severity === "ciddi" ? "ciddi" : disease.status === "iyileşti" ? "iyileşti" : ""
                                    }`}
                            >
                                <div className="disease-item-header">
                                    <div className="disease-item-name">{disease.name}</div>
                                    <div className="disease-item-date">Tanı: {formatDate(disease.diagnosedDate)}</div>
                                </div>

                                <div className="disease-item-tags">
                                    <DiseaseTag disease={disease} />
                                    <span className={`badge ${disease.severity === "ciddi" ? "badge-danger"
                                        : disease.severity === "orta" ? "badge-warning"
                                            : "badge-info"
                                        }`} style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                        <SeverityDot severity={disease.severity} /> {disease.severity}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleToggleDiseaseStatus(disease._id)}
                                        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}
                                    >
                                        {disease.status === "tedavi"
                                            ? <><FiCheckCircle size={13} /> İyileşti Olarak İşaretle</>
                                            : <><FiClock size={13} /> Tedaviye Al</>}
                                    </button>
                                </div>

                                {disease.notes && <div className="disease-item-notes">{disease.notes}</div>}

                                {disease.medications && disease.medications.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                                            <RiCapsuleLine size={13} /> İlaçlar:
                                        </div>
                                        <div className="disease-item-meds">
                                            {disease.medications.map((med, i) => (
                                                <span key={i} className="med-tag">{med}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
                        <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.4 }}>
                            <RiHeartPulseLine />
                        </div>
                        <h3 style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                            Henüz hastalık kaydı yok
                        </h3>
                        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                            Yeni bir hastalık kaydı eklemek için yukarıdaki butonu kullanın.
                        </p>
                    </div>
                )}
                </div>)}

                {/* ── TAB: Lab ── */}
                {!tabLoading && activeTab === "lab" && (
                    <div>
                        {labResults.length === 0 ? (
                            <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
                                <FiDroplet size={40} style={{ color: "#e2e8f0", marginBottom: 12 }} />
                                <h3 style={{ color: "#94a3b8", fontSize: 16 }}>Lab sonucu bulunamadı</h3>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {labResults.map(lr => (
                                    <div key={lr._id} className="glass-card" style={{ padding: "18px 22px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                                                    <FiDroplet size={14} style={{ color: "#ef4444" }} />
                                                    {lr.testName}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                                    {lr.category} • {new Date(lr.date || lr.createdAt).toLocaleDateString("tr-TR")}
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                background: lr.status === "normal" ? "#f0fdf4" : lr.status === "anormal" ? "#fef2f2" : "#fefce8",
                                                color: lr.status === "normal" ? "#16a34a" : lr.status === "anormal" ? "#dc2626" : "#ca8a04",
                                            }}>{lr.status || "Sonuçlandı"}</span>
                                        </div>
                                        {lr.results && lr.results.length > 0 && (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
                                                {lr.results.map((r, ri) => (
                                                    <div key={ri} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", border: "1px solid #f1f5f9" }}>
                                                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{r.name}</div>
                                                        <div style={{ fontSize: 16, fontWeight: 800, color: r.isAbnormal ? "#ef4444" : "#1e293b" }}>{r.value} <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>{r.unit}</span></div>
                                                        {r.referenceRange && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Ref: {r.referenceRange}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {lr.notes && <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", fontStyle: "italic", borderLeft: "3px solid #ef4444", paddingLeft: 10 }}>{lr.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Radyoloji ── */}
                {!tabLoading && activeTab === "radyoloji" && (
                    <div>
                        {radiologyData.length === 0 ? (
                            <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
                                <FiMonitor size={40} style={{ color: "#e2e8f0", marginBottom: 12 }} />
                                <h3 style={{ color: "#94a3b8", fontSize: 16 }}>Radyoloji kaydı bulunamadı</h3>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                                {radiologyData.map(rd => (
                                    <div key={rd._id} className="glass-card" style={{ padding: "18px 22px", position: "relative", overflow: "hidden" }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: rd.urgency === "acil" ? "#ef4444" : "#8b5cf6" }} />
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                                                    <FiMonitor size={14} style={{ color: "#8b5cf6" }} />
                                                    {rd.imagingType}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{rd.region} • {new Date(rd.date || rd.createdAt).toLocaleDateString("tr-TR")}</div>
                                            </div>
                                            {rd.urgency && (
                                                <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: rd.urgency === "acil" ? "#fef2f2" : "#f5f3ff", color: rd.urgency === "acil" ? "#dc2626" : "#7c3aed" }}>
                                                    {rd.urgency}
                                                </span>
                                            )}
                                        </div>
                                        {rd.clinicalInfo && <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}><strong>Klinik:</strong> {rd.clinicalInfo}</div>}
                                        {rd.findings && <div style={{ fontSize: 12, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, marginBottom: 6 }}><strong>Bulgular:</strong> {rd.findings}</div>}
                                        {rd.impression && <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 600, borderLeft: "3px solid #8b5cf6", paddingLeft: 10 }}>{rd.impression}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Reçete ── */}
                {!tabLoading && activeTab === "recete" && (
                    <div>
                        {prescriptions.length === 0 ? (
                            <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
                                <RiCapsuleLine size={40} style={{ color: "#e2e8f0", marginBottom: 12 }} />
                                <h3 style={{ color: "#94a3b8", fontSize: 16 }}>Reçete bulunamadı</h3>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {prescriptions.map(rx => (
                                    <div key={rx._id} className="glass-card" style={{ padding: "18px 22px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                                    <RiCapsuleLine size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{rx.diagnosis}</div>
                                                    <div style={{ fontSize: 11, color: "#64748b" }}>{new Date(rx.date || rx.createdAt).toLocaleDateString("tr-TR")}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#fef2f2", color: "#ef4444" }}>Reçete</span>
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                            {(rx.medications || []).map((med, mi) => (
                                                <div key={mi} style={{ padding: "8px 14px", borderRadius: 10, background: "white", border: "1px solid #f1f5f9", fontSize: 12 }}>
                                                    <RiCapsuleLine size={12} style={{ color: "#ef4444", verticalAlign: "-2px", marginRight: 4 }} />
                                                    <strong>{med.name}</strong> <span style={{ color: "#64748b" }}>— {med.dosage}</span>
                                                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{med.frequency}{med.duration ? ` • ${med.duration}` : ""}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {rx.notes && <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>📝 {rx.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: İşlem Notları ── */}
                {!tabLoading && activeTab === "islem" && (
                    <div>
                        {procedureNotes.length === 0 ? (
                            <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
                                <FiScissors size={40} style={{ color: "#e2e8f0", marginBottom: 12 }} />
                                <h3 style={{ color: "#94a3b8", fontSize: 16 }}>İşlem notu bulunamadı</h3>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {procedureNotes.map(pn => (
                                    <div key={pn._id} className="glass-card" style={{ padding: "18px 22px", position: "relative", overflow: "hidden" }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "#10b981" }} />
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                                                <FiScissors size={14} style={{ color: "#10b981" }} />
                                                {pn.procedureType}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(pn.date || pn.createdAt).toLocaleDateString("tr-TR")}</div>
                                        </div>
                                        {pn.description && <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>{pn.description}</div>}
                                        {pn.preOpDiagnosis && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}><strong>Preop Tanı:</strong> {pn.preOpDiagnosis}</div>}
                                        {pn.postOpDiagnosis && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}><strong>Postop Tanı:</strong> {pn.postOpDiagnosis}</div>}
                                        {pn.complications && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6, borderLeft: "3px solid #ef4444", paddingLeft: 10 }}><strong>Komplikasyon:</strong> {pn.complications}</div>}
                                        {pn.notes && <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, fontStyle: "italic" }}>📝 {pn.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Disease Modal */}
            <Modal isOpen={isDiseaseModalOpen} onClose={() => setIsDiseaseModalOpen(false)} title="Hastalık Ekle">
                <form onSubmit={handleAddDisease}>
                    <div className="form-group">
                        <label>Hastalık Adı</label>
                        <input type="text" className="form-control" placeholder="Hastalık adını girin"
                            value={newDisease.name} onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Şiddet</label>
                        <select className="form-control" value={newDisease.severity}
                            onChange={(e) => setNewDisease({ ...newDisease, severity: e.target.value })}>
                            <option value="hafif">Hafif</option>
                            <option value="orta">Orta</option>
                            <option value="ciddi">Ciddi</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Notlar</label>
                        <textarea className="form-control" placeholder="Tanı, test sonuçları, gözlemler..."
                            value={newDisease.notes} onChange={(e) => setNewDisease({ ...newDisease, notes: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>İlaçlar (virgülle ayırarak yazın)</label>
                        <input type="text" className="form-control" placeholder="İlaç 1, İlaç 2, İlaç 3"
                            value={newDisease.medications} onChange={(e) => setNewDisease({ ...newDisease, medications: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsDiseaseModalOpen(false)}>İptal</button>
                        <button type="submit" className="btn btn-primary">Hastalık Ekle</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Patient Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Hasta Bilgilerini Düzenle">
                {editForm && (
                    <form onSubmit={handleEditPatient}>
                        <div className="form-group">
                            <label>Ad Soyad</label>
                            <input type="text" className="form-control" value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Yaş</label>
                                <input type="number" className="form-control" value={editForm.age}
                                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Cinsiyet</label>
                                <select className="form-control" value={editForm.gender}
                                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                                    <option value="Erkek">Erkek</option>
                                    <option value="Kadın">Kadın</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Telefon</label>
                                <input type="text" className="form-control" value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Kan Grubu</label>
                                <select className="form-control" value={editForm.bloodType}
                                    onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}>
                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                                        <option key={bt} value={bt}>{bt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>E-posta</label>
                            <input type="email" className="form-control" value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Kronik Hastalıklar</label>
                                <input type="text" className="form-control" value={editForm.chronicDiseases}
                                    onChange={(e) => setEditForm({ ...editForm, chronicDiseases: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Alerjiler</label>
                                <input type="text" className="form-control" value={editForm.allergies}
                                    onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Sigara / Alkol Durumu</label>
                            <input type="text" className="form-control" value={editForm.smokingAlcoholStatus}
                                onChange={(e) => setEditForm({ ...editForm, smokingAlcoholStatus: e.target.value })} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Acil İletişim Kişisi (Ad)</label>
                                <input type="text" className="form-control" value={editForm.emergencyContact.name}
                                    onChange={(e) => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, name: e.target.value } })} />
                            </div>
                            <div className="form-group">
                                <label>Acil İletişim (Telefon)</label>
                                <input type="text" className="form-control" value={editForm.emergencyContact.phone}
                                    onChange={(e) => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, phone: e.target.value } })} />
                            </div>
                        </div>
                        {user?.isAdmin && (
                            <div className="form-group">
                                <label>Sorumlu Doktor Müşavirliği (Transfer)</label>
                                <select
                                    className="form-control"
                                    value={editForm.doctorId}
                                    onChange={(e) => setEditForm({ ...editForm, doctorId: e.target.value })}
                                    required
                                >
                                    {allDoctors.map(doc => (
                                        <option key={doc._id} value={doc._id}>{doc.name} ({doc.specialty})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>İptal</button>
                            <button type="submit" className="btn btn-primary">Kaydet</button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Patient Delete Modal */}
            <Modal isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} title="Hastayı Sil">
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FiAlertTriangle size={26} color="#ef4444" />
                    </div>
                    <h3 style={{ fontSize: "16px", color: "#111827", marginBottom: "8px" }}>Emin misiniz?</h3>
                    <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>
                        <strong style={{ color: "#ef4444" }}>{patient.name}</strong> adlı hastayı ve tüm randevu, hastalık geçmişini
                        kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.
                    </p>
                </div>
                <div className="modal-footer" style={{ justifyContent: "center", gap: "12px", marginTop: "24px" }}>
                    <button className="btn btn-secondary" onClick={() => setIsDeleteDialogOpen(false)}>İptal</button>
                    <button className="btn" onClick={handleDeletePatient} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", padding: "8px 20px", borderRadius: "10px", fontWeight: 600, cursor: "pointer" }}>
                        Evet, Sil
                    </button>
                </div>
            </Modal>

            {/* Hidden Printable PDF Template */}
            <div ref={exportRef} style={{
                position: "absolute",
                top: "-9999px",
                left: 0,
                width: "800px", // A4 prop
                padding: "40px",
                background: "white",
                color: "black",
                fontFamily: "Arial, sans-serif",
                display: "none"
            }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #ef4444", paddingBottom: "20px", marginBottom: "30px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: 48, height: 48, background: "#ef4444", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                            <RiHospitalLine size={28} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: "24px", color: "#111827" }}>MediTrack Hastanesi</h1>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>Resmi Hasta Sağlık Raporu</div>
                        </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "14px" }}>
                        <div><strong>Rapor Tarihi:</strong> {new Date().toLocaleDateString("tr-TR")}</div>
                        <div><strong>Kayıt No:</strong> {patient._id.slice(-6).toUpperCase()}</div>
                    </div>
                </div>

                {/* Patient Info */}
                <h2 style={{ fontSize: "18px", color: "#111827", marginBottom: "15px", borderBottom: "1px solid #e5e7eb", paddingBottom: "5px" }}>Hasta Kimlik Bilgileri</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "30px", fontSize: "14px" }}>
                    <div><strong>Ad Soyad:</strong> {patient.name}</div>
                    <div><strong>Yaş / Cinsiyet:</strong> {patient.age} / {patient.gender}</div>
                    <div><strong>Kan Grubu:</strong> {patient.bloodType}</div>
                    <div><strong>Telefon:</strong> {patient.phone}</div>
                    <div><strong>E-posta:</strong> {patient.email || "-"}</div>
                    <div><strong>Sisteme Kayıt:</strong> {formatDate(patient.registeredDate)}</div>
                </div>

                {/* Disease History */}
                <h2 style={{ fontSize: "18px", color: "#111827", marginBottom: "15px", borderBottom: "1px solid #e5e7eb", paddingBottom: "5px" }}>Hastalık ve Tedavi Geçmişi</h2>
                {patient.diseases && patient.diseases.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {patient.diseases.map(d => (
                            <div key={d._id} style={{ border: "1px solid #e5e7eb", padding: "15px", borderRadius: "8px", background: d.status === "iyileşti" ? "#f8fafc" : "#fff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                    <strong style={{ fontSize: "16px", color: "#111827" }}>{d.name}</strong>
                                    <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "4px", background: d.status === "iyileşti" ? "#dcfce7" : "#fee2e2", color: d.status === "iyileşti" ? "#166534" : "#991b1b" }}>
                                        {d.status === "tedavi" ? "Tedavisi Sürüyor" : "İyileşti"}
                                    </span>
                                </div>
                                <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "8px" }}>
                                    <strong>Tanı Tarihi:</strong> {formatDate(d.diagnosedDate)} | <strong>Şiddet:</strong> {d.severity.charAt(0).toUpperCase() + d.severity.slice(1)}
                                </div>
                                {d.notes && (
                                    <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "8px", background: "#f9fafb", padding: "8px", borderRadius: "4px" }}>
                                        <strong>Doktor Notu:</strong> {d.notes}
                                    </div>
                                )}
                                {d.medications && d.medications.length > 0 && (
                                    <div style={{ fontSize: "13px", color: "#4b5563" }}>
                                        <strong>Kullanılan İlaçlar:</strong> {d.medications.join(", ")}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: "14px", color: "#6b7280", fontStyle: "italic" }}>Sistemde kayıtlı hastalık geçmişi bulunmamaktadır.</div>
                )}

                {/* Footer Signature Box */}
                <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px dashed #cbd5e1", display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ textAlign: "center", width: "200px" }}>
                        <div style={{ fontSize: "14px", marginBottom: "40px" }}>Hekim Kaşe ve İmza</div>
                        <div style={{ borderBottom: "1px solid #94a3b8", width: "100%", margin: "0 auto" }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

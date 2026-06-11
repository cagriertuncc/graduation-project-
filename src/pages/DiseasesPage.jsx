import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { patientsApi } from "../services/api";
import SearchBar from "../components/SearchBar";
import { FiClock, FiCheckCircle } from "react-icons/fi";

export default function DiseasesPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        patientsApi.getAll().then(data => {
            setPatients(data);
            setLoading(false);
        }).catch(err => {
            console.error("Veri yüklenemedi:", err);
            setLoading(false);
        });
    }, []);

    const allDiseases = patients.flatMap((patient) =>
        (patient.diseases || []).map((disease) => ({
            ...disease,
            patientName: patient.name,
            patientId: patient._id,
            patientAge: patient.age,
        }))
    );

    const filteredDiseases = allDiseases.filter((d) => {
        const matchesSearch =
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.patientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || d.status === statusFilter;
        const matchesSeverity = severityFilter === "all" || d.severity === severityFilter;
        return matchesSearch && matchesStatus && matchesSeverity;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("tr-TR");
    };

    const SeverityDot = ({ severity }) => {
        const colors = { ciddi: "#dc2626", orta: "#d97706", hafif: "#3b82f6" };
        return (
            <span style={{
                display: "inline-block", width: "8px", height: "8px",
                borderRadius: "50%", background: colors[severity] || "#9ca3af",
                marginRight: "6px", flexShrink: 0,
            }} />
        );
    };

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
                <h1>Hastalık Takibi</h1>
                <p>Tüm hastaların hastalıklarını takip edin</p>
            </div>

            <div className="header-bar">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Hastalık veya hasta adı ara..." />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <div className="filter-tabs">
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", padding: "7px 4px" }}>Durum:</span>
                    {[
                        { label: "Tümü", value: "all" },
                        { label: "Tedavide", value: "tedavi", icon: <FiClock size={13} /> },
                        { label: "İyileşti", value: "iyileşti", icon: <FiCheckCircle size={13} /> },
                    ].map((f) => (
                        <button
                            key={f.value}
                            className={`filter-tab ${statusFilter === f.value ? "active" : ""}`}
                            onClick={() => setStatusFilter(f.value)}
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>

                <div className="filter-tabs">
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", padding: "7px 4px" }}>Şiddet:</span>
                    {[
                        { label: "Tümü", value: "all" },
                        { label: "Hafif", value: "hafif", color: "#3b82f6" },
                        { label: "Orta", value: "orta", color: "#d97706" },
                        { label: "Ciddi", value: "ciddi", color: "#dc2626" },
                    ].map((f) => (
                        <button
                            key={f.value}
                            className={`filter-tab ${severityFilter === f.value ? "active" : ""}`}
                            onClick={() => setSeverityFilter(f.value)}
                            style={{ display: "flex", alignItems: "center", gap: "5px" }}
                        >
                            {f.color && (
                                <span style={{
                                    width: "8px", height: "8px", borderRadius: "50%",
                                    background: f.color, display: "inline-block",
                                }} />
                            )}
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {filteredDiseases.length > 0 ? (
                <div className="glass-card diseases-table-container animate-fade-in">
                    <table className="diseases-table">
                        <thead>
                            <tr>
                                <th>Hastalık</th>
                                <th>Hasta</th>
                                <th>Şiddet</th>
                                <th>Durum</th>
                                <th>Tanı Tarihi</th>
                                <th>İlaçlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDiseases.map((disease) => (
                                <tr key={`${disease.patientId}-${disease._id}`}>
                                    <td style={{ fontWeight: 500 }}>{disease.name}</td>
                                    <td>
                                        <span
                                            className="disease-patient-name"
                                            onClick={() => navigate(`/patients/${disease.patientId}`)}
                                        >
                                            {disease.patientName}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${disease.severity === "ciddi" ? "badge-danger"
                                            : disease.severity === "orta" ? "badge-warning"
                                                : "badge-info"
                                            }`}>
                                            <SeverityDot severity={disease.severity} /> {disease.severity}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${disease.status === "tedavi" ? "badge-warning" : "badge-success"}`}
                                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                            {disease.status === "tedavi" ? <FiClock size={12} /> : <FiCheckCircle size={12} />}
                                            {disease.status === "tedavi" ? "Tedavide" : "İyileşti"}
                                        </span>
                                    </td>
                                    <td style={{ color: "var(--text-muted)" }}>{formatDate(disease.diagnosedDate)}</td>
                                    <td>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                            {(disease.medications || []).slice(0, 2).map((med, i) => (
                                                <span key={i} className="med-tag">{med}</span>
                                            ))}
                                            {(disease.medications || []).length > 2 && (
                                                <span className="med-tag">+{disease.medications.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ fontSize: "40px", opacity: 0.4 }}>
                        <FiCheckCircle />
                    </div>
                    <h3>Hastalık bulunamadı</h3>
                    <p>Filtrelere uygun hastalık kaydı yok.</p>
                </div>
            )}
        </div>
    );
}

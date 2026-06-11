import DiseaseTag from "./DiseaseTag";
import { FiPhone, FiTrash2 } from "react-icons/fi";

export default function PatientCard({ patient, onClick, onDelete, delay = 0 }) {
    const initials = patient.name.split(" ").map((n) => n[0]).join("");

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(patient._id);
    };

    return (
        <div
            className="glass-card patient-card animate-fade-in"
            style={{ animationDelay: `${delay}ms`, position: "relative" }}
            onClick={() => onClick(patient._id)}
        >
            {onDelete && (
                <button
                    onClick={handleDelete}
                    style={{
                        position: "absolute", top: "12px", right: "12px",
                        width: 30, height: 30, borderRadius: "8px",
                        border: "1px solid #fee2e2", background: "#fff5f5",
                        color: "#ef4444", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0.6, transition: "all 0.2s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.background = "#fff5f5"; }}
                    title="Hastayı Sil"
                >
                    <FiTrash2 size={13} />
                </button>
            )}

            <div className="patient-card-header">
                <div className="patient-avatar">{initials}</div>
                <div>
                    <div className="patient-card-name">{patient.name}</div>
                    <div className="patient-card-meta">
                        {patient.age} yaş • {patient.gender} • {patient.bloodType}
                    </div>
                    {patient.doctorId?.name && (
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>👨‍⚕️</span> {patient.doctorId.name}
                        </div>
                    )}
                </div>
            </div>

            <div className="patient-card-diseases">
                {(patient.diseases || []).map((disease) => (
                    <DiseaseTag key={disease._id} disease={disease} />
                ))}
            </div>

            <div className="patient-card-footer">
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <FiPhone size={12} /> {patient.phone}
                </span>
                <span>
                    {(patient.diseases || []).filter((d) => d.status === "tedavi").length} aktif hastalık
                </span>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { medicalReportsApi, patientsApi } from "../services/api";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import {
    FiPlus, FiCalendar, FiChevronRight, FiClipboard,
    FiCheckCircle, FiClock, FiTrash2, FiEdit3, FiSend,
    FiPrinter
} from "react-icons/fi";

const REPORT_TYPES = ["Sevk", "İstirahat", "Sağlık Kurulu", "Epikriz", "Diğer"];
const STATUS_OPTIONS = ["taslak", "tamamlandı", "onaylandı"];

const reportTypeConfig = {
    "Sevk": { color: "#3b82f6", bg: "#eff6ff", emoji: "🔄" },
    "İstirahat": { color: "#f59e0b", bg: "#fffbeb", emoji: "🛌" },
    "Sağlık Kurulu": { color: "#8b5cf6", bg: "#f5f3ff", emoji: "🏛️" },
    "Epikriz": { color: "#10b981", bg: "#ecfdf5", emoji: "📋" },
    "Diğer": { color: "#6b7280", bg: "#f9fafb", emoji: "📄" },
};

const statusConfig = {
    "tamamlandı": { color: "#10b981", bg: "#ecfdf5", icon: <FiCheckCircle size={11} />, label: "Tamamlandı" },
    "taslak": { color: "#f59e0b", bg: "#fffbeb", icon: <FiEdit3 size={11} />, label: "Taslak" },
    "onaylandı": { color: "#3b82f6", bg: "#eff6ff", icon: <FiCheckCircle size={11} />, label: "Onaylandı" },
};

export default function MedicalReportsPage() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [newReport, setNewReport] = useState({
        patientId: "", reportType: "Sevk", title: "", content: "",
        diagnosis: "", startDate: "", endDate: "", referredTo: "",
        status: "taslak", notes: "",
    });

    const fetchReports = () => {
        medicalReportsApi.getAll().then(data => {
            setReports(data);
            setLoading(false);
        }).catch(err => {
            console.error("Raporlar yüklenemedi:", err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchReports(); }, []);

    const openModal = () => {
        setNewReport({
            patientId: "", reportType: "Sevk", title: "", content: "",
            diagnosis: "", startDate: "", endDate: "", referredTo: "",
            status: "taslak", notes: "",
        });
        patientsApi.getAll().then(setPatientsList).catch(console.error);
        setIsModalOpen(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newReport };
            if (!payload.startDate) delete payload.startDate;
            if (!payload.endDate) delete payload.endDate;
            await medicalReportsApi.create(payload);
            setIsModalOpen(false);
            fetchReports();
        } catch (err) {
            alert("Rapor oluşturulamadı: " + err.message);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Bu raporu silmek istediğinize emin misiniz?")) return;
        try {
            await medicalReportsApi.delete(id);
            fetchReports();
        } catch (err) {
            alert("Silinemedi: " + err.message);
        }
    };

    const handlePrint = (report, e) => {
        e.stopPropagation();
        const patientName = getPatientName(report);
        const patientInfo = getPatientInfo(report);
        const printContent = `
            <html><head><title>Tıbbi Rapor</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .info-row { display: flex; gap: 40px; margin: 15px 0; font-size: 14px; }
                .label { font-weight: 700; color: #555; min-width: 120px; }
                .content { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; line-height: 1.8; white-space: pre-wrap; }
                .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 13px; color: #777; }
                .signature { text-align: center; margin-top: 40px; }
                .signature-line { border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 5px; }
                @media print { body { padding: 20px; } }
            </style></head><body>
            <h1>📋 ${report.reportType} Raporu</h1>
            <div class="info-row"><span class="label">Hasta:</span><span>${patientName}</span></div>
            <div class="info-row"><span class="label">Hasta Bilgi:</span><span>${patientInfo}</span></div>
            <div class="info-row"><span class="label">Rapor Başlığı:</span><span>${report.title}</span></div>
            ${report.diagnosis ? `<div class="info-row"><span class="label">Tanı:</span><span>${report.diagnosis}</span></div>` : ""}
            ${report.referredTo ? `<div class="info-row"><span class="label">Sevk Edilen:</span><span>${report.referredTo}</span></div>` : ""}
            ${report.startDate ? `<div class="info-row"><span class="label">Başlangıç:</span><span>${formatDate(report.startDate)}</span></div>` : ""}
            ${report.endDate ? `<div class="info-row"><span class="label">Bitiş:</span><span>${formatDate(report.endDate)}</span></div>` : ""}
            <div class="info-row"><span class="label">Tarih:</span><span>${formatDate(report.date || report.createdAt)}</span></div>
            <h3>Rapor İçeriği</h3>
            <div class="content">${report.content}</div>
            ${report.notes ? `<p><strong>Notlar:</strong> ${report.notes}</p>` : ""}
            <div class="signature"><div class="signature-line">Doktor İmza / Kaşe</div></div>
            </body></html>`;
        const printWindow = window.open("", "_blank");
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
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

    const getDayCount = (start, end) => {
        if (!start || !end) return null;
        const diff = new Date(end) - new Date(start);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    const filtered = reports.filter(r => {
        const name = getPatientName(r).toLowerCase();
        const title = (r.title || "").toLowerCase();
        const type = (r.reportType || "").toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || title.includes(q) || type.includes(q);
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
                <h1>Tıbbi Raporlar</h1>
                <p>Hasta raporlarını yazın, yönetin ve yazdırın</p>
            </div>

            <div className="header-bar">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Hasta adı, başlık veya tür ara..." />
                <button className="btn btn-primary" onClick={openModal}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <FiPlus size={15} /> Yeni Rapor
                </button>
            </div>

            {/* ═══ STATS CARDS ═══ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {[
                    { label: "Toplam Rapor", value: reports.length, color: "#3b82f6", bg: "#eff6ff" },
                    { label: "Onaylanan", value: reports.filter(r => r.status === "onaylandı").length, color: "#10b981", bg: "#ecfdf5" },
                    { label: "Taslak", value: reports.filter(r => r.status === "taslak").length, color: "#f59e0b", bg: "#fffbeb" },
                    { label: "Sevk", value: reports.filter(r => r.reportType === "Sevk").length, color: "#8b5cf6", bg: "#f5f3ff" },
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

            {/* ═══ REPORTS LIST ═══ */}
            {filtered.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map((item, i) => {
                        const st = statusConfig[item.status] || statusConfig["taslak"];
                        const rt = reportTypeConfig[item.reportType] || reportTypeConfig["Diğer"];
                        const dayCount = getDayCount(item.startDate, item.endDate);
                        return (
                            <div key={item._id} className="glass-card animate-fade-in"
                                style={{
                                    animationDelay: `${i * 60}ms`, padding: "20px 24px",
                                    cursor: "pointer", transition: "all 0.2s",
                                }}
                                onClick={() => navigate(`/patients/${getPatientId(item)}`)}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.transform = "translateX(4px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = "translateX(0)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: "12px",
                                            background: `linear-gradient(135deg, ${rt.color}, ${rt.color}dd)`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "white", flexShrink: 0, fontSize: "18px",
                                        }}>
                                            {rt.emoji}
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                                                    {getPatientName(item)}
                                                </span>
                                                <span style={{
                                                    fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                                                    borderRadius: "6px", background: rt.bg, color: rt.color,
                                                }}>
                                                    {item.reportType}
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
                                        <button onClick={(e) => handlePrint(item, e)}
                                            style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                color: "#d1d5db", padding: "4px", borderRadius: "6px",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = "#3b82f6"}
                                            onMouseLeave={e => e.currentTarget.style.color = "#d1d5db"}
                                            title="Yazdır"
                                        >
                                            <FiPrinter size={14} />
                                        </button>
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

                                {/* Title & Content preview */}
                                <div style={{
                                    padding: "10px 14px", borderRadius: "10px", background: "#fafafa",
                                    borderLeft: `3px solid ${rt.color}`, marginBottom: "12px",
                                }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5" }}>
                                        {item.content.length > 200 ? item.content.substring(0, 200) + "..." : item.content}
                                    </div>
                                </div>

                                {/* Extra info row */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                    {item.diagnosis && (
                                        <div style={{
                                            padding: "6px 12px", borderRadius: "8px",
                                            background: "white", border: "1px solid #f3f4f6",
                                            fontSize: "12px",
                                        }}>
                                            <span style={{ fontWeight: 700, color: "#374151" }}>Tanı: </span>
                                            <span style={{ color: "#6b7280" }}>{item.diagnosis}</span>
                                        </div>
                                    )}
                                    {item.referredTo && (
                                        <div style={{
                                            padding: "6px 12px", borderRadius: "8px",
                                            background: "white", border: "1px solid #f3f4f6",
                                            fontSize: "12px", display: "flex", alignItems: "center", gap: "4px",
                                        }}>
                                            <FiSend size={11} style={{ color: "#3b82f6" }} />
                                            <span style={{ fontWeight: 700, color: "#374151" }}>Sevk: </span>
                                            <span style={{ color: "#6b7280" }}>{item.referredTo}</span>
                                        </div>
                                    )}
                                    {dayCount && (
                                        <div style={{
                                            padding: "6px 12px", borderRadius: "8px",
                                            background: "#fffbeb", border: "1px solid #fde68a",
                                            fontSize: "12px", fontWeight: 600, color: "#92400e",
                                        }}>
                                            🛌 {dayCount} gün istirahat
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
                        <FiClipboard />
                    </div>
                    <h3>Rapor bulunamadı</h3>
                    <p>Henüz tıbbi rapor yazılmamış veya arama kriterlerine uygun rapor yok.</p>
                </div>
            )}

            {/* ═══ CREATE REPORT MODAL ═══ */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Tıbbi Rapor">
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Hasta</label>
                        <select className="form-control" value={newReport.patientId}
                            onChange={e => setNewReport({ ...newReport, patientId: e.target.value })} required>
                            <option value="">Hasta seçin...</option>
                            {patientsList.map(p => (
                                <option key={p._id} value={p._id}>{p.name} — {p.age} yaş, {p.gender}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Rapor Türü</label>
                            <select className="form-control" value={newReport.reportType}
                                onChange={e => setNewReport({ ...newReport, reportType: e.target.value })}>
                                {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Durum</label>
                            <select className="form-control" value={newReport.status}
                                onChange={e => setNewReport({ ...newReport, status: e.target.value })}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Rapor Başlığı</label>
                        <input type="text" className="form-control" placeholder="Örn: Dahiliye Sevk Raporu"
                            value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>Tanı</label>
                        <input type="text" className="form-control" placeholder="Tanı (opsiyonel)"
                            value={newReport.diagnosis} onChange={e => setNewReport({ ...newReport, diagnosis: e.target.value })} />
                    </div>

                    {newReport.reportType === "Sevk" && (
                        <div className="form-group">
                            <label>Sevk Edilen Bölüm / Hastane</label>
                            <input type="text" className="form-control" placeholder="Örn: Kardiyoloji - Şehir Hastanesi"
                                value={newReport.referredTo} onChange={e => setNewReport({ ...newReport, referredTo: e.target.value })} />
                        </div>
                    )}

                    {newReport.reportType === "İstirahat" && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Başlangıç Tarihi</label>
                                <input type="date" className="form-control"
                                    value={newReport.startDate} onChange={e => setNewReport({ ...newReport, startDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Bitiş Tarihi</label>
                                <input type="date" className="form-control"
                                    value={newReport.endDate} onChange={e => setNewReport({ ...newReport, endDate: e.target.value })} />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Rapor İçeriği</label>
                        <textarea className="form-control" placeholder="Rapor detayları..." rows={5}
                            value={newReport.content} onChange={e => setNewReport({ ...newReport, content: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>Notlar</label>
                        <textarea className="form-control" placeholder="Ek notlar (opsiyonel)..." rows={2}
                            value={newReport.notes} onChange={e => setNewReport({ ...newReport, notes: e.target.value })} />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>İptal</button>
                        <button type="submit" className="btn btn-primary">Rapor Oluştur</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

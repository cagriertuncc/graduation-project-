import { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiActivity, FiSearch } from "react-icons/fi";
import Modal from "../components/Modal";
import { adminApi } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function SpecialtyManagement() {
    const { user } = useAuth();
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ name: "", status: "active" });
    const [editingId, setEditingId] = useState(null);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getDepartments();
            setSpecialties(data);
        } catch (error) {
            toast.error("Departmanlar yüklenemedi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Filtered specialties
    const filtered = specialties.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("Departman adı boş olamaz!");

        try {
            if (editingId) {
                await adminApi.updateDepartment(editingId, form);
                toast.success("Departman başarıyla güncellendi.");
            } else {
                await adminApi.createDepartment(form);
                toast.success("Departman başarıyla eklendi.");
            }
            setIsModalOpen(false);
            setForm({ name: "", status: "active" });
            setEditingId(null);
            fetchDepartments();
        } catch (error) {
            toast.error("İşlem başarısız: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bu branşı silmek istediğinize emin misiniz?")) {
            try {
                await adminApi.deleteDepartment(id);
                toast.success("Branş silindi.");
                fetchDepartments();
            } catch (error) {
                toast.error("Silme işlemi başarısız: " + error.message);
            }
        }
    };

    const handleOpenAdd = () => {
        setForm({ name: "", status: "active" });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (spec) => {
        setForm({ name: spec.name, status: spec.status });
        setEditingId(spec._id);
        setIsModalOpen(true);
    };

    if (user?.specialty === "Bilgi İşlem Uzmanı") {
        return (
            <div className="animate-fade-in" style={{
                color: "white",
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "20px"
            }}>
                <div style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "24px",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    padding: "40px",
                    maxWidth: "500px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
                }}>
                    <FiActivity size={64} color="#ef4444" style={{ marginBottom: "20px" }} />
                    <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>Yetkisiz Erişim</h2>
                    <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                        Bu sayfa sadece <strong>Bilgi İşlem Müdürü</strong> ve <strong>Bilgi İşlem Müdür Yardımcısı</strong> yetkisine sahip kullanıcıların erişimine açıktır. Bilgi İşlem Uzmanlarının branş yönetimi paneline erişim yetkisi bulunmamaktadır.
                    </p>
                    <button
                        onClick={() => window.location.href = "/admin"}
                        style={{
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "10px",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Panele Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="specialty-management animate-fade-in" style={{ color: "white" }}>
            <Toaster position="top-right" />
            <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Branş & Poliklinik Yönetimi
                    </h1>
                    <p style={{ color: "#64748b", margin: 0 }}>Hastanenin aktif tıbbi departmanlarını ve kapasitelerini kontrol edin.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    style={{
                        background: "#ef4444", color: "white", border: "none",
                        padding: "12px 24px", borderRadius: "12px", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                    }}
                >
                    <FiPlus /> Yeni Branş Ekle
                </button>
            </div>

            <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", overflow: "hidden" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid #334155", display: "flex", gap: "20px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                        <input
                            type="text"
                            placeholder="Branş ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%", padding: "10px 10px 10px 40px",
                                background: "rgba(255,255,255,0.05)", border: "1px solid #334155",
                                borderRadius: "8px", color: "white", outline: "none"
                            }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table" style={{ border: "none" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #334155" }}>
                                <th style={{ color: "#94a3b8" }}>Departman Adı</th>
                                <th style={{ color: "#94a3b8" }}>Personel Sayısı</th>
                                <th style={{ color: "#94a3b8" }}>Hasta Yükü</th>
                                <th style={{ color: "#94a3b8" }}>Durum</th>
                                <th style={{ color: "#94a3b8", textAlign: "right" }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>Yükleniyor...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>Departman bulunamadı.</td>
                                </tr>
                            ) : filtered.map(spec => (
                                <tr key={spec._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)",
                                                color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                <FiActivity />
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{spec.name}</span>
                                        </div>
                                    </td>
                                    <td>{spec.doctorCount} Doktor</td>
                                    <td>{spec.patientCount} Kayıtlı</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                                            background: spec.status === "active" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                            color: spec.status === "active" ? "#10b981" : "#f59e0b"
                                        }}>
                                            {spec.status === "active" ? "Aktif" : "Bakımda"}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <button onClick={() => handleOpenEdit(spec)} className="btn-icon" style={{ background: "none", border: "none", cursor: "pointer" }}>
                                            <FiEdit2 size={16} color="#3b82f6" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(spec._id)}
                                            className="btn-icon"
                                            style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "10px" }}
                                        >
                                            <FiTrash2 size={16} color="#ef4444" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} title={editingId ? "Branşı Düzenle" : "Yeni Branş Tanımla"}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="form-group">
                        <label style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "8px", display: "block" }}>Branş / Departman Adı</label>
                        <input
                            type="text"
                            className="form-control"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            style={{ background: "#0f172a", border: "1px solid #334155", color: "white" }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "8px", display: "block" }}>Başlangıç Durumu</label>
                        <select
                            className="form-control"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            style={{ background: "#0f172a", border: "1px solid #334155", color: "white" }}
                        >
                            <option value="active">Aktif</option>
                            <option value="maintenance">Bakım Modu</option>
                        </select>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "white", cursor: "pointer" }}>İptal</button>
                        <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: "8px", background: "#ef4444", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>{editingId ? "Güncelle" : "Branşı Kaydet"}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

import { useState, useEffect } from "react";
import { adminApi } from "../services/api";
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiShield, FiSettings, FiActivity, FiClock, FiDollarSign } from "react-icons/fi";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function UserManagement() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [doctorStats, setDoctorStats] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", role: "doctor", specialty: "", phone: "", password: "" });
    const [doctorForm, setDoctorForm] = useState({
        specialty: "",
        dailyPatientLimit: 40,
        isOnline: true,
        salary: 0,
        workingHours: {
            monday: "09:00-17:00",
            tuesday: "09:00-17:00",
            wednesday: "09:00-17:00",
            thursday: "09:00-17:00",
            friday: "09:00-17:00",
            saturday: "09:00-13:00",
            sunday: "tatil",
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, deptsData] = await Promise.all([
                adminApi.getUsers(),
                adminApi.getDepartments()
            ]);
            setUsers(usersData);
            setDepartments(deptsData);
        } catch (err) {
            toast.error("Veriler yüklenirken hata oluştu");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const usersData = await adminApi.getUsers();
            setUsers(usersData);
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = users.filter(u => {
        const uName = u.profileId?.name || u.name || "";
        const roleMatch = filterRole === "all" || (u.role || (u.isAdmin ? 'admin' : 'doctor')) === filterRole;
        const searchMatch = uName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
        return roleMatch && searchMatch;
    });

    const handleExportCSV = () => {
        if (filtered.length === 0) return toast.error("Dışa aktarılacak veri bulunamadı.");

        const headers = ["ID", "Isim Soyisim", "E-posta", "Sistem Rolu", "Brans/Alan", "Olusturulma Tarihi"];
        const rows = filtered.map(u => {
            const uRole = u.role || (u.isAdmin ? "admin" : "doctor");
            const uName = u.profileId?.name || u.name || "Bilinmeyen";
            const uSpecialty = u.profileId?.specialty || u.specialty || "-";
            const created = new Date(u.createdAt).toLocaleDateString("tr-TR");
            return [u._id, uName, u.email, uRole, uSpecialty, created];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `hastane_kullanicilari_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel/CSV aktarımı başlatıldı.");
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(filtered.map(u => u._id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;
        if (!window.confirm(`Seçili ${selectedUsers.length} kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?`)) return;

        try {
            // In a real app we'd prefer a dedicated bulk-delete endpoint, 
            // but for now we iterate the existing delete logic in parallel.
            await Promise.all(selectedUsers.map(id => adminApi.deleteUser(id)));
            setSelectedUsers([]);
            fetchUsers();
            toast.success(`${selectedUsers.length} kullanıcı başarıyla silindi.`);
        } catch (err) {
            toast.error("Toplu silme sırasında bir hata oluştu.");
        }
    };

    const handleToggleDoctorStatus = async (user) => {
        try {
            const currentStatus = user.profileId?.isOnline !== undefined ? user.profileId.isOnline : true;
            await adminApi.updateUser(user._id, { isOnline: !currentStatus });
            toast.success(`${user.name || 'Doktor'} durumu ${!currentStatus ? 'Aktif' : 'Pasif'} yapıldı.`);
            fetchUsers();
        } catch (err) {
            toast.error("Durum güncellenirken hata oluştu.");
        }
    };

    const handleOpenAdd = () => {
        setForm({ name: "", email: "", role: "doctor", specialty: "", phone: "", password: "" });
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setForm({
            name: user.profileId?.name || user.name || "",
            email: user.email,
            role: user.role || "doctor",
            specialty: user.profileId?.specialty || user.specialty || "",
            phone: user.profileId?.phone || user.phone || "",
            password: ""
        });
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleOpenDelete = (user) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await adminApi.updateUser(selectedUser._id, form);
                toast.success("Kullanıcı güncellendi");
            } else {
                if (!form.password) return toast.error("Şifre zorunludur.");
                await adminApi.createUser(form);
                toast.success("Kullanıcı oluşturuldu");
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.message || "Bir hata oluştu");
        }
    };

    const handleDoctorSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatePayload = {
                specialty: doctorForm.specialty,
                dailyPatientLimit: Number(doctorForm.dailyPatientLimit),
                isOnline: doctorForm.isOnline,
                salary: Number(doctorForm.salary),
                workingHours: doctorForm.workingHours
            };
            await adminApi.updateUser(selectedUser._id, updatePayload);
            toast.success("Doktor ayarları güncellendi");
            setIsDoctorModalOpen(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.message || "Doktor güncellenemedi");
        }
    };

    const handleOpenDoctorSettings = async (user) => {
        const uSpeed = user.profileId || {};

        setDoctorForm({
            specialty: uSpeed.specialty || user.specialty || "",
            dailyPatientLimit: uSpeed.dailyPatientLimit || 40,
            isOnline: uSpeed.isOnline !== undefined ? uSpeed.isOnline : true,
            salary: uSpeed.salary || 0,
            workingHours: uSpeed.workingHours || {
                monday: "09:00-17:00",
                tuesday: "09:00-17:00",
                wednesday: "09:00-17:00",
                thursday: "09:00-17:00",
                friday: "09:00-17:00",
                saturday: "09:00-13:00",
                sunday: "tatil",
            }
        });
        setSelectedUser(user);
        setDoctorStats(null);
        setIsDoctorModalOpen(true);

        try {
            const stats = await adminApi.getDoctorPerformance(uSpeed._id);
            setDoctorStats(stats);
        } catch (err) {
            console.error("Performans alınamadı:", err);
        }
    };

    const handleWorkingHourChange = (day, value) => {
        setDoctorForm(prev => ({
            ...prev,
            workingHours: { ...prev.workingHours, [day]: value }
        }));
    };

    const handleAdvancedTimeChange = (day, type, value) => {
        setDoctorForm(prev => {
            const current = prev.workingHours[day] || "09:00-17:00";
            if (value === "tatil") {
                return { ...prev, workingHours: { ...prev.workingHours, [day]: "tatil" } };
            }
            if (current === "tatil") {
                return { ...prev, workingHours: { ...prev.workingHours, [day]: type === 'start' ? `${value}-17:00` : `09:00-${value}` } };
            }
            const [start, end] = current.split("-");
            const newStr = type === 'start' ? `${value}-${end}` : `${start}-${value}`;
            return { ...prev, workingHours: { ...prev.workingHours, [day]: newStr } };
        });
    };

    const handleDelete = async () => {
        try {
            await adminApi.deleteUser(selectedUser._id);
            setIsDeleteDialogOpen(false);
            fetchUsers();
        } catch (err) {
            alert(err.message || "Silinemedi");
        }
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
                    <FiUsers size={64} color="#ef4444" style={{ marginBottom: "20px" }} />
                    <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>Yetkisiz Erişim</h2>
                    <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                        Bu sayfa sadece <strong>Bilgi İşlem Müdürü</strong> ve <strong>Bilgi İşlem Müdür Yardımcısı</strong> yetkisine sahip kullanıcıların erişimine açıktır. Bilgi İşlem Uzmanlarının kullanıcı yönetimi paneline erişim yetkisi bulunmamaktadır.
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
        <div className="animate-fade-in" style={{ color: "white" }}>
            <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Kullanıcı Yönetimi
                    </h1>
                    <p style={{ color: "#64748b", margin: 0 }}>Sistemdeki tüm personel, doktor ve yöneticilerin yetki ve hesap ayarları.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="add-user-btn"
                    style={{
                        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "white", border: "none",
                        padding: "12px 24px", borderRadius: "12px", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)", transition: "all 0.2s ease"
                    }}
                >
                    <FiPlus /> Yeni Kullanıcı
                </button>
            </div>

            <div style={{ background: "rgba(30, 41, 59, 0.6)", backdropFilter: "blur(12px)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}>
                {/* TABS LAYER */}
                <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "12px 20px 0", background: "rgba(0,0,0,0.15)" }}>
                    {[
                        { id: 'all', label: 'Tüm Kullanıcılar' },
                        { id: 'doctor', label: 'Doktorlar' },
                        { id: 'admin', label: 'Yöneticiler' },
                        { id: 'staff', label: 'Personeller' },
                        { id: 'patient', label: 'Hastalar' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterRole(tab.id)}
                            style={{
                                padding: "12px 18px",
                                background: "none",
                                border: "none",
                                color: filterRole === tab.id ? "white" : "#94a3b8",
                                borderBottom: filterRole === tab.id ? "3px solid #3b82f6" : "3px solid transparent",
                                fontWeight: 700,
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* SEARCH & ACTIONS LAYER */}
                <div style={{ padding: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
                        <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "16px" }} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="İsim veya e-posta ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%", padding: "12px 16px 12px 42px",
                                background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "10px", color: "white", outline: "none", fontSize: "14px",
                                transition: "all 0.2s ease"
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        {selectedUsers.length > 0 && user?.specialty === "Bilgi İşlem Müdürü" && (
                            <button
                                onClick={handleBulkDelete}
                                style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "12px 18px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                            >
                                <FiTrash2 /> ({selectedUsers.length}) Sil
                            </button>
                        )}
                        <button
                            onClick={handleExportCSV}
                            style={{ background: "rgba(255, 255, 255, 0.03)", color: "#e2e8f0", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "12px 18px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                        >
                            Dışa Aktar (CSV)
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Yükleniyor...</div>
                ) : (
                    <div className="table-container" style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", border: "none" }}>
                        <table className="data-table">
                            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                <tr>
                                    {user?.specialty === "Bilgi İşlem Müdürü" && (
                                        <th style={{ width: "60px", textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={filtered.length > 0 && selectedUsers.length === filtered.length}
                                                style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#3b82f6" }}
                                            />
                                        </th>
                                    )}
                                    <th>Kullanıcı Bilgisi</th>
                                    <th>Yetki Rolü</th>
                                    <th>Departman / Ünvan</th>
                                    <th style={{ textAlign: "right" }}>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => {
                                    const roleColors = { admin: "#ef4444", doctor: "#3b82f6", staff: "#f59e0b", patient: "#10b981", receptionist: "#8b5cf6", pharmacist: "#10b981", accountant: "#06b6d4", hr: "#ec4899", technician: "#eab308" };
                                    const roleLabels = { admin: "Sistem Yön.", doctor: "Doktor", staff: "Personel", patient: "Hasta", receptionist: "Tıbbi Sekreter", pharmacist: "Eczacı", accountant: "Muhasebeci", hr: "İnsan Kaynakları", technician: "Teknisyen" };
                                    const uRole = u.role || (u.isAdmin ? "admin" : "doctor");
                                    const uName = u.profileId?.name || u.name || "Bilinmeyen";
                                    const uSpecialty = u.profileId?.specialty || u.specialty || "-";
                                    const uColor = roleColors[uRole] || "#94a3b8";

                                    return (
                                        <tr key={u._id} style={{ background: selectedUsers.includes(u._id) ? "rgba(59, 130, 246, 0.06)" : "transparent" }}>
                                            {user?.specialty === "Bilgi İşlem Müdürü" && (
                                                <td style={{ textAlign: "center" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(u._id)}
                                                        onChange={() => handleSelectUser(u._id)}
                                                        style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#3b82f6" }}
                                                    />
                                                </td>
                                            )}
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                                    <div style={{
                                                        width: 38, height: 38, borderRadius: "50%", 
                                                        background: `${uColor}15`,
                                                        color: uColor, display: "flex", alignItems: "center", justifyContent: "center", 
                                                        fontWeight: 800, fontSize: "14px", border: `1px solid ${uColor}30`,
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                                                    }}>
                                                        {uName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: "white", fontSize: "14px" }}>{uName}</div>
                                                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                                                    background: `${uColor}12`, color: uColor,
                                                    display: "inline-flex", alignItems: "center", gap: "6px", border: `1px solid ${uColor}25`
                                                }}>
                                                    {uRole === 'admin' && <FiShield size={12} />}
                                                    {roleLabels[uRole] || uRole}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}>{uSpecialty}</span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                                                    {uRole === 'doctor' && (
                                                        <div style={{ display: "inline-flex", alignItems: "center", marginRight: "6px", borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "16px", gap: "10px" }}>
                                                            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.5px" }}>AKTİF</span>
                                                            <div
                                                                onClick={() => handleToggleDoctorStatus(u)}
                                                                style={{
                                                                    width: "36px", height: "20px", borderRadius: "10px",
                                                                    background: (u.profileId?.isOnline !== false) ? "#10b981" : "#475569",
                                                                    position: "relative", cursor: "pointer", transition: "all 0.3s"
                                                                }}
                                                                title="Doktorun Randevu Alma Durumunu Aç/Kapat"
                                                            >
                                                                <div style={{
                                                                    width: "14px", height: "14px", borderRadius: "50%", background: "white",
                                                                    position: "absolute", top: "3px",
                                                                    left: (u.profileId?.isOnline !== false) ? "19px" : "3px",
                                                                    transition: "all 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                                                                }}></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {uRole === 'doctor' && (
                                                        <button onClick={() => handleOpenDoctorSettings(u)} className="action-btn settings" title="Doktor Ayarları">
                                                            <FiSettings size={16} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleOpenEdit(u)} className="action-btn edit" title="Düzenle">
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                    {user?.specialty === "Bilgi İşlem Müdürü" && (
                                                        <button onClick={() => handleOpenDelete(u)} className="action-btn delete" title="Sil">
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Components */}
            <style>{`
                /* Premium Glassmorphic Table Styles */
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .data-table th {
                    padding: 18px 24px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    background: rgba(15, 23, 42, 0.45);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .data-table td {
                    padding: 18px 24px;
                    color: #cbd5e1;
                    font-size: 14px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    vertical-align: middle;
                }
                .data-table tr {
                    transition: all 0.2s ease-in-out;
                }
                .data-table tbody tr:hover {
                    background: rgba(255, 255, 255, 0.02) !important;
                }
                .action-btn {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .action-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-1px);
                }
                .action-btn.edit {
                    color: #60a5fa;
                }
                .action-btn.edit:hover {
                    background: rgba(59, 130, 246, 0.15);
                    border-color: rgba(59, 130, 246, 0.3);
                }
                .action-btn.delete {
                    color: #f87171;
                }
                .action-btn.delete:hover {
                    background: rgba(239, 68, 68, 0.15);
                    border-color: rgba(239, 68, 68, 0.3);
                }
                .action-btn.settings {
                    color: #fbbf24;
                }
                .action-btn.settings:hover {
                    background: rgba(251, 191, 36, 0.15);
                    border-color: rgba(251, 191, 36, 0.3);
                }
                
                .add-user-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5) !important;
                }
                .search-input:focus {
                    border-color: #3b82f6 !important;
                    background: rgba(0, 0, 0, 0.4) !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
                }

                .modern-input {
                    background: #f8fafc !important;
                    border: 1px solid #e2e8f0 !important;
                    color: #1e293b !important;
                    padding: 12px 16px !important;
                    border-radius: 12px !important;
                    outline: none !important;
                    width: 100% !important;
                    font-size: 14px !important;
                    transition: all 0.25s ease !important;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.01) !important;
                }
                .modern-input::placeholder {
                    color: #94a3b8 !important;
                }
                .modern-input:focus {
                    border-color: #3b82f6 !important;
                    background: white !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
                }
                .modern-label {
                    color: #334155;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                    display: block;
                }
                .modern-btn-cancel {
                    padding: 12px 24px;
                    border-radius: 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .modern-btn-cancel:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                    border-color: #cbd5e1;
                }
                .modern-btn-save {
                    padding: 12px 28px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border: none;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
                }
                .modern-btn-save:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
                }
                
                /* Custom Performance Cards */
                .stat-card {
                    padding: 20px;
                    border-radius: 16px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                }
                .stat-card::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
                    transform: rotate(45deg);
                    pointer-events: none;
                }
                .stat-card-title {
                    font-size: 13px;
                    font-weight: 600;
                    opacity: 0.9;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stat-card-value {
                    font-size: 32px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
            `}</style>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedUser ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>
                    <div>
                        <label className="modern-label">Ad Soyad</label>
                        <input type="text" className="modern-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Örn: Dr. Ahmet Yılmaz" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <label className="modern-label">E-posta Adresi</label>
                            <input type="email" className="modern-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ornek@hastane.com" />
                        </div>
                        <div>
                            <label className="modern-label">Sistem Rolü</label>
                            <select className="modern-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="doctor">Doktor</option>
                                <option value="admin">Sistem Yöneticisi</option>
                                <option value="receptionist">Tıbbi Sekreter (Hasta Kabul)</option>
                                <option value="pharmacist">Eczacı</option>
                                <option value="accountant">Muhasebeci</option>
                                <option value="hr">İnsan Kaynakları (İK)</option>
                                <option value="technician">Laboratuvar/Radyoloji Teknisyeni</option>
                                <option value="staff">Personel (Genel)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <label className="modern-label">Şifre {selectedUser && <span style={{ fontSize: "11px", color: "#64748b" }}>(Değiştirmek istemiyorsanız boş bırakın)</span>}</label>
                            <input type="password" className="modern-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!selectedUser} placeholder="••••••••" />
                        </div>
                        {form.role === 'doctor' && (
                            <div>
                                <label className="modern-label">Uzmanlık Alanı / Branş</label>
                                <select className="modern-input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} required={form.role === 'doctor'}>
                                    <option value="" disabled>Branş Seçiniz</option>
                                    <option value="Acil Tıp">Acil Tıp</option>
                                    <option value="Ağız ve Diş Sağlığı">Ağız ve Diş Sağlığı</option>
                                    <option value="Anesteziyoloji ve Reanimasyon">Anesteziyoloji ve Reanimasyon</option>
                                    <option value="Beyin ve Sinir Cerrahisi">Beyin ve Sinir Cerrahisi</option>
                                    <option value="Çocuk Sağlığı ve Hastalıkları">Çocuk Sağlığı ve Hastalıkları</option>
                                    <option value="Dahiliye Uzmanı">Dahiliye Uzmanı</option>
                                    <option value="Dermatoloji (Cildiye)">Dermatoloji (Cildiye)</option>
                                    <option value="Diş Hekimliği">Diş Hekimliği</option>
                                    <option value="Enfeksiyon Hastalıkları">Enfeksiyon Hastalıkları</option>
                                    <option value="Fiziksel Tıp ve Rehabilitasyon">Fiziksel Tıp ve Rehabilitasyon</option>
                                    <option value="Gastroenteroloji">Gastroenteroloji</option>
                                    <option value="Genel Cerrahi">Genel Cerrahi</option>
                                    <option value="Göğüs Hastalıkları">Göğüs Hastalıkları</option>
                                    <option value="Göz Hastalıkları">Göz Hastalıkları</option>
                                    <option value="Kadın Hastalıkları ve Doğum">Kadın Hastalıkları ve Doğum</option>
                                    <option value="Kardiyoloji Uzmanı">Kardiyoloji Uzmanı</option>
                                    <option value="Kulak Burun Boğaz">Kulak Burun Boğaz</option>
                                    <option value="Nöroloji Uzmanı">Nöroloji Uzmanı</option>
                                    <option value="Ortopedi ve Travmatoloji">Ortopedi ve Travmatoloji</option>
                                    <option value="Psikiyatri">Psikiyatri</option>
                                    <option value="Üroloji">Üroloji</option>
                                </select>
                            </div>
                        )}
                        {form.role === 'admin' && (
                            <div>
                                <label className="modern-label">Bilgi İşlem Görevi / Ünvanı</label>
                                <select className="modern-input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} required={form.role === 'admin'}>
                                    <option value="" disabled>Görev Seçiniz</option>
                                    <option value="Bilgi İşlem Müdürü">Bilgi İşlem Müdürü</option>
                                    <option value="Bilgi İşlem Müdür Yardımcısı">Bilgi İşlem Müdür Yardımcısı</option>
                                    <option value="Bilgi İşlem Uzmanı">Bilgi İşlem Uzmanı</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="modern-btn-cancel">İptal</button>
                        <button type="submit" className="modern-btn-save">{selectedUser ? "Değişiklikleri Kaydet" : "Kullanıcıyı Oluştur"}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} title="Kullanıcıyı Sil">
                <div style={{ padding: "10px 0" }}>
                    <p style={{ color: "#ef4444", fontWeight: 600, marginBottom: "10px" }}>⚠️ DİKKAT: Kalıcı İşlem!</p>
                    <p><strong>{selectedUser?.name}</strong> adlı kullanıcıyı silmek üzeresiniz.</p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}>
                    <button onClick={() => setIsDeleteDialogOpen(false)} className="modern-btn-cancel">İptal</button>
                    <button onClick={handleDelete} className="modern-btn-save" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)" }}>Evet, Kalıcı Olarak Sil</button>
                </div>
            </Modal>

            {/* DOCTOR ADVANCED SETTINGS MODAL */}
            <Modal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} title={`${selectedUser?.name || 'Doktor'} - Gelişmiş Yönetsel Ayarlar`} minWidth="850px">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", marginTop: "16px" }}>

                    {/* LEFT COLUMN: EDIT FORM */}
                    <form onSubmit={handleDoctorSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

                        {/* Section 1: Core Config */}
                        <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiActivity color="#3b82f6" /> Temel Operasyon Ayarları
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                                <div>
                                    <label className="modern-label">Branş Atama</label>
                                    <select className="modern-input" value={doctorForm.specialty} onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })} required>
                                        <option value="" disabled>Seçiniz</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="modern-label">Sistem Durumu</label>
                                    <select className="modern-input" value={doctorForm.isOnline ? "true" : "false"} onChange={e => setDoctorForm({ ...doctorForm, isOnline: e.target.value === "true" })}>
                                        <option value="true">✅ Aktif (Randevu Alabilir)</option>
                                        <option value="false">⛔ Pasif (Randevuya Kapalı)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                <div>
                                    <label className="modern-label">Günlük Hasta Kotası</label>
                                    <input type="number" min="1" className="modern-input" value={doctorForm.dailyPatientLimit} onChange={e => setDoctorForm({ ...doctorForm, dailyPatientLimit: e.target.value })} />
                                </div>
                                <div>
                                    <label className="modern-label">Aylık Maaş / Hakediş (₺)</label>
                                    <div style={{ position: "relative" }}>
                                        <FiDollarSign style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px" }} />
                                        <input type="number" step="1000" className="modern-input" style={{ paddingLeft: "42px", fontWeight: 600, color: "#16a34a" }} value={doctorForm.salary} onChange={e => setDoctorForm({ ...doctorForm, salary: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Schedule */}
                        <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FiClock color="#8b5cf6" /> Çalışma Saatleri Matrisi
                                </h3>
                                <span style={{ fontSize: "12px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px", color: "#64748b", fontWeight: 600 }}>SS:DD-SS:DD Formatı</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                    const trDays = { monday: "Pazartesi", tuesday: "Salı", wednesday: "Çarşamba", thursday: "Perşembe", friday: "Cuma", saturday: "Cumartesi", sunday: "Pazar" };
                                    const isWeekend = day === 'saturday' || day === 'sunday';

                                    const val = doctorForm.workingHours[day] || "tatil";
                                    const isTatil = val === 'tatil';
                                    const [startVal, endVal] = isTatil ? ["09:00", "17:00"] : val.split("-");

                                    // Generate time slots 08:00 to 20:00 every 30 mins
                                    const timeSlots = [];
                                    for (let h = 8; h <= 20; h++) {
                                        const hStr = h.toString().padStart(2, '0');
                                        timeSlots.push(`${hStr}:00`);
                                        if (h !== 20) timeSlots.push(`${hStr}:30`);
                                    }

                                    return (
                                        <div key={day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: isWeekend ? "#fffbeb" : "#f8fafc", borderRadius: "10px", border: `1px solid ${isWeekend ? '#fde68a' : '#f1f5f9'}` }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "140px" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!isTatil}
                                                    onChange={(e) => handleAdvancedTimeChange(day, 'tatil', e.target.checked ? "09:00-17:00" : "tatil")}
                                                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#3b82f6" }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: 700, color: !isTatil ? (isWeekend ? '#b45309' : '#334155') : '#94a3b8' }}>{trDays[day]}</span>
                                            </div>

                                            {isTatil ? (
                                                <span style={{ width: "260px", textAlign: "center", fontSize: "13px", color: "#94a3b8", fontWeight: 600, background: "rgba(148, 163, 184, 0.1)", padding: "6px 0", borderRadius: "8px" }}>İZİNLİ / TATİL</span>
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "260px" }}>
                                                    <select
                                                        className="modern-input"
                                                        style={{ padding: "8px", background: "white", textAlign: "center", fontWeight: 600 }}
                                                        value={startVal}
                                                        onChange={(e) => handleAdvancedTimeChange(day, 'start', e.target.value)}
                                                    >
                                                        {timeSlots.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                                                    </select>
                                                    <span style={{ color: "#94a3b8", fontWeight: 600 }}>-</span>
                                                    <select
                                                        className="modern-input"
                                                        style={{ padding: "8px", background: "white", textAlign: "center", fontWeight: 600 }}
                                                        value={endVal}
                                                        onChange={(e) => handleAdvancedTimeChange(day, 'end', e.target.value)}
                                                    >
                                                        {timeSlots.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "10px" }}>
                            <button type="button" onClick={() => setIsDoctorModalOpen(false)} className="modern-btn-cancel">İptal Et</button>
                            <button type="submit" className="modern-btn-save" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px" }}>
                                Ayarları Şifrele ve Kaydet
                            </button>
                        </div>
                    </form>

                    {/* RIGHT COLUMN: PERFORMANCE STATS */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "16px", padding: "24px", color: "white", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}>
                            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiActivity color="#60a5fa" /> Gerçek Zamanlı Metrikler
                            </h3>
                            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Sistem veritabanından anlık çekiliyor.</p>
                        </div>

                        {!doctorStats ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>Analiz Yükleniyor...</div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                                <div className="stat-card" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
                                    <div className="stat-card-title">Toplam Randevu Hacmi</div>
                                    <div className="stat-card-value">{doctorStats.totalAppointments}</div>
                                </div>
                                <div className="stat-card" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
                                    <div className="stat-card-title">Genel Klinik Puanı</div>
                                    <div className="stat-card-value">
                                        {doctorStats.averageRating}
                                        <span style={{ fontSize: "18px" }}>★</span>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}>
                                    <div className="stat-card-title">Bekleyen Muayeneler</div>
                                    <div className="stat-card-value">{doctorStats.upcomingAppointments}</div>
                                </div>
                                <div className="stat-card" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                                    <div className="stat-card-title">Tamamlanmış Randevular</div>
                                    <div className="stat-card-value">{doctorStats.completedAppointments}</div>
                                </div>
                            </div>
                        )}
                        <div style={{ marginTop: "auto", padding: "16px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                            <p style={{ margin: 0, fontSize: "12px", color: "#b91c1c", lineHeight: "1.5" }}>
                                <strong>Bilgi:</strong> Yapılan değişiklikler doktorun aktif randevularını etkileyebilir. Kota düşürme işlemleri geriye dönük randevuları iptal etmez.
                            </p>
                        </div>
                    </div>

                </div>
            </Modal>
        </div>
    );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { patientsApi, adminApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PatientCard from "../components/PatientCard";
import Modal from "../components/Modal";
import {
    FiPlus, FiSearch, FiAlertTriangle, FiFilter, FiX,
    FiChevronDown, FiArrowUp, FiArrowDown
} from "react-icons/fi";

export default function PatientsPage() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & filters
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterGender, setFilterGender] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterBloodType, setFilterBloodType] = useState("all");
    const [filterAgeMin, setFilterAgeMin] = useState("");
    const [filterAgeMax, setFilterAgeMax] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [showFilters, setShowFilters] = useState(false);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [newPatient, setNewPatient] = useState({
        name: "", age: "", gender: "Erkek", phone: "", email: "", bloodType: "A+", doctorId: ""
    });

    // Admin specific state
    const { user  } = useAuth();
    const [allDoctors, setAllDoctors] = useState([]);

    // Debounce search input
    const debounceRef = useRef(null);
    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
    }, []);

    // Fetch patients from backend
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const params = {};
                if (debouncedSearch) params.search = debouncedSearch;
                if (filterStatus !== "all") params.status = filterStatus;
                if (sortBy !== "createdAt") params.sort = sortBy;

                const data = await patientsApi.getAll(params);
                setPatients(data);

                if (user?.isAdmin) {
                    const docs = await adminApi.getDoctors();
                    setAllDoctors(docs);
                    if (docs.length > 0 && !newPatient.doctorId) {
                        setNewPatient(prev => ({ ...prev, doctorId: docs[0]._id }));
                    }
                }
            } catch (err) {
                console.error("Veri yüklenemedi:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [debouncedSearch, filterStatus, sortBy, user]);

    // Client-side filters (gender, blood type, age range)
    const filteredPatients = patients.filter((p) => {
        if (filterGender !== "all" && p.gender !== filterGender) return false;
        if (filterBloodType !== "all" && p.bloodType !== filterBloodType) return false;
        if (filterAgeMin && p.age < parseInt(filterAgeMin)) return false;
        if (filterAgeMax && p.age > parseInt(filterAgeMax)) return false;
        return true;
    });

    // Count active filters (excluding defaults)
    const activeFilterCount = [
        filterGender !== "all",
        filterStatus !== "all",
        filterBloodType !== "all",
        filterAgeMin !== "",
        filterAgeMax !== "",
        sortBy !== "createdAt",
    ].filter(Boolean).length;

    const clearFilters = () => {
        setFilterGender("all");
        setFilterStatus("all");
        setFilterBloodType("all");
        setFilterAgeMin("");
        setFilterAgeMax("");
        setSortBy("createdAt");
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        try {
            const created = await patientsApi.create({
                ...newPatient,
                age: parseInt(newPatient.age),
            });
            setPatients([created, ...patients]);
            setIsModalOpen(false);
            setNewPatient({ name: "", age: "", gender: "Erkek", phone: "", email: "", bloodType: "A+" });
        } catch (err) {
            alert("Hasta eklenemedi: " + err.message);
        }
    };

    const handleDeletePatient = async (id) => {
        try {
            await patientsApi.delete(id);
            setPatients(patients.filter(p => p._id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            alert("Hasta silinemedi: " + err.message);
        }
    };

    const askDelete = (id) => {
        const p = patients.find(p => p._id === id);
        setDeleteConfirm({ id, name: p?.name || "Hasta" });
    };

    // Shared styles
    const pillStyle = (isActive) => ({
        padding: "6px 14px", borderRadius: "8px", border: "1px solid",
        borderColor: isActive ? "#ef4444" : "#e5e7eb",
        background: isActive ? "#fef2f2" : "white",
        color: isActive ? "#ef4444" : "#6b7280",
        fontSize: "12px", fontWeight: 600, cursor: "pointer",
        transition: "all 0.2s", whiteSpace: "nowrap",
    });

    const selectStyle = {
        padding: "7px 12px", borderRadius: "8px", border: "1px solid #e5e7eb",
        background: "white", fontSize: "12px", fontWeight: 600, color: "#374151",
        cursor: "pointer", outline: "none", transition: "all 0.2s",
        minWidth: "120px",
    };

    const miniInputStyle = {
        width: "70px", padding: "7px 10px", borderRadius: "8px",
        border: "1px solid #e5e7eb", fontSize: "12px", color: "#374151",
        outline: "none", textAlign: "center",
    };

    if (loading && patients.length === 0) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div style={{ fontSize: "16px", color: "#9ca3af" }}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Hastalarım</h1>
                <p>Kayıtlı hastalarınızı yönetin</p>
            </div>

            <div className="header-bar">
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "1 1 240px", maxWidth: "360px" }}>
                        <span style={{
                            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                            color: "#9ca3af", pointerEvents: "none",
                        }}>
                            <FiSearch size={15} />
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Ad, e-posta veya telefon ile ara..."
                            style={{
                                width: "100%", padding: "9px 14px 9px 36px", borderRadius: "10px",
                                border: "1px solid #e5e7eb", fontSize: "13px", color: "#111827",
                                outline: "none", transition: "all 0.2s", background: "#fafafa",
                            }}
                            onFocus={e => e.target.style.borderColor = "#ef4444"}
                            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                        />
                    </div>

                    {/* Filter toggle button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            ...pillStyle(showFilters || activeFilterCount > 0),
                            display: "flex", alignItems: "center", gap: "5px",
                            position: "relative",
                        }}
                    >
                        <FiFilter size={13} />
                        Filtreler
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: "#ef4444", color: "white", borderRadius: "50%",
                                width: 18, height: 18, fontSize: "10px", fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginLeft: "2px",
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Result count */}
                    <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {filteredPatients.length} hasta
                    </span>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}
                        style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <FiPlus size={15} /> Yeni Hasta
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="glass-card animate-fade-in" style={{
                    padding: "16px 20px", marginBottom: "16px",
                    display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end",
                }}>
                    {/* Status filter */}
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Durum
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                            {[
                                { label: "Tümü", value: "all" },
                                { label: "Aktif", value: "active" },
                                { label: "Pasif", value: "inactive" },
                                { label: "Arşiv", value: "archived" },
                            ].map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilterStatus(f.value)}
                                    style={pillStyle(filterStatus === f.value)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gender filter */}
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Cinsiyet
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                            {[
                                { label: "Tümü", value: "all" },
                                { label: "Kadın", value: "Kadın" },
                                { label: "Erkek", value: "Erkek" },
                            ].map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilterGender(f.value)}
                                    style={pillStyle(filterGender === f.value)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Blood type filter */}
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Kan Grubu
                        </div>
                        <select
                            value={filterBloodType}
                            onChange={(e) => setFilterBloodType(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="all">Tümü</option>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                                <option key={bt} value={bt}>{bt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Age range */}
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Yaş Aralığı
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filterAgeMin}
                                onChange={(e) => setFilterAgeMin(e.target.value)}
                                style={miniInputStyle}
                                min="0" max="150"
                            />
                            <span style={{ color: "#d1d5db", fontSize: "13px" }}>—</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filterAgeMax}
                                onChange={(e) => setFilterAgeMax(e.target.value)}
                                style={miniInputStyle}
                                min="0" max="150"
                            />
                        </div>
                    </div>

                    {/* Sort */}
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Sıralama
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="createdAt">Kayıt Tarihi (Yeni)</option>
                            <option value="name">İsim (A-Z)</option>
                            <option value="age">Yaş (Büyük)</option>
                            <option value="registeredDate">Kayıt Tarihi (Eski)</option>
                        </select>
                    </div>

                    {/* Clear filters */}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearFilters}
                            style={{
                                padding: "7px 14px", borderRadius: "8px", border: "1px solid #fecaca",
                                background: "#fef2f2", color: "#ef4444", fontSize: "12px",
                                fontWeight: 600, cursor: "pointer", display: "flex",
                                alignItems: "center", gap: "4px", transition: "all 0.2s",
                                alignSelf: "flex-end",
                            }}
                        >
                            <FiX size={12} /> Temizle
                        </button>
                    )}
                </div>
            )}

            {/* Patient Grid */}
            {filteredPatients.length > 0 ? (
                <div className="patients-grid">
                    {filteredPatients.map((patient, idx) => (
                        <PatientCard
                            key={patient._id}
                            patient={patient}
                            onClick={(id) => navigate(`/patients/${id}`)}
                            onDelete={askDelete}
                            delay={idx * 60}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ opacity: 0.4 }}><FiSearch size={48} /></div>
                    <h3>Hasta bulunamadı</h3>
                    <p>Arama veya filtre kriterlerinize uygun hasta yok.</p>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearFilters}
                            style={{
                                marginTop: "12px", padding: "8px 18px", borderRadius: "10px",
                                border: "none", background: "#ef4444", color: "white",
                                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                            }}
                        >
                            Filtreleri Temizle
                        </button>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hasta Sil">
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        background: "#fef2f2", margin: "0 auto 16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <FiAlertTriangle size={26} color="#ef4444" />
                    </div>
                    <h3 style={{ fontSize: "16px", color: "#111827", marginBottom: "8px" }}>
                        Emin misiniz?
                    </h3>
                    <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>
                        <strong style={{ color: "#ef4444" }}>{deleteConfirm?.name}</strong> adlı hastayı
                        kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.
                    </p>
                </div>
                <div className="modal-footer" style={{ justifyContent: "center", gap: "12px" }}>
                    <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                        İptal
                    </button>
                    <button
                        className="btn"
                        onClick={() => handleDeletePatient(deleteConfirm.id)}
                        style={{
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "white", border: "none", padding: "8px 20px",
                            borderRadius: "10px", fontWeight: 600, cursor: "pointer",
                        }}
                    >
                        Evet, Sil
                    </button>
                </div>
            </Modal>

            {/* Add Patient Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Yeni Hasta Ekle"
            >
                <form onSubmit={handleAddPatient}>
                    <div className="form-group">
                        <label>Ad Soyad</label>
                        <input
                            type="text" className="form-control"
                            placeholder="Hasta adı soyadı"
                            value={newPatient.name}
                            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Yaş</label>
                            <input
                                type="number" className="form-control"
                                placeholder="Yaş"
                                value={newPatient.age}
                                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Cinsiyet</label>
                            <select
                                className="form-control"
                                value={newPatient.gender}
                                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                            >
                                <option value="Erkek">Erkek</option>
                                <option value="Kadın">Kadın</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Telefon</label>
                            <input
                                type="text" className="form-control"
                                placeholder="0532 000 0000"
                                value={newPatient.phone}
                                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Kan Grubu</label>
                            <select
                                className="form-control"
                                value={newPatient.bloodType}
                                onChange={(e) => setNewPatient({ ...newPatient, bloodType: e.target.value })}
                            >
                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                                    <option key={bt} value={bt}>{bt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>E-posta</label>
                            <input
                                type="email" className="form-control"
                                placeholder="hasta@mail.com"
                                value={newPatient.email}
                                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                            />
                        </div>

                        {user?.isAdmin && (
                            <div className="form-group">
                                <label>Sorumlu Doktor</label>
                                <select
                                    className="form-control"
                                    value={newPatient.doctorId}
                                    onChange={(e) => setNewPatient({ ...newPatient, doctorId: e.target.value })}
                                    required
                                >
                                    {allDoctors.map(doc => (
                                        <option key={doc._id} value={doc._id}>{doc.name} ({doc.specialty})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            İptal
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Hasta Ekle
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

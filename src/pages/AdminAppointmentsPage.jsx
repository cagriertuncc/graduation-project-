import { useState, useEffect } from "react";
import { adminAppointmentsApi } from "../services/api";
import { FiCalendar, FiXCircle, FiActivity, FiClock, FiSearch, FiCheckCircle } from "react-icons/fi";
import { RiBrainLine } from "react-icons/ri";

export default function AdminAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [smartSlots, setSmartSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [apptsData, analyticsData, smartData] = await Promise.all([
                adminAppointmentsApi.getAll(),
                adminAppointmentsApi.getAnalytics(),
                adminAppointmentsApi.getSmartSlots()
            ]);
            setAppointments(apptsData);
            setAnalytics(analyticsData);
            setSmartSlots(smartData);
        } catch (error) {
            console.error("Veriler alınamadı:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) return;
        try {
            await adminAppointmentsApi.cancel(id);
            fetchData();
        } catch (error) {
            alert("İptal işlemi başarısız: " + error.message);
        }
    };

    const filteredAppts = appointments.filter(a => {
        const searchStr = searchTerm.toLowerCase();
        return (
            a.patientId?.name?.toLowerCase().includes(searchStr) ||
            a.doctorId?.name?.toLowerCase().includes(searchStr) ||
            a.doctorId?.specialty?.toLowerCase().includes(searchStr)
        );
    });

    if (loading) return <div style={{ padding: "40px", color: "white" }}>Yükleniyor...</div>;

    return (
        <div className="admin-dashboard-v2 animate-fade-in" style={{ color: "white", paddingBottom: "40px" }}>
            <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #60a5fa, #93c5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Merkezi Randevu Yönetimi
                    </h1>
                    <p style={{ color: "#94a3b8", margin: 0 }}>Sistemdeki tüm randevuları takip edin, analizleri inceleyin ve kapasiteyi yönetin.</p>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                {/* Density Analysis */}
                <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b" }}>
                        <FiActivity /> Branş Yoğunluk Analizi
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {analytics?.departmentDensity?.length > 0 ? analytics.departmentDensity.map((d, i) => (
                            <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                                    <span>{d._id || "Bilinmiyor"}</span>
                                    <span style={{ fontWeight: 600 }}>{d.count} Randevu</span>
                                </div>
                                <div style={{ height: "6px", background: "#334155", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min(100, (d.count / (analytics.departmentDensity[0].count || 1)) * 100)}%`, background: "#f59e0b" }}></div>
                                </div>
                            </div>
                        )) : (
                            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Yeterli veri bulunamadı.</p>
                        )}
                    </div>
                </div>

                {/* Occupancy Rate */}
                <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px", color: "#3b82f6" }}>
                        <FiClock /> Haftalık Doluluk Oranı
                    </h2>
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: "48px", fontWeight: 800, color: "white", marginBottom: "8px" }}>
                            %{analytics?.weeklyStats?.occupancyRate || 0}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "16px" }}>
                            Gelecek 7 gün için kapasite kullanımı
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-around", fontSize: "13px", color: "#cbd5e1" }}>
                            <div>
                                <div style={{ color: "#94a3b8" }}>Planlanmış</div>
                                <div style={{ fontWeight: 600, fontSize: "16px" }}>{analytics?.weeklyStats?.totalBooked || 0}</div>
                            </div>
                            <div>
                                <div style={{ color: "#94a3b8" }}>Haftalık Kapasite</div>
                                <div style={{ fontWeight: 600, fontSize: "16px" }}>~{analytics?.weeklyStats?.capacity || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Smart Slots */}
                <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px", color: "#10b981" }}>
                        <RiBrainLine size={20} /> Akıllı Boş Slot Önerisi
                    </h2>
                    <p style={{ fontSize: "13px", color: "#cbd5e1", opacity: 0.9, marginBottom: "16px" }}>
                        Sıradaki 14 gün için en müsait alanlar ve doktorlar listelenmiştir. Yoğunluğu dağıtabilirsiniz.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {smartSlots.map((slot, idx) => (
                            <div key={idx} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: "white", fontSize: "14px" }}>Dr. {slot.doctor.name}</div>
                                    <div style={{ fontSize: "12px", color: "#10b981" }}>{slot.doctor.specialty}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>Sadece {slot.upcomingCount} Randevusu Var</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Global Appointment Table */}
            <div style={{ background: "#1e293b", borderRadius: "16px", padding: "24px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Sistemdeki Tüm Randevular</h2>
                    <div style={{ position: "relative", width: "300px" }}>
                        <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Hasta, doktor veya branş ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px",
                                background: "#0f172a", border: "1px solid #334155", color: "white", outline: "none"
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
                                <th style={{ padding: "16px 12px" }}>Tarih / Saat</th>
                                <th style={{ padding: "16px 12px" }}>Hasta</th>
                                <th style={{ padding: "16px 12px" }}>Doktor / Branş</th>
                                <th style={{ padding: "16px 12px" }}>Durum</th>
                                <th style={{ padding: "16px 12px", textAlign: "right" }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppts.map(a => (
                                <tr key={a._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: a.status === "iptal" ? 0.5 : 1 }}>
                                    <td style={{ padding: "16px 12px" }}>
                                        <div style={{ fontWeight: 600 }}>{new Date(a.date).toLocaleDateString("tr-TR")}</div>
                                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{a.time} ({a.duration} dk)</div>
                                    </td>
                                    <td style={{ padding: "16px 12px" }}>
                                        <div style={{ fontWeight: 500 }}>{a.patientId?.name || "Bilinmiyor"}</div>
                                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{a.patientId?.phone || "-"}</div>
                                    </td>
                                    <td style={{ padding: "16px 12px" }}>
                                        <div style={{ fontWeight: 500 }}>Dr. {a.doctorId?.name || "Silinmiş Doktor"}</div>
                                        <div style={{ fontSize: "12px", color: "#3b82f6" }}>{a.doctorId?.specialty}</div>
                                    </td>
                                    <td style={{ padding: "16px 12px" }}>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                                            background: a.status === "tamamlandı" ? "rgba(16, 185, 129, 0.1)" : a.status === "iptal" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                            color: a.status === "tamamlandı" ? "#10b981" : a.status === "iptal" ? "#ef4444" : "#f59e0b"
                                        }}>
                                            {a.status === "tamamlandı" ? "Tamamlandı" : a.status === "iptal" ? "İptal Edildi" : "Bekliyor"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                        {a.status === "bekliyor" && (
                                            <button
                                                onClick={() => handleCancel(a._id)}
                                                style={{
                                                    background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)",
                                                    padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                                                    display: "inline-flex", alignItems: "center", gap: "6px"
                                                }}
                                            >
                                                <FiXCircle /> İptal Et
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredAppts.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Randevu bulunamadı.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

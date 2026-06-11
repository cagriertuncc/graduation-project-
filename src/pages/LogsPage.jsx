import { useState, useEffect, useRef } from "react";
import { adminApi } from "../services/api";
import { FiDatabase, FiSearch, FiAlertTriangle, FiCheckCircle, FiInfo, FiAlertOctagon, FiUser, FiClock, FiLayers, FiDownload, FiFileText } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import html2pdf from "html2pdf.js";

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const tableRef = useRef(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingCSV, setIsExportingCSV] = useState(false);

    // Export logs as CSV
    const handleExportCSV = () => {
        setIsExportingCSV(true);
        try {
            const headers = ["Tarih / Saat", "İşlem Eylemi", "Operatör", "Detaylar", "Durum"];
            const rows = filteredLogs.map(log => [
                new Date(log.createdAt).toLocaleString("tr-TR"),
                log.action || "",
                log.user || "",
                log.details || "",
                log.status === "success" ? "Başarılı" : log.status === "warning" ? "Uyarı" : log.status === "error" ? "Hata" : "Bilgi"
            ]);
            
            // Add BOM (\uFEFF) for Turkish character support in Excel
            const csvContent = "\uFEFF" + [
                headers.join(","),
                ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `MediTrack_Sistem_Loglari_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Loglar başarıyla CSV formatında indirildi.");
        } catch (error) {
            toast.error("CSV indirme hatası: " + error.message);
        } finally {
            setIsExportingCSV(false);
        }
    };

    // Export logs as PDF
    const handleExportPDF = () => {
        if (!tableRef.current) return;
        setIsExportingPDF(true);
        
        setTimeout(() => {
            const element = tableRef.current;
            
            // Temporarily find the scroll container and adjust heights to show all logs in PDF
            const scrollContainer = element.querySelector(".logs-table-scroll-container");
            const originalMaxHeight = scrollContainer ? scrollContainer.style.maxHeight : "";
            const originalOverflowY = scrollContainer ? scrollContainer.style.overflowY : "";
            
            if (scrollContainer) {
                scrollContainer.style.maxHeight = "none";
                scrollContainer.style.overflowY = "visible";
            }
            
            const opt = {
                margin: 10,
                filename: `MediTrack_Sistem_Loglari_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#020617', // Slate 950 to match table background theme
                    logging: false,
                    windowWidth: 1200
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                // Restore original styles
                if (scrollContainer) {
                    scrollContainer.style.maxHeight = originalMaxHeight;
                    scrollContainer.style.overflowY = originalOverflowY;
                }
                setIsExportingPDF(false);
                toast.success("Loglar başarıyla PDF formatında indirildi.");
            }).catch((err) => {
                console.error("PDF generation error:", err);
                // Restore original styles on error
                if (scrollContainer) {
                    scrollContainer.style.maxHeight = originalMaxHeight;
                    scrollContainer.style.overflowY = originalOverflowY;
                }
                setIsExportingPDF(false);
                toast.error("PDF oluşturulamadı: " + err.message);
            });
        }, 300);
    };

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await adminApi.getLogs();
                setLogs(data || []);
            } catch (error) {
                toast.error("Sistem günlükleri yüklenemedi: " + error.message);
                console.error("Logs fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // Filtered logs
    const filteredLogs = logs.filter(log => {
        const actionMatch = log.action?.toLowerCase().includes(searchTerm.toLowerCase());
        const userMatch = log.user?.toLowerCase().includes(searchTerm.toLowerCase());
        const detailsMatch = log.details?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = actionMatch || userMatch || detailsMatch;

        const matchesStatus = statusFilter === "all" || log.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Counts for stats
    const totalCount = filteredLogs.length;
    const successCount = filteredLogs.filter(l => l.status === "success").length;
    const warningCount = filteredLogs.filter(l => l.status === "warning").length;
    const errorCount = filteredLogs.filter(l => l.status === "error").length;

    const getStatusStyle = (status) => {
        switch (status) {
            case "success":
                return { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)", icon: <FiCheckCircle /> };
            case "warning":
                return { bg: "rgba(245, 158, 11, 0.12)", text: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)", icon: <FiAlertTriangle /> };
            case "error":
                return { bg: "rgba(239, 68, 68, 0.12)", text: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)", icon: <FiAlertOctagon /> };
            default:
                return { bg: "rgba(59, 130, 246, 0.12)", text: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.25)", icon: <FiInfo /> };
        }
    };

    return (
        <div className="animate-fade-in" style={{ color: "white" }}>
            <Toaster position="top-right" />
            
            {/* Header section */}
            <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#a855f7", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
                        <FiDatabase /> GÜVENLİK VE UYUMLULUK
                    </div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Sistem Denetim Günlükleri
                    </h1>
                    <p style={{ color: "#64748b", margin: 0 }}>Sistem üzerinde gerçekleştirilen tüm kritik eylemler ve IT operasyonlarının denetim kayıtları.</p>
                </div>
                
                {/* Export Buttons */}
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={handleExportCSV}
                        disabled={isExportingCSV || filteredLogs.length === 0}
                        style={{
                            background: "#0f172a",
                            color: "#e2e8f0",
                            border: "1px solid #334155",
                            padding: "10px 18px",
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: filteredLogs.length === 0 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s",
                            opacity: (isExportingCSV || filteredLogs.length === 0) ? 0.6 : 1
                        }}
                        onMouseEnter={e => {
                            if (filteredLogs.length > 0) e.currentTarget.style.background = "#1e293b";
                        }}
                        onMouseLeave={e => {
                            if (filteredLogs.length > 0) e.currentTarget.style.background = "#0f172a";
                        }}
                    >
                        <FiFileText size={16} />
                        {isExportingCSV ? "Aktarılıyor..." : "CSV Dışa Aktar"}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExportingPDF || filteredLogs.length === 0}
                        style={{
                            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                            color: "white",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: filteredLogs.length === 0 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: filteredLogs.length === 0 ? "none" : "0 4px 12px rgba(239, 68, 68, 0.2)",
                            transition: "all 0.2s",
                            opacity: (isExportingPDF || filteredLogs.length === 0) ? 0.6 : 1
                        }}
                        onMouseEnter={e => {
                            if (filteredLogs.length > 0) e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={e => {
                            if (filteredLogs.length > 0) e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        <FiDownload size={16} />
                        {isExportingPDF ? "Aktarılıyor..." : "PDF Dışa Aktar"}
                    </button>
                </div>
            </div>

            {/* Stats section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <div style={{ background: "rgba(30, 41, 59, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiLayers color="#cbd5e1" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Toplam İşlem</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "white" }}>{totalCount}</div>
                    </div>
                </div>

                <div style={{ background: "rgba(30, 41, 59, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiCheckCircle color="#10b981" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Başarılı Eylemler</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>{successCount}</div>
                    </div>
                </div>

                <div style={{ background: "rgba(30, 41, 59, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiAlertTriangle color="#f59e0b" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Sistem Uyarıları</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#f59e0b" }}>{warningCount}</div>
                    </div>
                </div>

                <div style={{ background: "rgba(30, 41, 59, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <FiAlertOctagon color="#ef4444" />
                    </div>
                    <div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Hata Kayıtları</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#ef4444" }}>{errorCount}</div>
                    </div>
                </div>
            </div>

            {/* Filters layer */}
            <div style={{ background: "rgba(30, 41, 59, 0.6)", backdropFilter: "blur(12px)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 2, minWidth: "250px" }}>
                        <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "16px" }} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="İşlem, detay veya kullanıcı ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%", padding: "12px 16px 12px 42px",
                                background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "10px", color: "white", outline: "none", fontSize: "14px",
                                transition: "all 0.2s ease", boxSizing: "border-box"
                            }}
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: "150px" }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: "100%", padding: "12px", background: "rgba(0, 0, 0, 0.25)",
                                border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "10px", color: "white",
                                outline: "none", fontSize: "14px", cursor: "pointer"
                            }}
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="success">Başarılı (Success)</option>
                            <option value="warning">Uyarı (Warning)</option>
                            <option value="info">Bilgi (Info)</option>
                            <option value="error">Hata (Error)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs list */}
            <div id="printable-logs-table" ref={tableRef} style={{ background: "rgba(30, 41, 59, 0.6)", backdropFilter: "blur(12px)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Günlükler yükleniyor...</div>
                ) : filteredLogs.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                        <FiDatabase size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
                        <div>Kayıtlı sistem denetim günlüğü bulunamadı.</div>
                    </div>
                ) : (
                    <div className="logs-table-scroll-container" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                        <table className="data-table">
                            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={{ width: "200px" }}>Tarih / Saat</th>
                                    <th style={{ width: "180px" }}>İşlem Eylemi</th>
                                    <th style={{ width: "180px" }}>Operatör</th>
                                    <th>Detaylar</th>
                                    <th style={{ width: "120px", textAlign: "right" }}>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => {
                                    const style = getStatusStyle(log.status);
                                    return (
                                        <tr key={log._id}>
                                            <td style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <FiClock size={13} />
                                                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: "white" }}>{log.action}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
                                                    <FiUser size={13} color="#94a3b8" />
                                                    <span style={{ fontSize: "13px" }}>{log.user}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }}>
                                                {log.details || "-"}
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <span style={{
                                                    padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                                                    background: style.bg, color: style.text, border: style.border,
                                                    display: "inline-flex", alignItems: "center", gap: "6px", textTransform: "uppercase"
                                                }}>
                                                    {style.icon}
                                                    {log.status === "success" ? "Başarılı" : log.status === "warning" ? "Uyarı" : log.status === "error" ? "Hata" : "Bilgi"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
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
                .search-input:focus {
                    border-color: #3b82f6 !important;
                    background: rgba(0, 0, 0, 0.4) !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
                }
            `}</style>
        </div>
    );
}

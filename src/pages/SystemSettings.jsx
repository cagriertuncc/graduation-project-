import { useState, useEffect } from "react";
import { FiSettings, FiSave, FiAlertTriangle, FiGlobe, FiBell, FiDownload, FiDatabase } from "react-icons/fi";
import { adminApi } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function SystemSettings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        hospitalName: "",
        contactEmail: "",
        maxAppointmentsPerDay: 40,
        maintenanceMode: false,
        emergencyLockdown: false,
        emailNotifications: true,
        smsNotifications: false
    });

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await adminApi.getSettings();
                setSettings({
                    hospitalName: data.hospitalName || "",
                    contactEmail: data.contactEmail || "",
                    maxAppointmentsPerDay: data.maxAppointmentsPerDay || 40,
                    maintenanceMode: data.maintenanceMode || false,
                    emergencyLockdown: data.emergencyLockdown || false,
                    emailNotifications: data.emailNotifications ?? true,
                    smsNotifications: data.smsNotifications || false
                });
            } catch (error) {
                toast.error("Ayarlar yüklenemedi: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await adminApi.updateSettings(settings);
            toast.success("Ayarlar başarıyla kaydedildi.");
        } catch (error) {
            toast.error("Kaydetme hatası: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const response = await adminApi.getBackup();

            // Trigger file download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", response.file);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            toast.success("Veritabanı yedeği başarıyla alındı.");
        } catch (error) {
            toast.error("Yedekleme başarısız: " + error.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    if (loading) {
        return <div style={{ padding: "40px", color: "#6b7280" }}>Ayarlar Yükleniyor...</div>;
    }

    if (user?.specialty !== "Bilgi İşlem Müdürü") {
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
                    <FiAlertTriangle size={64} color="#ef4444" style={{ marginBottom: "20px" }} />
                    <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>Yetkisiz Erişim</h2>
                    <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                        Bu sayfa sadece <strong>Bilgi İşlem Müdürü</strong> yetkisine sahip kullanıcıların erişimine açıktır. Mevcut ünvanınız (<strong>{user?.specialty || "Belirsiz"}</strong>) ile bu ayarları değiştiremezsiniz.
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
        <div className="animate-fade-in" style={{ color: "white", maxWidth: "800px" }}>
            <Toaster position="top-right" />
            <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Sistem Ayarları
                    </h1>
                    <p style={{ color: "#64748b", margin: 0 }}>Genel hastane konfigürasyonu, bildirim tercihleri ve güvenlik protokolleri.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        background: "#10b981", color: "white", border: "none",
                        padding: "12px 24px", borderRadius: "12px", fontWeight: 600,
                        cursor: isSaving ? "wait" : "pointer", opacity: isSaving ? 0.7 : 1,
                        display: "flex", alignItems: "center", gap: "8px"
                    }}
                >
                    <FiSave /> {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Genel Ayarlar */}
                <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "24px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px", color: "#3b82f6" }}>
                        <FiGlobe /> Kurum Bilgileri
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div className="form-group">
                            <label style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px", display: "block" }}>Hastane / Kurum Adı</label>
                            <input
                                type="text"
                                value={settings.hospitalName}
                                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                                style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", boxSizing: "border-box" }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px", display: "block" }}>İletişim E-postas</label>
                            <input
                                type="email"
                                value={settings.contactEmail}
                                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>
                </div>

                {/* İşleyiş Ayarları */}
                <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "24px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px", color: "#8b5cf6" }}>
                        <FiSettings /> Poliklinik İşleyişi
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div className="form-group">
                            <label style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px", display: "block" }}>Günlük Maksimum Randevu (Doktor Başına)</label>
                            <input
                                type="number"
                                value={settings.maxAppointmentsPerDay}
                                onChange={(e) => setSettings({ ...settings, maxAppointmentsPerDay: e.target.value })}
                                style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #334155" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#cbd5e1", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiBell /> Bildirim Sistemi
                        </h3>
                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "12px" }}>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                style={{ width: "18px", height: "18px", accentColor: "#3b82f6" }}
                            />
                            <span style={{ fontSize: "14px" }}>E-posta Bildirimlerini Etkinleştir (Randevu Onayı, İptaller vs.)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={settings.smsNotifications}
                                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                                style={{ width: "18px", height: "18px", accentColor: "#3b82f6" }}
                            />
                            <span style={{ fontSize: "14px" }}>SMS Bildirimlerini Etkinleştir (Aylık Ek Maliyet: 500₺)</span>
                        </label>
                    </div>
                </div>

                {/* Veritabanı ve Kritik İşlemler */}
                <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "24px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px", color: "#10b981" }}>
                        <FiDatabase /> Veri Yönetimi
                    </h2>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", marginBottom: "20px" }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>Sistem Yedeği Al</div>
                            <div style={{ fontSize: "12px", color: "#94a3b8", maxWidth: "400px" }}>Tüm kullanıcı, muayene, randevu ve sistem ayarı koleksiyonlarının güncel JSON dökümünü oluşturarak bilgisayarınıza indirir.</div>
                        </div>
                        <button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            style={{ background: "#3b82f6", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: 600, cursor: isBackingUp ? "wait" : "pointer", opacity: isBackingUp ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <FiDownload /> {isBackingUp ? "Yedekleniyor..." : "Veritabanını Yedekle"}
                        </button>
                    </div>
                </div>

                {/* Kritik Kontroller */}
                <div style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)", borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "24px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px", color: "#ef4444" }}>
                        <FiAlertTriangle /> Güvenlik ve Acil Durum Protokolleri
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>Sistem Bakım Modu</div>
                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>Sistemi sadece adminlerin erişimine açar. Tüm doktor ve hastaların erişimi durdurulur.</div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                />
                                <span className="slider round" style={{ background: settings.maintenanceMode ? "#f59e0b" : "#475569" }}></span>
                            </label>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: settings.emergencyLockdown ? "1px solid #ef4444" : "1px solid transparent" }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "14px", color: "#ef4444", marginBottom: "4px" }}>Acil Durum Kilidi (Lockdown)</div>
                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                    Kritik veri ihlali durumlarında anında tüm sessionları yok eder ve API'yi dış dünyaya kapatır.
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.emergencyLockdown}
                                    onChange={(e) => setSettings({ ...settings, emergencyLockdown: e.target.checked })}
                                />
                                <span className="slider round" style={{ background: settings.emergencyLockdown ? "#ef4444" : "#475569" }}></span>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
            {/* Toggle switch styles can be injected globally or via module css, doing inline style tag for simplicity here */}
            <style>{`
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #475569;
                    transition: .4s;
                    border-radius: 24px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: #3b82f6;
                }
                input:checked + .slider:before {
                    transform: translateX(26px);
                }
            `}</style>
        </div>
    );
}

import { useState, useEffect } from "react";
import { adminApi, adminPatientsApi } from "../services/api";
import { FiBell, FiMail, FiSend, FiUsers, FiSearch, FiSliders } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

export default function AdminNotificationsPage() {
    const [msgTab, setMsgTab] = useState("notification"); // "notification" or "message"
    const [targetType, setTargetType] = useState("all_doctors"); // "all_doctors", "all_patients", "all_staff", "doctor", "patient", "staff"
    const [receiverId, setReceiverId] = useState("");
    const [msgTitle, setMsgTitle] = useState("");
    const [msgBody, setMsgBody] = useState("");
    const [notifType, setNotifType] = useState("message");
    const [notifLink, setNotifLink] = useState("");
    
    const [usersList, setUsersList] = useState([]);
    const [patientsList, setPatientsList] = useState([]);
    const [filteredRecipients, setFilteredRecipients] = useState([]);
    const [searchRecipientQuery, setSearchRecipientQuery] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecipients();
    }, []);

    // Filter recipients list based on targetType and search query
    useEffect(() => {
        let list = [];
        if (targetType === "doctor") {
            list = usersList.filter(u => u.role === "doctor").map(u => ({
                _id: u.profileId?._id || u._id,
                name: u.profileId?.name || u.name || "Bilinmeyen Hekim",
                email: u.email
            }));
        } else if (targetType === "staff") {
            list = usersList.filter(u => ["receptionist", "pharmacist", "accountant", "hr", "technician", "staff"].includes(u.role)).map(u => ({
                _id: u._id,
                name: u.profileId?.name || u.name || "Bilinmeyen Personel",
                email: u.email,
                role: u.role
            }));
        } else if (targetType === "patient") {
            list = patientsList.map(p => ({
                _id: p._id,
                name: p.name,
                email: p.email || "",
                phone: p.phone || ""
            }));
        }

        if (searchRecipientQuery.trim()) {
            const q = searchRecipientQuery.toLowerCase();
            list = list.filter(item => 
                (item.name || "").toLowerCase().includes(q) || 
                (item.email || "").toLowerCase().includes(q)
            );
        }
        setFilteredRecipients(list);
        
        if (list.length > 0) {
            const exists = list.some(item => item._id === receiverId);
            if (!exists) setReceiverId(list[0]._id);
        } else {
            setReceiverId("");
        }
    }, [targetType, searchRecipientQuery, usersList, patientsList]);

    // Update targetType fallback based on msgTab change
    useEffect(() => {
        if (msgTab === "message") {
            if (!["doctor", "patient", "staff"].includes(targetType)) {
                setTargetType("doctor");
            }
        }
    }, [msgTab]);

    const fetchRecipients = async () => {
        setLoading(true);
        try {
            const [usersData, patientsData] = await Promise.all([
                adminApi.getUsers().catch(err => { console.error(err); return []; }),
                adminPatientsApi.getAll().catch(err => { console.error(err); return []; })
            ]);
            setUsersList(usersData);
            setPatientsList(patientsData);
        } catch (err) {
            toast.error("Alıcı listesi yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendBroadcastOrDirect = async (e) => {
        e.preventDefault();
        if (!msgTitle.trim() || !msgBody.trim()) {
            toast.error("Lütfen başlık ve mesaj içeriğini doldurun.");
            return;
        }

        setIsSending(true);
        try {
            if (msgTab === "notification") {
                const payload = {
                    targetType,
                    receiverId: ["doctor", "patient", "staff"].includes(targetType) ? receiverId : undefined,
                    title: msgTitle,
                    message: msgBody,
                    type: notifType,
                    link: notifLink || undefined
                };
                await adminApi.sendNotification(payload);
                toast.success("Bildirim başarıyla gönderildi!");
            } else {
                if (!["doctor", "patient", "staff"].includes(targetType)) {
                    toast.error("Özel mesajlar sadece bireysel alıcılara gönderilebilir.");
                    setIsSending(false);
                    return;
                }
                const payload = {
                    targetType,
                    receiverId,
                    title: msgTitle,
                    content: msgBody
                };
                await adminApi.sendMessage(payload);
                toast.success("Özel mesaj başarıyla gönderildi!");
            }
            setMsgTitle("");
            setMsgBody("");
            setNotifLink("");
        } catch (error) {
            toast.error("Gönderim başarısız: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    if (loading) return <div style={{ padding: "40px", color: "#6b7280" }}>Kullanıcı ve Hasta Listeleri Yükleniyor...</div>;

    return (
        <div className="animate-fade-in" style={{ color: "white", maxWidth: "1200px", margin: "0 auto" }}>
            <Toaster position="top-right" />
            
            {/* Header */}
            <div style={{ marginBottom: "40px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Mesaj & Bildirim Gönderim Merkezi
                </h1>
                <p style={{ color: "#64748b", margin: 0 }}>Sistem personellerine ve kayıtlı hastalara tekil ya da toplu anlık bildirimler ve özel mesajlar iletin.</p>
            </div>

            {/* Widget Container */}
            <div style={{
                background: "rgba(30, 41, 59, 0.7)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "24px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "#60a5fa" }}>
                        <FiBell /> Yeni Gönderi Oluştur
                    </h2>
                    
                    {/* Tab Selectors */}
                    <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <button
                            onClick={() => setMsgTab("notification")}
                            style={{
                                padding: "8px 16px",
                                background: msgTab === "notification" ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "transparent",
                                color: msgTab === "notification" ? "white" : "#94a3b8",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <FiBell size={14} /> Anlık Bildirim (Push)
                        </button>
                        <button
                            onClick={() => setMsgTab("message")}
                            style={{
                                padding: "8px 16px",
                                background: msgTab === "message" ? "linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)" : "transparent",
                                color: msgTab === "message" ? "white" : "#94a3b8",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <FiMail size={14} /> Özel Mesaj (DM)
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSendBroadcastOrDirect} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "32px" }}>
                    
                    {/* Left Column: Recipient */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Alıcı Türü</label>
                            <select
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    background: "rgba(0, 0, 0, 0.3)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "14px",
                                    outline: "none"
                                }}
                            >
                                {msgTab === "notification" && (
                                    <>
                                        <option value="all_doctors">📢 Tüm Hekimler (Toplu)</option>
                                        <option value="all_patients">📢 Tüm Hastalar (Toplu)</option>
                                        <option value="all_staff">📢 Tüm Personel ve Hekimler (Toplu)</option>
                                    </>
                                )}
                                <option value="doctor">👤 Belirli Bir Hekim</option>
                                <option value="patient">👤 Belirli Bir Hasta</option>
                                <option value="staff">👤 Belirli Bir Personel (Sekreter, Eczacı vb.)</option>
                            </select>
                        </div>

                        {/* Search and Select Recipient */}
                        {["doctor", "patient", "staff"].includes(targetType) && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(0,0,0,0.15)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Kişi Ara (İsim / E-posta)</label>
                                    <input
                                        type="text"
                                        placeholder="İsim yazarak arayın..."
                                        value={searchRecipientQuery}
                                        onChange={(e) => setSearchRecipientQuery(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            background: "rgba(0,0,0,0.2)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "6px",
                                            color: "white",
                                            fontSize: "13px",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Alıcı Seçin ({filteredRecipients.length} Kişi Bulundu)</label>
                                    <select
                                        value={receiverId}
                                        onChange={(e) => setReceiverId(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            background: "rgba(0, 0, 0, 0.3)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "6px",
                                            color: "white",
                                            fontSize: "13px",
                                            outline: "none"
                                        }}
                                        required
                                    >
                                        {filteredRecipients.length === 0 ? (
                                            <option value="" disabled>Sonuç bulunamadı</option>
                                        ) : (
                                            filteredRecipients.map(r => (
                                                <option key={r._id} value={r._id}>
                                                    {r.name} ({r.email || "Detay yok"})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Notification Settings */}
                        {msgTab === "notification" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Bildirim Türü</label>
                                    <select
                                        value={notifType}
                                        onChange={(e) => setNotifType(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            background: "rgba(0, 0, 0, 0.3)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "8px",
                                            color: "white",
                                            fontSize: "14px",
                                            outline: "none"
                                        }}
                                    >
                                        <option value="message">✉️ Genel Mesaj / Bilgi</option>
                                        <option value="labResult">🔬 Tahlil & Test Uyarısı</option>
                                        <option value="appointment">📅 Randevu Bilgilendirmesi</option>
                                        <option value="file">📂 Dosya & Rapor Uyarısı</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Yönlendirme Linki (İsteğe Bağlı)</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: /appointments veya /hasta/portal"
                                        value={notifLink}
                                        onChange={(e) => setNotifLink(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            background: "rgba(0, 0, 0, 0.3)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "8px",
                                            color: "white",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Title and Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Başlık / Konu</label>
                                <input
                                    type="text"
                                    placeholder="Gönderi konusunu girin..."
                                    value={msgTitle}
                                    onChange={(e) => setMsgTitle(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        background: "rgba(0, 0, 0, 0.3)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "8px",
                                        color: "white",
                                        fontSize: "14px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Mesaj İçeriği</label>
                                <textarea
                                    placeholder="Mesajınızı detaylıca açıklayın..."
                                    rows={8}
                                    value={msgBody}
                                    onChange={(e) => setMsgBody(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        background: "rgba(0, 0, 0, 0.3)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "8px",
                                        color: "white",
                                        fontSize: "14px",
                                        outline: "none",
                                        fontFamily: "inherit",
                                        resize: "none",
                                        boxSizing: "border-box"
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSending}
                            style={{
                                width: "100%",
                                padding: "14px",
                                background: msgTab === "notification" 
                                    ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" 
                                    : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "14px",
                                cursor: isSending ? "wait" : "pointer",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: msgTab === "notification" 
                                    ? "0 4px 12px rgba(37, 99, 235, 0.2)" 
                                    : "0 4px 12px rgba(124, 58, 237, 0.2)",
                                opacity: isSending ? 0.7 : 1,
                                transition: "all 0.2s"
                            }}
                        >
                            <FiSend />
                            {isSending ? "Gönderiliyor..." : `${msgTab === "notification" ? "Bildirimi Yayınla" : "Özel Mesajı Gönder"}`}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

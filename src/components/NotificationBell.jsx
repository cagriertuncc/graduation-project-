import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FiBell, FiClock, FiCheck, FiX } from "react-icons/fi";

const API = "http://localhost:5001";

export default function NotificationBell() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [ikNotifs, setIkNotifs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Dışarı tıklayınca kapatma
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Randevuları çekip bildirimlere dönüştürme
    const fetchAppointments = async () => {
        try {
            const todayStr = new Date().toISOString().split("T")[0];
            const data = await appointmentsApi.getAll({ date: todayStr, status: "bekliyor" });

            const now = new Date();
            const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            // Geçmiş saatteki randevuları filtrele (sadece yaklaşanları göster)
            const upcoming = data.filter(appt => appt.time >= currentTimeStr);

            // Session storage'dan silinmiş bildirimleri al
            const dismissedIds = JSON.parse(sessionStorage.getItem("dismissedNotifications") || "[]");

            // Bildirim nesnelerini oluştur
            const newNotifications = upcoming
                .filter(appt => !dismissedIds.includes(appt._id)) // Silinenleri gösterme
                .map(appt => {
                    // Zaman farkını hesapla
                    const [apptHour, apptMin] = appt.time.split(":").map(Number);
                    const apptDate = new Date();
                    apptDate.setHours(apptHour, apptMin, 0, 0);

                    const diffMs = apptDate - now;
                    const diffMins = Math.floor(diffMs / 60000);

                    const isUrgent = diffMins >= 0 && diffMins <= 30;

                    return {
                        id: appt._id,
                        title: `${appt.patientId?.name || "Hasta"} - ${appt.type}`,
                        time: appt.time,
                        diffMins,
                        isUrgent,
                        room: appt.room,
                        patientId: appt.patientId?._id
                    };
                })
                .sort((a, b) => a.time.localeCompare(b.time)); // Saate göre sırala

            setNotifications(newNotifications);
        } catch (err) {
            console.error("Bildirimler yüklenemedi:", err);
        }
    };

    // İzin bildirimlerini çek
    const fetchIKNotifs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/ik-notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setIkNotifs(await res.json());
        } catch { /* sessiz */ }
    };

    const markIKRead = async (id) => {
        await fetch(`${API}/api/ik-notifications/${id}/oku`, {
            method: "PATCH", headers: { Authorization: `Bearer ${token}` }
        });
        setIkNotifs(p => p.map(n => n._id === id ? { ...n, okundu: true } : n));
    };

    // İlk yükleme ve periyodik sorgulama (60 saniye)
    useEffect(() => {
        fetchAppointments();
        fetchIKNotifs();
        const interval = setInterval(() => { fetchAppointments(); fetchIKNotifs(); }, 60000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.length + ikNotifs.filter(n => !n.okundu).length;
    const handleDismiss = (e, id) => {
        e.stopPropagation(); // Dropdown'ın kapanmasını engelle veya karta tıklanmasını engelle
        const dismissedIds = JSON.parse(sessionStorage.getItem("dismissedNotifications") || "[]");
        dismissedIds.push(id);
        sessionStorage.setItem("dismissedNotifications", JSON.stringify(dismissedIds));

        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
    };

    const handleDismissAll = () => {
        const dismissedIds = JSON.parse(sessionStorage.getItem("dismissedNotifications") || "[]");
        const currentIds = notifications.map(n => n.id);

        sessionStorage.setItem("dismissedNotifications", JSON.stringify([...dismissedIds, ...currentIds]));
        setNotifications([]);
        setIsOpen(false);
    };

    const handleNotificationClick = (id) => {
        setIsOpen(false);
        navigate("/appointments");
    };

    const formatDiff = (mins) => {
        if (mins < 0) return "Geçti";
        if (mins === 0) return "Şimdi";
        if (mins < 60) return `${mins} dk içinde`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (remainingMins === 0) return `${hours} saat içinde`;
        return `${hours} sa ${remainingMins} dk içinde`;
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
            <button
                className="notification-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36,
                    background: isOpen ? "#fef2f2" : "#f8fafc",
                    border: `1px solid ${isOpen ? "#fecaca" : "#f1f5f9"}`,
                    borderRadius: 10, color: isOpen ? "#ef4444" : "#64748b",
                    cursor: "pointer", transition: "all 0.2s",
                    position: "relative",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; } }}
            >
                <FiBell size={17} />
                {unreadCount > 0 && (
                    <span style={{
                        position: "absolute", top: -4, right: -4,
                        background: "#ef4444", color: "white", fontSize: "9px",
                        fontWeight: "bold", minWidth: 16, height: 16, padding: "0 3px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "999px", border: "2px solid white"
                    }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="notification-dropdown animate-fade-in"
                    style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0, width: "320px",
                        background: "white", borderRadius: "14px",
                        boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                        zIndex: 300, border: "1px solid #f1f5f9", overflow: "hidden",
                    }}
                >
                    <div style={{
                        padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "#fafafa"
                    }}>
                        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                            Yaklaşan Randevular
                            {unreadCount > 0 && (
                                <span style={{ background: "#ef4444", color: "white", padding: "2px 6px", borderRadius: "10px", fontSize: "10px" }}>{unreadCount}</span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleDismissAll}
                                style={{ background: "none", border: "none", color: "#6b7280", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#111827"}
                                onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}
                            >
                                <FiCheck size={12} /> Hepsini Oku
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                        {notifications.length > 0 ? (
                            notifications.map((notif, idx) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif.id)}
                                    style={{
                                        padding: "12px 16px", borderBottom: idx < notifications.length - 1 ? "1px solid #f3f4f6" : "none",
                                        background: notif.isUrgent ? "#fef2f2" : "white",
                                        transition: "background 0.2s", cursor: "pointer",
                                        display: "flex", gap: "10px", position: "relative"
                                    }}
                                    onMouseEnter={e => {
                                        if (!notif.isUrgent) e.currentTarget.style.background = "#f9fafb";
                                        e.currentTarget.querySelector('.dismiss-btn').style.opacity = '1';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = notif.isUrgent ? "#fef2f2" : "white";
                                        e.currentTarget.querySelector('.dismiss-btn').style.opacity = '0';
                                    }}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                        background: notif.isUrgent ? "#fee2e2" : "#e0e7ff",
                                        color: notif.isUrgent ? "#ef4444" : "#4f46e5",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <FiClock size={16} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "2px", paddingRight: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {notif.title}
                                        </div>
                                        <div style={{ fontSize: "11px", color: notif.isUrgent ? "#ef4444" : "#6b7280", fontWeight: notif.isUrgent ? 600 : 400 }}>
                                            Saat: {notif.time} • {formatDiff(notif.diffMins)}
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
                                            {notif.room}
                                        </div>
                                    </div>
                                    <button
                                        className="dismiss-btn"
                                        onClick={(e) => handleDismiss(e, notif.id)}
                                        style={{
                                            position: "absolute", top: "12px", right: "12px",
                                            background: "none", border: "none", color: "#9ca3af",
                                            cursor: "pointer", padding: "2px", opacity: 0, transition: "opacity 0.2s"
                                        }}
                                        title="Kapat"
                                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                                        onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: "30px 20px", textAlign: "center", color: "#9ca3af" }}>
                                <FiBell size={24} style={{ marginBottom: "8px", opacity: 0.5 }} />
                                <div style={{ fontSize: "13px", fontWeight: 500 }}>Yaklaşan randevunuz yok.</div>
                                <div style={{ fontSize: "11px", marginTop: "4px" }}>Bugüne ait tüm randevular yaklaştığında burada bildirim alacaksınız.</div>
                            </div>
                        )}
                    </div>

                    {/* İzin Bildirimleri */}
                    {ikNotifs.length > 0 && (
                        <>
                            <div style={{ padding: "8px 16px 4px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>İzin Bildirimleri</span>
                            </div>
                            {ikNotifs.map((n, i) => {
                                const isOnayli = n.tip === "izin_onaylandi";
                                const isReddi = n.tip === "izin_reddedildi";
                                const icon = isOnayli ? "✅" : isReddi ? "❌" : "📋";
                                const color = isOnayli ? "#22c55e" : isReddi ? "#ef4444" : "#6366f1";
                                return (
                                    <div key={n._id} onClick={() => markIKRead(n._id)} style={{
                                        padding: "11px 16px",
                                        borderBottom: i < ikNotifs.length - 1 ? "1px solid #f3f4f6" : "none",
                                        display: "flex", gap: 10, alignItems: "flex-start",
                                        background: n.okundu ? "white" : "#f8f9ff",
                                        cursor: "pointer", transition: "background 0.15s",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                        onMouseLeave={e => e.currentTarget.style.background = n.okundu ? "white" : "#f8f9ff"}
                                    >
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{n.baslik}</span>
                                                {!n.okundu && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>{n.mesaj}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {notifications.length === 0 && ikNotifs.length === 0 && (
                        <div style={{ padding: "30px 20px", textAlign: "center", color: "#9ca3af" }}>
                            <FiBell size={24} style={{ marginBottom: "8px", opacity: 0.5 }} />
                            <div style={{ fontSize: "13px", fontWeight: 500 }}>Bildirim yok.</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

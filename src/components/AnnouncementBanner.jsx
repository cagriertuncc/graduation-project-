import { useState, useEffect } from "react";
import { adminApi } from "../services/api";
import { FiInfo, FiAlertTriangle, FiXCircle, FiX } from "react-icons/fi";

export default function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState([]);
    const [dismissed, setDismissed] = useState([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                // Fetch active announcements globally
                const data = await adminApi.getActiveAnnouncements();

                // Filter out any dismissed ones stored in session/local storage
                const locallyDismissed = JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]");
                setDismissed(locallyDismissed);

                setAnnouncements(data);
            } catch (err) {
                console.error("Duyurular yüklenemedi", err);
            }
        };
        fetchAnnouncements();
        // Optional: poll every 60s
        const interval = setInterval(fetchAnnouncements, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleDismiss = (id) => {
        const newDismissed = [...dismissed, id];
        setDismissed(newDismissed);
        localStorage.setItem("dismissedAnnouncements", JSON.stringify(newDismissed));
    };

    const activeList = announcements.filter(a => !dismissed.includes(a._id));

    if (activeList.length === 0) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {activeList.map(item => {
                let bg, color, Icon;
                if (item.type === "critical") {
                    bg = "rgba(220, 38, 38, 0.1)"; // Red
                    color = "#ef4444";
                    Icon = FiXCircle;
                } else if (item.type === "warning") {
                    bg = "rgba(245, 158, 11, 0.1)"; // Yellow
                    color = "#f59e0b";
                    Icon = FiAlertTriangle;
                } else {
                    bg = "rgba(59, 130, 246, 0.1)"; // Blue
                    color = "#3b82f6";
                    Icon = FiInfo;
                }

                return (
                    <div key={item._id} className="animate-fade-in" style={{
                        background: bg,
                        border: `1px solid ${color}`,
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        position: "relative"
                    }}>
                        <Icon size={20} color={color} style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: "0 0 4px 0", color: color, fontSize: "15px", fontWeight: 700 }}>{item.title}</h4>
                            <p style={{ margin: 0, color: "white", fontSize: "14px", lineHeight: "1.5" }}>{item.message}</p>
                            <span style={{ fontSize: "11px", color: `${color}88`, marginTop: "8px", display: "block" }}>
                                {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                            </span>
                        </div>
                        <button
                            onClick={() => handleDismiss(item._id)}
                            style={{ background: "transparent", border: "none", color: `${color}aa`, cursor: "pointer", padding: "4px" }}
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

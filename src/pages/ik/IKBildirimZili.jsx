import { useState, useEffect, useRef } from "react";
import { FiBell, FiCheck, FiX } from "react-icons/fi";
import { useIKAuth } from "../../context/IKAuthContext";

const API = "http://localhost:5001";

const TIP_ICONS = {
    izin_talebi: { icon: "📋", color: "#818cf8", bg: "rgba(99,102,241,0.12)" },
    izin_onaylandi: { icon: "✅", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    izin_reddedildi: { icon: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function IKBildirimZili() {
    const { token } = useIKAuth();
    const [notifs, setNotifs] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const unread = notifs.filter(n => !n.okundu).length;

    const fetch_ = async () => {
        try {
            const res = await fetch(`${API}/api/ik-notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setNotifs(await res.json());
        } catch (e) { /* sessiz */ }
    };

    useEffect(() => {
        fetch_();
        const t = setInterval(fetch_, 30000);
        return () => clearInterval(t);
    }, []);

    // Click-outside
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const markRead = async (id) => {
        await fetch(`${API}/api/ik-notifications/${id}/oku`, {
            method: "PATCH", headers: { Authorization: `Bearer ${token}` }
        });
        setNotifs(p => p.map(n => n._id === id ? { ...n, okundu: true } : n));
    };

    const markAll = async () => {
        await fetch(`${API}/api/ik-notifications/tumu-oku`, {
            method: "PATCH", headers: { Authorization: `Bearer ${token}` }
        });
        setNotifs(p => p.map(n => ({ ...n, okundu: true })));
    };

    const timeAgo = (d) => {
        const diff = (Date.now() - new Date(d)) / 1000;
        if (diff < 60) return "Şimdi";
        if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
        return `${Math.floor(diff / 86400)} gün önce`;
    };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => { setOpen(o => !o); if (!open) fetch_(); }}
                style={{
                    width: 36, height: 36, borderRadius: 10, position: "relative",
                    background: open ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${open ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: open ? "#a5b4fc" : "rgba(255,255,255,0.5)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                }}
            >
                <FiBell size={16} />
                {unread > 0 && (
                    <span style={{
                        position: "absolute", top: -4, right: -4,
                        minWidth: 17, height: 17, borderRadius: 999, padding: "0 4px",
                        background: "#ef4444", color: "white", fontSize: 10, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid #06070f",
                    }}>{unread > 9 ? "9+" : unread}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0, width: 340,
                    background: "#0c0e1f", border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
                    overflow: "hidden", zIndex: 400,
                }}>
                    {/* Header */}
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                            Bildirimler
                            {unread > 0 && <span style={{ marginLeft: 8, fontSize: 10, background: "#ef4444", color: "white", padding: "1px 7px", borderRadius: 999, fontWeight: 800 }}>{unread} yeni</span>}
                        </div>
                        {unread > 0 && (
                            <button onClick={markAll} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>
                                <FiCheck size={11} /> Tümünü oku
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: 340, overflowY: "auto" }}>
                        {notifs.length === 0 ? (
                            <div style={{ padding: "36px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                                <FiBell size={22} style={{ marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                                Bildirim yok
                            </div>
                        ) : notifs.map((n, i) => {
                            const style = TIP_ICONS[n.tip] || { icon: "🔔", color: "#818cf8", bg: "rgba(99,102,241,0.1)" };
                            return (
                                <div key={n._id} onClick={() => markRead(n._id)} style={{
                                    padding: "13px 18px",
                                    borderBottom: i < notifs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                    display: "flex", gap: 12, alignItems: "flex-start",
                                    background: n.okundu ? "transparent" : "rgba(99,102,241,0.05)",
                                    cursor: "pointer", transition: "background 0.15s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                    onMouseLeave={e => e.currentTarget.style.background = n.okundu ? "transparent" : "rgba(99,102,241,0.05)"}
                                >
                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: style.bg, border: `1px solid ${style.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{style.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{n.baslik}</span>
                                            {!n.okundu && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />}
                                        </div>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.45 }}>{n.mesaj}</div>
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

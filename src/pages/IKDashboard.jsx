import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIKAuth } from "../context/IKAuthContext";
import { FiUsers, FiUserPlus, FiClipboard, FiCalendar, FiBarChart2, FiAward, FiLogOut, FiClock } from "react-icons/fi";
import { C } from "./ik/IKConstants";
import IKBildirimZili from "./ik/IKBildirimZili";
import IKGenelBakis from "./ik/IKGenelBakis";
import IKPersonelAlimi from "./ik/IKPersonelAlimi";
import IKBasvurular from "./ik/IKBasvurular";
import IKCalisanlar from "./ik/IKCalisanlar";
import IKIzinYonetimi from "./ik/IKIzinYonetimi";
import IKPerformans from "./ik/IKPerformans";
import IKNobetVardiya from "./ik/IKNobetVardiya";
const TABS = [
    { id: "genel", label: "Genel Bakış", icon: <FiBarChart2 size={15} /> },
    { id: "alim", label: "Personel Alımı", icon: <FiUserPlus size={15} /> },
    { id: "basvuru", label: "Başvurular", icon: <FiClipboard size={15} />, badge: 7 },
    { id: "calisanlar", label: "Çalışanlar", icon: <FiUsers size={15} /> },
    { id: "vardiya", label: "Nöbet & Vardiya", icon: <FiClock size={15} /> },
    { id: "izin", label: "İzin Yönetimi", icon: <FiCalendar size={15} />, badge: 2 },
    { id: "performans", label: "Performans", icon: <FiAward size={15} /> },
];

const INIT_NOTIFS = [
    { id: 1, icon: "👤", title: "Yeni Başvuru", text: "Dr. Ayşe Kaya Kardiyoloji Uzmanı pozisyonu için başvurdu.", zaman: "2 dk önce", color: "#818cf8", okundu: false },
    { id: 2, icon: "✅", title: "İzin Onayı", text: "Dr. Neslihan Tekin'in izin talebi onaylandı.", zaman: "1 saat önce", color: "#22c55e", okundu: false },
    { id: 3, icon: "📋", title: "Yeni İlan", text: "Kardiyoloji Uzmanı ilanı yayınlandı. 14 başvuru bekleniyor.", zaman: "3 saat önce", color: "#f59e0b", okundu: false },
    { id: 4, icon: "⏰", title: "İzin Talebi", text: "Murat Kılıç ücretsiz izin talebinde bulundu.", zaman: "5 saat önce", color: "#f97316", okundu: true },
    { id: 5, icon: "🎯", title: "Mülakat Hatırlatma", text: "Fatma Demir ile mülakat yarın saat 10:00'da.", zaman: "Dün", color: "#06b6d4", okundu: true },
];

export default function IKDashboard() {
    const { user, logout } = useIKAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("genel");

    const handleLogout = () => { logout(); navigate("/ik/giris"); };

    return (
        <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter',-apple-system,sans-serif", color: C.text }}>

            {/* ── Topbar ── */}
            <header style={{
                position: "sticky", top: 0, zIndex: 200,
                height: 60, padding: "0 32px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(6,7,15,0.92)", backdropFilter: "blur(20px)",
                borderBottom: `1px solid ${C.border}`,
            }}>
                {/* Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: C.grad, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
                        <FiUsers size={17} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>MediTrack HR</div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: -1, textTransform: "uppercase", letterSpacing: "0.06em" }}>İnsan Kaynakları</div>
                    </div>
                </div>

                {/* Right side */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <IKBildirimZili />

                    {/* User chip */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                            {(user?.name || "İK")[0]}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{user?.name || "İK Yöneticisi"}</span>
                    </div>

                    {/* Logout */}
                    <button onClick={handleLogout} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 13px", background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.15)", borderRadius: 9,
                        color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        fontFamily: "Inter,sans-serif", transition: "all 0.2s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                    >
                        <FiLogOut size={13} /> Çıkış
                    </button>
                </div>
            </header>

            <div style={{ padding: "24px 32px" }}>
                {/* ── Tab Bar ── */}
                <div style={{ display: "flex", gap: 3, marginBottom: 26, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 14, padding: 5, overflowX: "auto" }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
                            borderRadius: 10, border: "none", cursor: "pointer",
                            fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif",
                            background: tab === t.id ? C.grad : "transparent",
                            color: tab === t.id ? "white" : C.muted,
                            boxShadow: tab === t.id ? "0 4px 14px rgba(99,102,241,0.3)" : "none",
                            transition: "all 0.2s", whiteSpace: "nowrap",
                        }}>
                            {t.icon} {t.label}
                            {t.badge && (
                                <span style={{
                                    minWidth: 17, height: 17, borderRadius: 999, padding: "0 5px",
                                    background: tab === t.id ? "rgba(255,255,255,0.25)" : "#ef4444",
                                    color: "white", fontSize: 10, fontWeight: 800,
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                }}>{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                {tab === "genel" && <IKGenelBakis />}
                {tab === "alim" && <IKPersonelAlimi />}
                {tab === "basvuru" && <IKBasvurular />}
                {tab === "calisanlar" && <IKCalisanlar />}
                {tab === "vardiya" && <IKNobetVardiya />}
                {tab === "izin" && <IKIzinYonetimi />}
                {tab === "performans" && <IKPerformans />}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing:border-box; margin:0; }
                select option { background:#0c0e1f; color:white; }
                ::-webkit-scrollbar { width:4px; height:4px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.3); border-radius:2px; }
            `}</style>
        </div>
    );
}

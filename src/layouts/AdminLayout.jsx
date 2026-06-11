import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    FiShield,
    FiUsers,
    FiCalendar,
    FiSettings,
    FiLogOut,
    FiActivity,
    FiMenu,
    FiX,
    FiTarget,
    FiDatabase,
    FiCpu,
    FiBell
} from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { useState } from "react";
import AnnouncementBanner from "../components/AnnouncementBanner";

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const navItems = [
        { to: "/admin", icon: <FiActivity />, label: "Sistem Özeti", end: true },
        { to: "/admin/analytics", icon: <FiActivity />, label: "Genel İstatistikler" },
        { to: "/admin/revenue", icon: <FiActivity />, label: "Finansal Durum" },
        { to: "/admin/users", icon: <FiUsers />, label: "Kullanıcı Yönetimi" },
        { to: "/admin/patients", icon: <FiTarget />, label: "Tüm Hastalar" },
        { to: "/admin/appointments", icon: <FiCalendar />, label: "Genel Randevular" },
        { to: "/admin/specialties", icon: <FiDatabase />, label: "Branş Yönetimi" },
        { to: "/admin/settings", icon: <FiSettings />, label: "Sistem Ayarları" },
        { to: "/admin/logs", icon: <FiDatabase />, label: "Sistem Günlükleri" },
        { to: "/admin/it-requests", icon: <FiCpu />, label: "IT Destek Talepleri" },
        { to: "/admin/notifications", icon: <FiBell />, label: "Mesaj & Bildirim" },
        { to: "/admin/ai-assistant", icon: <FiCpu />, label: "AI Sistem Kontrolü" },
    ];

    const filteredNavItems = navItems.filter(item => {
        const specialty = user?.specialty;
        if (specialty === "Bilgi İşlem Müdür Yardımcısı") {
            return !["/admin/revenue", "/admin/settings"].includes(item.to);
        }
        if (specialty === "Bilgi İşlem Uzmanı") {
            return !["/admin/revenue", "/admin/users", "/admin/specialties", "/admin/settings", "/admin/ai-assistant"].includes(item.to);
        }
        return true;
    });

    return (
        <div className="admin-layout" style={{
            display: "flex",
            minHeight: "100vh",
            background: "#0f172a", // Slate 900
            color: "#f8fafc" // Slate 50
        }}>
            {/* Admin Sidebar */}
            <aside style={{
                width: isSidebarOpen ? "280px" : "80px",
                background: "#1e293b", // Slate 800
                borderRight: "1px solid #334155",
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                height: "100vh",
                zIndex: 100
            }}>
                {/* Branding */}
                <div style={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderBottom: "1px solid #334155"
                }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                    }}>
                        <FiShield size={24} color="white" />
                    </div>
                    {isSidebarOpen && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>MT-ADMIN</h2>
                            <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0, textTransform: "uppercase", fontWeight: 600 }}>Sistem Kontrol</p>
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
                            style={({ isActive }) => ({
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px",
                                borderRadius: "10px",
                                textDecoration: "none",
                                color: isActive ? "white" : "#94a3b8",
                                background: isActive ? "rgba(239, 68, 68, 0.1)" : "transparent",
                                transition: "all 0.2s",
                                fontSize: "14px",
                                fontWeight: 500,
                                borderLeft: isActive ? "3px solid #ef4444" : "3px solid transparent"
                            })}
                        >
                            <span style={{ fontSize: "20px", display: "flex" }}>{item.icon}</span>
                            {isSidebarOpen && <span className="animate-fade-in">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer User Profile */}
                <div style={{
                    padding: "20px",
                    borderTop: "1px solid #334155",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "#ef4444", display: "flex",
                            alignItems: "center", justifyContent: "center", fontWeight: 700
                        }}>
                            {user?.name?.charAt(0) || "A"}
                        </div>
                        {isSidebarOpen && (
                            <div className="animate-fade-in" style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{user?.specialty || "Bilgi İşlem Yetkilisi"}</div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "none",
                            background: "rgba(241, 245, 249, 0.05)",
                            color: "#94a3b8",
                            cursor: "pointer",
                            fontSize: "13px",
                            width: "100%",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(241, 245, 249, 0.05)";
                            e.currentTarget.style.color = "#94a3b8";
                        }}
                    >
                        <FiLogOut size={16} />
                        {isSidebarOpen && <span>Çıkış Yap</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: isSidebarOpen ? "280px" : "80px",
                transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                padding: "40px",
                position: "relative"
            }}>
                <header style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px"
                }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>Durum</div>
                            <div style={{ fontSize: "13px", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                                Sistem Aktif
                            </div>
                        </div>
                    </div>
                </header>

                <AnnouncementBanner />
                <Outlet />
            </main>

            <style>{`
                .admin-nav-item:hover {
                    color: white !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                }
                .admin-nav-item.active:hover {
                    background: rgba(239, 68, 68, 0.15) !important;
                }
            `}</style>
        </div>
    );
}

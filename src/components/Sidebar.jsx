import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiGrid, FiUsers, FiActivity, FiLogOut, FiCalendar, FiFileText, FiShield, FiDroplet, FiMonitor, FiClipboard, FiScissors, FiBarChart2, FiDollarSign, FiSun, FiCpu, FiBell } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import IzinTalebiModal from "./IzinTalebiModal";
import ITRequestModal from "./ITRequestModal";
import AnnouncementsModal from "./AnnouncementsModal";

export default function Sidebar() {
    const navigate = useNavigate();
    const { user, logout, token } = useAuth();
    const [showIzinModal, setShowIzinModal] = useState(false);
    const [showITModal, setShowITModal] = useState(false);
    const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

    const doctorNavItems = [
        { to: "/dashboard", icon: <FiGrid />, label: "Dashboard" },
        { to: "/patients", icon: <FiUsers />, label: "Hastalarım" },
        { to: "/diseases", icon: <FiActivity />, label: "Hastalık Takibi" },
        { to: "/appointments", icon: <FiCalendar />, label: "Randevularım" },
        { to: "/prescriptions", icon: <FiFileText />, label: "Reçetelerim" },
        { type: "action", icon: <FiSun />, label: "İzin Talebi", action: "izin" },
        { type: "action", icon: <FiCpu />, label: "IT Destek Talebi", action: "it" },
        { type: "action", icon: <FiBell />, label: "Hastane Duyuruları", action: "duyuru" },
        { type: "divider", label: "Klinik Araçlar" },
        { to: "/lab-results", icon: <FiDroplet />, label: "Laboratuvar" },
        { to: "/radiology", icon: <FiMonitor />, label: "Radyoloji" },
        { type: "divider", label: "Dokümantasyon" },
        { to: "/medical-reports", icon: <FiClipboard />, label: "Tıbbi Raporlar" },
        { to: "/procedure-notes", icon: <FiScissors />, label: "İşlem Notları" },
        { type: "divider", label: "Analitik" },
        { to: "/analytics", icon: <FiBarChart2 />, label: "İstatistikler" },
        { to: "/revenue", icon: <FiDollarSign />, label: "Gelir Takibi" },
        { type: "divider", label: "Yapay Zeka" },
        { to: "/ai-assistant", icon: <FiCpu />, label: "MediAI Asistan" },
    ];

    const adminNavItems = [
        { to: "/admin", icon: <FiShield />, label: "Sistem ve Doktorlar" },
        { to: "/patients", icon: <FiUsers />, label: "Tüm Hastalar" },
        { to: "/appointments", icon: <FiCalendar />, label: "Genel Randevular" },
    ];

    const currentNavItems = user?.role === "admin" ? adminNavItems : doctorNavItems;

    const doctorName = user?.name || "Doktor";
    const doctorSpecialty = user?.specialty || "";
    const initials = doctorName
        .split(" ")
        .filter((_, i, arr) => i === 0 || i === arr.length - 1)
        .map((n) => n[0])
        .join("");

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <RiHospitalLine />
                        </div>
                        <div>
                            <h2>MediTrack</h2>
                            <span>{user?.role === "admin" ? "Sistem Yönetimi" : "Hasta Takip Sistemi"}</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-nav-label">Ana Menü</div>
                    {currentNavItems.map((item, idx) =>
                        item.type === "divider" ? (
                            <div key={`div-${idx}`} className="sidebar-nav-label" style={{ marginTop: "16px" }}>{item.label}</div>
                        ) : item.type === "action" ? (
                            <button key={`action-${idx}`} onClick={() => {
                                if (item.action === "izin") setShowIzinModal(true);
                                if (item.action === "it") setShowITModal(true);
                                if (item.action === "duyuru") setShowAnnouncementsModal(true);
                            }}
                                className="sidebar-nav-item"
                                style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ) : (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `sidebar-nav-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="nav-icon" style={user?.role === "admin" && item.to === "/admin" ? { color: "#ef4444" } : {}}>
                                    {item.icon}
                                </span>
                                <span style={user?.role === "admin" && item.to === "/admin" ? { color: "#ef4444", fontWeight: 600 } : {}}>
                                    {item.label}
                                </span>
                            </NavLink>
                        )
                    )}
                </nav>

            </aside>
            {showIzinModal && <IzinTalebiModal token={token} onClose={() => setShowIzinModal(false)} />}
            {showITModal && <ITRequestModal onClose={() => setShowITModal(false)} />}
            {showAnnouncementsModal && <AnnouncementsModal onClose={() => setShowAnnouncementsModal(false)} />}
        </>
    );
}

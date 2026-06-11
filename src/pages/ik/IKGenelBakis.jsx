import { useState, useEffect } from "react";
import { FiUsers, FiUserPlus, FiClipboard, FiCalendar, FiActivity } from "react-icons/fi";
import { C, StatCard, DurumBadge } from "./IKConstants";

export default function IKGenelBakis() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeLeaves: 0,
        pendingApplications: 0,
        openJobs: 0
    });
    const [recentApps, setRecentApps] = useState([]);
    const [activeJobs, setActiveJobs] = useState([]);
    const [deptData, setDeptData] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const [statsRes, appsRes, jobsRes, empsRes, notifsRes] = await Promise.all([
                    fetch("http://localhost:5001/api/hr/dashboard-stats", { headers }),
                    fetch("http://localhost:5001/api/hr/applications", { headers }),
                    fetch("http://localhost:5001/api/hr/postings", { headers }),
                    fetch("http://localhost:5001/api/hr/employees", { headers }),
                    fetch("http://localhost:5001/api/ik-notifications", { headers })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (appsRes.ok) setRecentApps((await appsRes.json()).slice(0, 5));
                if (jobsRes.ok) {
                    const jobs = await jobsRes.json();
                    setActiveJobs(jobs.filter(j => j.status === "Aktif").slice(0, 6)); // max 6
                }
                if (empsRes.ok) {
                    const emps = await empsRes.json();
                    const counts = {};
                    emps.forEach(e => {
                        const spec = e.specialty || "İdari";
                        counts[spec] = (counts[spec] || 0) + 1;
                    });
                    const total = emps.length || 1;
                    const sorted = Object.entries(counts)
                        .map(([dep, count]) => ({
                            dep,
                            sayi: count,
                            yuzde: Math.round((count / total) * 100)
                        }))
                        .sort((a, b) => b.sayi - a.sayi);
                    setDeptData(sorted);
                }
                if (notifsRes.ok) {
                    setNotifications((await notifsRes.json()).slice(0, 5));
                }
            } catch (err) {
                console.error("Dashboard veri hatası:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatTime = (d) => {
        const diff = (Date.now() - new Date(d)) / 1000;
        if (diff < 60) return "Şimdi";
        if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
        return `${Math.floor(diff / 86400)} gün önce`;
    };

    const colors = ["#6366f1", "#818cf8", "#06b6d4", "#10b981", "#f59e0b", "#a5b4fc", "#ec4899", "#8b5cf6"];

    const currentDate = new Date().toLocaleDateString("tr-TR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    if (loading) return <div style={{ color: "white", padding: 20 }}>Yükleniyor...</div>;

    return (
        <div>
            {/* Hero Welcome Banner */}
            <div style={{
                background: "linear-gradient(135deg,rgba(79,70,229,0.15) 0%,rgba(99,102,241,0.08) 50%,rgba(139,92,246,0.12) 100%)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 20, padding: "28px 32px", marginBottom: 24,
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -30, left: "30%", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
                <div style={{ relative: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                            Hoşgeldiniz 👋 <span style={{ background: "linear-gradient(135deg,#a5b4fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>İK Yöneticisi</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{currentDate} · MediTrack Hastanesi</div>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                        {[
                            { v: stats.totalEmployees, l: "Çalışan", c: "#818cf8" },
                            { v: stats.openJobs, l: "Açık Pozisyon", c: "#f59e0b" },
                            { v: stats.pendingApplications, l: "Yeni Başvuru", c: "#22c55e" }
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <StatCard icon={<FiUsers size={20} />} label="Toplam Çalışan" value={stats.totalEmployees} sub="Aktif personel" color="#6366f1" />
                <StatCard icon={<FiUserPlus size={20} />} label="Açık Pozisyon" value={stats.openJobs} sub="Aktif ilan" color="#f59e0b" />
                <StatCard icon={<FiClipboard size={20} />} label="Bekleyen Başvuru" value={stats.pendingApplications} sub="İnceleniyor" color="#f97316" />
                <StatCard icon={<FiCalendar size={20} />} label="Bekleyen İzin" value={stats.activeLeaves} sub="Aktif izin" color="#22c55e" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 340px", gap: 20 }}>
                {/* Son Başvurular */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
                    <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Son Başvurular</span>
                        <span style={{ fontSize: 11, color: C.muted }}>{recentApps.length} adet</span>
                    </div>
                    {recentApps.length === 0 && <div style={{ padding: 22, color: C.muted, fontSize: 13 }}>Henüz başvuru yok.</div>}
                    {recentApps.map((b, i) => (
                        <div key={b._id} style={{ padding: "14px 22px", borderBottom: i < recentApps.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,#4f46e5,#818cf8)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>
                                    {b.applicantName ? b.applicantName[0].toUpperCase() : "?"}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{b.applicantName}</div>
                                    <div style={{ fontSize: 11, color: C.muted }}>{b.jobId?.title || "Bilinmiyor"}</div>
                                </div>
                            </div>
                            <DurumBadge durum={b.status} />
                        </div>
                    ))}
                </div>

                {/* Departman Dağılımı */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "18px 22px", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 18 }}>Departman Dağılımı</div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", maxHeight: 310, paddingRight: 4 }}>
                        {deptData.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Çalşan verisi yok.</div>}
                        {deptData.map((d, index) => (
                            <div key={d.dep}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{d.dep}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{d.sayi} çalışan ({d.yuzde}%)</span>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                                    <div style={{ width: `${d.yuzde}%`, height: "100%", background: colors[index % colors.length], borderRadius: 999, boxShadow: `0 0 8px ${colors[index % colors.length]}60` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Aktivite Akışı (Dinamik İK Bildirimleri) */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "18px 22px", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <FiActivity size={15} color="#818cf8" /> Sistem Aktifliği
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", maxHeight: 310, paddingRight: 4 }}>
                        {notifications.length === 0 ? (
                            <div style={{ color: C.muted, fontSize: 12, padding: "10px 0" }}>
                                Aktif bir sistem hareketi veya bildirim bulunamadı.
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n._id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <div style={{ 
                                        width: 8, height: 8, borderRadius: "50%", 
                                        background: n.okundu ? C.dim : C.primary, 
                                        marginTop: 5, flexShrink: 0,
                                        boxShadow: !n.okundu ? `0 0 8px ${C.primary}` : "none" 
                                    }} />
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{n.baslik}</div>
                                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.35 }}>{n.mesaj}</div>
                                        <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>{formatTime(n.createdAt)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Hızlı İlanlar */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, marginTop: 20, overflow: "hidden" }}>
                <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Aktif İş İlanları</span>
                    <span style={{ fontSize: 11, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>{activeJobs.length} Aktif</span>
                </div>
                {activeJobs.length === 0 && <div style={{ padding: 22, color: C.muted, fontSize: 13 }}>Aktif ilan bulunamadı.</div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0 }}>
                    {activeJobs.map((ilan, i, arr) => (
                        <div key={ilan._id} style={{
                            padding: "16px 22px",
                            borderRight: (i + 1) % 3 !== 0 && i !== arr.length - 1 ? `1px solid ${C.border}` : "none",
                            borderBottom: i < arr.length - 3 ? `1px solid ${C.border}` : "none",
                            transition: "background 0.15s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{ilan.title}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{ilan.department} · {ilan.type}</div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>{ilan.applicationCount} başvuru</span>
                                <span style={{ fontSize: 10, color: C.dim }}>Konum: {ilan.location}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

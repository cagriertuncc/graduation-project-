import { useState, useEffect } from "react";
import { FiAward, FiBarChart2, FiClock, FiStar } from "react-icons/fi";
import { C, StatCard, AVA_COLORS } from "./IKConstants";

export default function IKPerformans() {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerfs = async () => {
            try {
                const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
                const res = await fetch("http://localhost:5001/api/hr/performance", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (res.ok) setPerformances(await res.json());
            } catch (err) { console.error("Performans verileri alınamadı", err); }
            finally { setLoading(false); }
        };
        fetchPerfs();
    }, []);

    // Ortalamayı hesaplama (5 üzerinden değerlendirildiği varsayılıyor, ama biz 100 üzerinden 5'e bölebiliriz vs) 
    // veya API'den gelen 100 puanı 5'e bölelim.
    const mapped = performances.map(p => ({
        ...p,
        normalizedScore: (p.score / 20).toFixed(1), // 100 üzerinden -> 5.0 üzerinden
        employeeName: p.userId?.name || "Bilinmiyor",
        role: p.userId?.role || "Staff"
    }));

    const sorted = [...mapped].sort((a, b) => b.score - a.score);

    if (loading) return <div style={{ color: "white", padding: 20 }}>Yükleniyor...</div>;

    return (
        <div>
            {/* Top 3 podium */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                {sorted.slice(0, 3).map((c, i) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const colors = ["#f59e0b", "#94a3b8", "#f97316"];
                    const cidx = i;
                    return (
                        <div key={c._id} style={{
                            background: `linear-gradient(135deg,${colors[i]}12,rgba(255,255,255,0.02))`,
                            border: `1px solid ${colors[i]}35`,
                            borderRadius: 18, padding: "24px 22px", textAlign: "center",
                            position: "relative", overflow: "hidden",
                        }}>
                            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle,${colors[i]}15,transparent 70%)` }} />
                            <div style={{ fontSize: 28, marginBottom: 10 }}>{medals[i]}</div>
                            <div style={{ width: 56, height: 56, borderRadius: "50%", background: AVA_COLORS[cidx % AVA_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white", margin: "0 auto 12px", boxShadow: `0 6px 20px ${colors[i]}40` }}>
                                {c.employeeName ? c.employeeName[0].toUpperCase() : "?"}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{c.employeeName}</div>
                            <div style={{ fontSize: 11, color: C.muted, margin: "4px 0 12px" }}>{c.role}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: colors[i] }}>{c.normalizedScore}</div>
                            <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>/ 5.0 Puan</div>
                        </div>
                    );
                })}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
                <StatCard icon={<FiAward size={19} />} label="Ort. Performans" value={sorted.length ? (sorted.reduce((acc, curr) => acc + parseFloat(curr.normalizedScore), 0) / sorted.length).toFixed(1) : 0} sub="/ 5.0" color="#6366f1" />
                <StatCard icon={<FiBarChart2 size={19} />} label="Değerlendirilen" value={sorted.length} sub="Bu dönem" color="#22c55e" />
                <StatCard icon={<FiClock size={19} />} label="Tarih" value={new Date().toLocaleDateString("tr-TR", { month: "short", year: "numeric" })} color="#f59e0b" />
                <StatCard icon={<FiStar size={19} />} label="En Yüksek" value={sorted[0]?.normalizedScore || "N/A"} sub={sorted[0]?.employeeName || "-"} color="#f97316" />
            </div>

            {/* Full ranking table */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Tam Sıralama</span>
                    <span style={{ fontSize: 11, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", padding: "3px 9px", borderRadius: 999, fontWeight: 700 }}>{sorted.length} Çalışan</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}` }}>
                            {["Sıra", "Çalışan", "Departman", "Unvan", "Puan", "Değerlendirme"].map(h => (
                                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: 20, color: C.muted, textAlign: "center" }}>Performans kaydı bulunamadı.</td></tr>
                        )}
                        {sorted.map((c, i) => {
                            const cidx = i;
                            const rankColors = ["#f59e0b", "#94a3b8", "#f97316"];
                            const rankBg = i < 3 ? `${rankColors[i]}18` : "rgba(255,255,255,0.04)";
                            const rankColor = i < 3 ? rankColors[i] : C.muted;
                            return (
                                <tr key={c._id} style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.15s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <td style={{ padding: "14px 18px" }}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: rankBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: rankColor }}>{i + 1}</div>
                                    </td>
                                    <td style={{ padding: "14px 18px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: AVA_COLORS[cidx % AVA_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>
                                                {c.employeeName ? c.employeeName[0].toUpperCase() : "?"}
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.employeeName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "14px 18px" }}>
                                        <span style={{ fontSize: 11, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", padding: "3px 9px", borderRadius: 999, fontWeight: 600 }}>{c.period}</span>
                                    </td>
                                    <td style={{ padding: "14px 18px", fontSize: 12, color: C.muted }}>{c.role}</td>
                                    <td style={{ padding: "14px 18px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                                                <div style={{ width: `${(c.normalizedScore / 5) * 100}%`, height: "100%", background: `linear-gradient(90deg,#4f46e5,#818cf8)`, borderRadius: 999, boxShadow: "0 0 8px rgba(99,102,241,0.5)" }} />
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: c.normalizedScore >= 4.5 ? "#22c55e" : c.normalizedScore >= 4 ? "#f59e0b" : C.muted }}>{c.normalizedScore}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "14px 18px" }}>
                                        <div style={{ display: "flex" }}>
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <FiStar key={s} size={12} fill={s <= Math.round(c.normalizedScore) ? C.yellow : "transparent"} color={s <= Math.round(c.normalizedScore) ? C.yellow : "rgba(255,255,255,0.1)"} />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

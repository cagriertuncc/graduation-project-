import { useState } from "react";
import { FiCalendar, FiX, FiCheck } from "react-icons/fi";

const API = "http://localhost:5001";

const inp = {
    width: "100%", padding: "10px 14px",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, color: "#1e293b", fontSize: 13,
    fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box",
};

export default function IzinTalebiModal({ onClose, token }) {
    const [form, setForm] = useState({ tip: "Yıllık İzin", baslangic: "", bitis: "", aciklama: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const gun = form.baslangic && form.bitis
        ? Math.ceil((new Date(form.bitis) - new Date(form.baslangic)) / 86400000) + 1
        : 0;

    const handleSubmit = async () => {
        if (!form.baslangic || !form.bitis) { setError("Lütfen başlangıç ve bitiş tarihi seçin."); return; }
        if (gun < 1) { setError("Bitiş tarihi başlangıç tarihinden önce olamaz."); return; }
        setLoading(true); setError("");
        try {
            const res = await fetch(`${API}/api/leave-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Hata");
            setSuccess(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: "white", borderRadius: 24, padding: 36, width: 460, boxShadow: "0 32px 72px rgba(0,0,0,0.2)" }}>
                {success ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✅</div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Talep Gönderildi!</h3>
                        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>İzin talebiniz İK birimine iletildi. Onay bekleyiniz.</p>
                        <button onClick={onClose} style={{ padding: "10px 28px", background: "#10b981", border: "none", borderRadius: 11, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "Inter,sans-serif" }}>Tamam</button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}>
                                <FiCalendar color="#ef4444" /> İzin Talebi Oluştur
                            </h3>
                            <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "7px 8px", cursor: "pointer", color: "#64748b" }}><FiX size={14} /></button>
                        </div>

                        {/* İzin Tipi */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>İzin Türü</label>
                            <select value={form.tip} onChange={e => setForm(p => ({ ...p, tip: e.target.value }))} style={inp}>
                                {["Yıllık İzin", "Hastalık İzni", "Mazeret İzni", "Ücretsiz İzin"].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Tarihler */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            {[{ label: "Başlangıç", key: "baslangic" }, { label: "Bitiş", key: "bitis" }].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>{f.label}</label>
                                    <input type="date" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                        min={new Date().toISOString().split("T")[0]} style={inp} />
                                </div>
                            ))}
                        </div>

                        {/* Gün sayacı */}
                        {gun > 0 && (
                            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#0369a1", fontWeight: 600 }}>
                                📅 Toplam <strong>{gun} gün</strong> izin talep ediyorsunuz.
                            </div>
                        )}

                        {/* Açıklama */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Açıklama (İsteğe Bağlı)</label>
                            <textarea value={form.aciklama} onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))}
                                placeholder="Açıklama ekleyin..." rows={3}
                                style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
                        </div>

                        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#ef4444" }}>{error}</div>}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={onClose} style={{ flex: 1, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 11, color: "#64748b", fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13 }}>İptal</button>
                            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: 12, background: loading ? "#cbd5e1" : "#ef4444", border: "none", borderRadius: 11, color: "white", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}>
                                {loading ? "Gönderiliyor..." : <><FiCheck size={14} /> Talebi Gönder</>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

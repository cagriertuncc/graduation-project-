import React, { useState, useEffect } from "react";
import { FiBriefcase, FiMapPin, FiClock, FiSend, FiCheckCircle } from "react-icons/fi";

const C = {
    bg: "#050505",
    card: "rgba(255, 255, 255, 0.03)",
    cardHover: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.08)",
    text: "#f8fafc",
    muted: "#94a3b8",
    primary: "#6366f1",
    primaryHover: "#4f46e5"
};

export default function Kariyer() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [form, setForm] = useState({
        applicantName: "",
        email: "",
        phone: "",
        experienceYears: 0,
        cvUrl: "",
        cvFile: null,
        notes: ""
    });
    const [submitStatus, setSubmitStatus] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5001/api/hr/postings")
            .then(res => res.json())
            .then(data => {
                setJobs(data);
                setLoading(false);
            })
            .catch(err => console.error("Job load error:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus("loading");

        try {
            const formData = new FormData();
            formData.append("jobId", selectedJob._id);
            formData.append("applicantName", form.applicantName);
            formData.append("email", form.email);
            formData.append("phone", form.phone);
            formData.append("experienceYears", form.experienceYears);
            formData.append("notes", form.notes);
            if (form.cvUrl) formData.append("cvUrl", form.cvUrl);
            if (form.cvFile) formData.append("cvFile", form.cvFile);

            const res = await fetch("http://localhost:5001/api/hr/applications", {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                setSubmitStatus("success");
                setTimeout(() => {
                    setSelectedJob(null);
                    setSubmitStatus(null);
                    setForm({ applicantName: "", email: "", phone: "", experienceYears: 0, cvUrl: "", cvFile: null, notes: "" });
                }, 3000);
            } else {
                setSubmitStatus("error");
            }
        } catch (err) {
            setSubmitStatus("error");
        }
    };

    if (loading) return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>İlanlar Yükleniyor...</div>;

    return (
        <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, sans-serif" }}>
            {/* Header Hero */}
            <div style={{
                padding: "100px 20px 60px",
                textAlign: "center",
                background: "radial-gradient(circle at top, rgba(99,102,241,0.15) 0%, transparent 60%)"
            }}>
                <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16, background: "linear-gradient(to right, #fff, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Bizimle Çalışın
                </h1>
                <p style={{ fontSize: 18, color: C.muted, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
                    MediTrack Hastanesi'nin yenilikçi ve büyüyen ekibine katılın. Kariyerinize sağlık sektörünün öncüsü olan kurumumuzda yön verin.
                </p>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 80px" }}>

                {jobs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: C.card, borderRadius: 24, border: `1px solid ${C.border}` }}>
                        <FiBriefcase size={48} color={C.muted} style={{ marginBottom: 20, opacity: 0.5 }} />
                        <h3 style={{ fontSize: 20, color: C.text, marginBottom: 8 }}>Şu an açık pozisyon bulunmuyor</h3>
                        <p style={{ color: C.muted }}>Gelecekteki fırsatlar için sayfamızı tekrar ziyaret edebilirsiniz.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                        {jobs.map(job => (
                            <div key={job._id} style={{
                                background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28,
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer",
                                display: "flex", flexDirection: "column"
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.cardHover; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                                onClick={() => setSelectedJob(job)}
                            >
                                <div style={{ background: "rgba(99,102,241,0.1)", display: "inline-block", padding: "8px 14px", borderRadius: 999, color: "#a5b4fc", fontSize: 12, fontWeight: 700, marginBottom: 16, alignSelf: "flex-start" }}>
                                    {job.department}
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{job.title}</h3>
                                <div style={{ display: "flex", gap: 16, color: C.muted, fontSize: 13, marginBottom: 20, flexWrap: "wrap" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiMapPin /> {job.location}</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiClock /> {job.employmentType}</span>
                                </div>
                                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
                                    {job.description?.substring(0, 100)}{job.description?.length > 100 ? "..." : ""}
                                </p>
                                <button style={{
                                    background: "rgba(255,255,255,0.05)", border: "none", color: C.text, padding: "12px", borderRadius: 12,
                                    fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "background 0.2s"
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = C.primary}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                >
                                    Pozisyonu İncele & Başvur
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Application Modal */}
            {selectedJob && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
                    onClick={e => e.target === e.currentTarget && setSelectedJob(null)}>
                    <div style={{ background: "#0f111a", border: `1px solid ${C.border}`, borderRadius: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>

                        <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selectedJob.title}</h2>
                                <p style={{ fontSize: 13, color: C.muted }}>{selectedJob.department} · {selectedJob.location}</p>
                            </div>
                            <button onClick={() => setSelectedJob(null)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 24 }}>&times;</button>
                        </div>

                        <div style={{ padding: 32, overflowY: "auto", flex: 1 }}>
                            {submitStatus === "success" ? (
                                <div style={{ textAlign: "center", padding: "40px 0" }}>
                                    <FiCheckCircle size={64} color="#22c55e" style={{ marginBottom: 20 }} />
                                    <h3 style={{ fontSize: 24, color: "#22c55e", marginBottom: 10 }}>Başvurunuz Alındı!</h3>
                                    <p style={{ color: C.muted }}>İnsan Kaynakları ekibimiz başvurunuzu değerlendirdikten sonra sizinle iletişime geçecektir.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                                    <div style={{ marginBottom: 10 }}>
                                        <h4 style={{ fontSize: 16, marginBottom: 8, color: C.text }}>Genel Nitelikler</h4>
                                        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{selectedJob.requirements}</p>
                                    </div>

                                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                        <div style={{ gridColumn: "1 / -1" }}>
                                            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>Ad Soyad</label>
                                            <input required value={form.applicantName} onChange={e => setForm({ ...form, applicantName: e.target.value })} type="text" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: 12, borderRadius: 10, color: "white", outline: "none", boxSizing: "border-box" }} />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>E-Posta</label>
                                            <input required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: 12, borderRadius: 10, color: "white", outline: "none", boxSizing: "border-box" }} />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>Telefon</label>
                                            <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: 12, borderRadius: 10, color: "white", outline: "none", boxSizing: "border-box" }} />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>Deneyim (Yıl)</label>
                                            <input required value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: e.target.value })} type="number" min="0" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: 12, borderRadius: 10, color: "white", outline: "none", boxSizing: "border-box" }} />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>CV Bağlantısı (URL)</label>
                                            <input value={form.cvUrl} onChange={e => setForm({ ...form, cvUrl: e.target.value })} type="url" placeholder="LinkedIn veya Drive linki" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: 12, borderRadius: 10, color: "white", outline: "none", boxSizing: "border-box" }} />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>CV Yükle (PDF veya Link)</label>
                                            <input onChange={e => setForm({ ...form, cvFile: e.target.files[0] })} type="file" accept=".pdf" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: 9, borderRadius: 10, color: "white", outline: "none", boxSizing: "border-box", fontSize: 14 }} />
                                        </div>

                                        <div style={{ gridColumn: "1 / -1" }}>
                                            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>Ön Yazı (Bize Neden Katılmak İstiyorsunuz?)</label>
                                            <textarea rows="4" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: 12, borderRadius: 10, color: "white", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                                        </div>
                                    </div>

                                    {submitStatus === "error" && <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>Bir hata oluştu, lütfen tekrar deneyin.</div>}

                                    <div style={{ paddingTop: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                        <button type="button" onClick={() => setSelectedJob(null)} style={{ background: "transparent", border: "none", color: C.muted, padding: "12px 20px", borderRadius: 12, cursor: "pointer", fontWeight: 600 }}>İptal</button>
                                        <button type="submit" disabled={submitStatus === "loading"} style={{ background: C.primary, border: "none", color: "white", padding: "12px 24px", borderRadius: 12, cursor: submitStatus === "loading" ? "not-allowed" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, opacity: submitStatus === "loading" ? 0.7 : 1 }}>
                                            {submitStatus === "loading" ? "Gönderiliyor..." : <><FiSend /> Başvuruyu Tamamla</>}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

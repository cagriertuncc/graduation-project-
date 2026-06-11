import { useState, useRef, useEffect } from "react";
import { FiMessageSquare, FiX, FiSend, FiActivity, FiUser, FiInfo, FiPlusCircle, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { patientPortalApi } from "../../services/patientPortalApi";

export default function AIAssistant({ patientUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState("chat"); // 'chat' or 'triage'
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Merhaba! Ben MediTrack AI Sağlık Asistanıyım. Size nasıl yardımcı olabilirim?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [triageResult, setTriageResult] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (mode === "chat") scrollToBottom();
    }, [messages, mode]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");

        if (mode === "triage") {
            setLoading(true);
            setTriageResult(null);
            try {
                const res = await patientPortalApi.aiTriage(userMsg, patientUser);
                setTriageResult(res);
            } catch (err) {
                console.error(err);
                setTriageResult({ error: "Analiz sırasında bir hata oluştu." });
            } finally {
                setLoading(false);
            }
            return;
        }

        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const res = await patientPortalApi.aiChat(userMsg, messages, {
                age: patientUser?.age,
                height: patientUser?.height,
                weight: patientUser?.weight,
                chronicDiseases: patientUser?.chronicDiseases,
                allergies: patientUser?.allergies,
                recentLabs: patientUser?.recentLabs,
                activeMeds: patientUser?.activeMeds
            });
            setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: "Üzgünüm, şu an bağlantı sorunu yaşıyorum. Lütfen daha sonra tekrar deneyin." }]);
        } finally {
            setLoading(false);
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency?.toLowerCase()) {
            case "yüksek": return "#ef4444";
            case "orta": return "#f59e0b";
            case "düşük": return "#10b981";
            default: return "#64748b";
        }
    };

    return (
        <>
            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed", bottom: "30px", left: "30px", zIndex: 9999,
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #be123c 0%, #4c0519 100%)",
                    color: "white", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 10px 25px -5px rgba(190, 18, 60, 0.4)",
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}
            >
                {isOpen ? <FiX size={28} /> : <FiMessageSquare size={28} />}
            </button>

            {/* Chat Drawer */}
            {isOpen && (
                <div style={{
                    position: "fixed", bottom: "110px", left: "30px", width: "400px", height: "600px",
                    background: "white", borderRadius: "24px", zIndex: 9998,
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    border: "1px solid rgba(190, 18, 60, 0.1)",
                    animation: "slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
                }}>
                    <style>{`
                        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                        .chat-scroll::-webkit-scrollbar { width: 4px; }
                        .chat-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; borderRadius: 4px; }
                        .mode-btn { flex: 1; padding: 10px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 600; color: #64748b; transition: all 0.3s; }
                        .mode-btn.active { color: #be123c; border-bottom: 2px solid #be123c; }
                    `}</style>

                    {/* Header */}
                    <div style={{ padding: "20px", background: "linear-gradient(135deg, #be123c 0%, #9f1239 100%)", color: "white" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ padding: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "10px" }}>
                                <FiActivity size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>MediTrack AI</h3>
                                <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>Akıllı Sağlık Asistanı</p>
                            </div>
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
                        <button className={`mode-btn ${mode === "chat" ? "active" : ""}`} onClick={() => setMode("chat")}>Sohbet</button>
                        <button className={`mode-btn ${mode === "triage" ? "active" : ""}`} onClick={() => setMode("triage")}>Belirti Kontrolü</button>
                    </div>

                    {/* Content */}
                    <div className="chat-scroll" style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", background: "#f8fafc" }}>
                        {mode === "chat" ? (
                            <>
                                {messages.map((m, i) => (
                                    <div key={i} style={{
                                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                        maxWidth: "80%", padding: "12px 16px", borderRadius: "16px",
                                        background: m.role === "user" ? "#be123c" : "white",
                                        color: m.role === "user" ? "white" : "#1e293b",
                                        boxShadow: m.role === "user" ? "none" : "0 4px 6px -1px rgba(0,0,0,0.1)",
                                        fontSize: "14px", lineHeight: "1.5"
                                    }}>
                                        {m.content}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ background: "white", padding: "16px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#1e293b" }}>Nasıl hissediyorsunuz?</h4>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Şikayetlerinizi (örn: "şiddetli baş ağrısı ve ateş") yazın, size en uygun bölümü ve aciliyet durumunu söyleyelim.</p>
                                </div>

                                {triageResult && !triageResult.error && (
                                    <div style={{
                                        padding: "20px",
                                        borderRadius: "20px",
                                        background: triageResult.isEmergency ? "#fff1f2" : "white",
                                        border: triageResult.isEmergency ? "2px solid #be123c" : "1px solid #e2e8f0",
                                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                                    }}>
                                        {triageResult.isEmergency && (
                                            <div style={{ color: "#be123c", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontSize: "16px" }}>
                                                <FiAlertTriangle size={24} />
                                                ACİL DURUM UYARISI
                                            </div>
                                        )}

                                        <div style={{ marginBottom: "15px" }}>
                                            <label style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Önerilen Branş</label>
                                            <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{triageResult.suggestedSpecialty}</div>
                                        </div>

                                        <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
                                            <div>
                                                <label style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Aciliyet</label>
                                                <div style={{ color: getUrgencyColor(triageResult.urgency), fontWeight: 700 }}>{triageResult.urgency}</div>
                                            </div>
                                        </div>

                                        <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px", fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>
                                            {triageResult.reason}
                                        </div>

                                        {triageResult.warning && (
                                            <div style={{ marginTop: "15px", padding: "12px", background: "#be123c", color: "white", borderRadius: "12px", fontWeight: 600, textAlign: "center", animation: "pulse 2s infinite" }}>
                                                {triageResult.warning}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {triageResult?.error && (
                                    <div style={{ padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "12px", fontSize: "13px" }}>
                                        {triageResult.error}
                                    </div>
                                )}
                            </div>
                        )}

                        {loading && (
                            <div style={{ alignSelf: "flex-start", background: "white", padding: "12px 16px", borderRadius: "16px", display: "flex", gap: "4px" }}>
                                <div style={{ width: "6px", height: "6px", background: "#be123c", borderRadius: "50%", animation: "bounce 0.6s infinite" }} />
                                <div style={{ width: "6px", height: "6px", background: "#be123c", borderRadius: "50%", animation: "bounce 0.6s 0.2s infinite" }} />
                                <div style={{ width: "6px", height: "6px", background: "#be123c", borderRadius: "50%", animation: "bounce 0.6s 0.4s infinite" }} />
                                <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } } @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }`}</style>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Disclaimer */}
                    <div style={{ padding: "8px 20px", background: "#fff1f2", color: "#be123c", fontSize: "10px", textAlign: "center", display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiInfo size={14} />
                        Asistan önerileri bilgilendirme amaçlıdır. Bir doktora danışın.
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} style={{ padding: "20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "12px" }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === "chat" ? "Bir soru sorun..." : "Şikayetlerinizi buraya yazın..."}
                            style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" }}
                        />
                        <button type="submit" disabled={loading} style={{ width: "44px", height: "44px", background: "#be123c", color: "white", border: "none", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                            <FiSend size={20} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

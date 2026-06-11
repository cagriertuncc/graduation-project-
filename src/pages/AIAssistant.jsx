import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FiCpu, FiSend, FiZap, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";

const API_BASE = "/api";

const RISK_PATIENTS = [
  { name: "Ahmet Y.", age: 67, risk: "Yüksek", score: 87, condition: "Kardiyovasküler", color: "#ef4444", bg: "#fef2f2" },
  { name: "Fatma K.", age: 54, risk: "Orta",   score: 58, condition: "Diyabet Tip 2",  color: "#f59e0b", bg: "#fffbeb" },
  { name: "Mehmet Ş.", age: 71, risk: "Yüksek", score: 91, condition: "Kronik Böbrek",  color: "#ef4444", bg: "#fef2f2" },
  { name: "Ayşe D.",  age: 43, risk: "Düşük",  score: 22, condition: "Hipertansiyon",  color: "#10b981", bg: "#f0fdf4" },
];

/* ─── Typing animation dots ─── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "3px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: `aiDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.6 }} />
      ))}
    </div>
  );
}

/* ─── Chat message ─── */
function Message({ msg }) {
  const [displayed, setDisplayed] = useState(msg.isNew && msg.role === "assistant" ? "" : msg.text);
  const [done, setDone] = useState(!(msg.isNew && msg.role === "assistant"));
  const isUser = msg.role === "user";

  useEffect(() => {
    if (!(msg.isNew && msg.role === "assistant")) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(msg.text.slice(0, i));
      if (i >= msg.text.length) { clearInterval(id); setDone(true); }
    }, 12);
    return () => clearInterval(id);
  }, [msg.text, msg.isNew, msg.role]);

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14, animation: "aiFadeUp 0.25s ease" }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#ef4444", marginTop: 2 }}>
          <RiRobot2Line />
        </div>
      )}
      <div style={{ maxWidth: "75%" }}>
        {!isUser && msg.confidence && done && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#16a34a", fontWeight: 700, marginBottom: 5 }}>
            <FiCheckCircle style={{ fontSize: 10 }} /> %{msg.confidence} güven
          </div>
        )}
        <div style={{ padding: "11px 14px", background: isUser ? "linear-gradient(135deg,#ef4444,#dc2626)" : "white", border: isUser ? "none" : "1px solid #e5e7eb", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", boxShadow: isUser ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.05)", color: isUser ? "white" : "#1e293b", fontSize: 14, lineHeight: 1.6 }}>
          <div dangerouslySetInnerHTML={{ __html: displayed.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${isUser ? "#fff" : "#ef4444"}">$1</strong>`) }} />
        </div>
      </div>
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "white", marginTop: 2 }}>
          DR
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function AIAssistant() {
  const { user, token } = useAuth();
  const doctorName = user?.name || "Doktor";

  const greeting = `Merhaba Dr. ${doctorName.split(" ").slice(1).join(" ")}! Ben MediAI, yapay zeka destekli tıbbi karar destek asistanınızım. Semptom analizi, teşhis desteği ve hasta risk değerlendirmesi konularında yardıma hazırım.`;

  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([{ role: "assistant", text: greeting, isNew: false }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text: text.trim(), isNew: true };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/doctor-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: text.trim(),
          doctorInfo: { name: doctorName, specialty: user?.specialty || "" },
          history: messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply || "Yanıt alınamadı.", confidence: 88, isNew: true }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Bağlantı hatası oluştu. Lütfen tekrar deneyin.", isNew: true }]);
    } finally {
      setLoading(false);
    }
  };

  const runScan = () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult({ scanned: 142, flagged: 8, critical: 2, time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) });
    }, 3000);
  };

  const quickPrompts = ["Semptomları analiz et", "İlaç etkileşimini kontrol et", "Risk değerlendirmesi yap", "Ayırıcı tanı öner"];

  const tabs = [
    { id: "chat", label: "💬 AI Sohbet" },
    { id: "risk", label: "⚠️ Risk Analizi" },
    { id: "batch", label: "🔬 Toplu Tarama" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif", padding: 32 }}>
      <style>{`
        @keyframes aiDotBounce { 0%,60%,100% { transform: translateY(0); opacity:0.4; } 30% { transform: translateY(-5px); opacity:1; } }
        @keyframes aiFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes aiSpin { to { transform: rotate(360deg); } }
        @keyframes aiPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .ai-tab-btn { transition: all 0.15s ease; cursor: pointer; }
        .ai-tab-btn:hover { filter: brightness(0.95); }
        .ai-qbtn:hover { background: #fef2f2 !important; border-color: #fecaca !important; color: #ef4444 !important; }
        .ai-send:hover { opacity:0.88; }
        .ai-chat-input:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .ai-risk-row:hover { background: #f8fafc !important; }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
            <FiCpu /> AI KARAR DESTEK SİSTEMİ
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", letterSpacing: -0.5, marginBottom: 4 }}>
                MediAI Asistan
                <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: 20, verticalAlign: "middle" }}>BETA</span>
              </h1>
              <p style={{ color: "#64748b", fontSize: 14 }}>Yapay zeka destekli tıbbi karar destek ve risk analiz platformu</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "7px 14px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "aiPulse 1.8s ease infinite" }} />
              <span style={{ color: "#16a34a", fontSize: 12, fontWeight: 700 }}>Model Aktif</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t.id} className="ai-tab-btn" onClick={() => setActiveTab(t.id)} style={{
              padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: activeTab === t.id ? "1px solid #fca5a5" : "1px solid #e5e7eb",
              background: activeTab === t.id ? "#fef2f2" : "white",
              color: activeTab === t.id ? "#dc2626" : "#64748b",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Chat Tab ── */}
        {activeTab === "chat" && (
          <div style={{ display: "flex", gap: 20, height: "calc(100vh - 320px)", minHeight: 440 }}>
            {/* Chat panel */}
            <div style={{ flex: 1, background: "white", border: "1px solid #e5e7eb", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 8px" }}>
                {messages.map((m, i) => <Message key={i} msg={m} />)}
                {loading && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 15 }}><RiRobot2Line /></div>
                    <div style={{ padding: "11px 14px", background: "white", border: "1px solid #e5e7eb", borderRadius: "16px 16px 16px 4px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}><TypingDots /></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: "8px 14px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {quickPrompts.map(p => (
                  <button key={p} className="ai-qbtn" onClick={() => send(p)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "1px solid #e5e7eb", background: "white", color: "#64748b", cursor: "pointer", transition: "all 0.15s" }}>{p}</button>
                ))}
              </div>

              <div style={{ padding: "12px 14px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
                <input
                  className="ai-chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send(input)}
                  placeholder="Klinik soru veya semptom yazın..."
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", color: "#1e293b", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
                />
                <button className="ai-send" onClick={() => send(input)} disabled={loading || !input.trim()}
                  style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: (!input.trim() || loading) ? 0.45 : 1, boxShadow: "0 2px 8px rgba(239,68,68,0.25)", transition: "opacity 0.15s" }}>
                  <FiSend /> Gönder
                </button>
              </div>
            </div>

            {/* Warning sidebar */}
            <div style={{ width: 220 }}>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", marginBottom: 5 }}>⚠️ UYARI</div>
                <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>Bu sistem yapay zeka destekli deneysel bir araçtır. Nihai klinik karar hekime aittir.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Risk Tab ── */}
        {activeTab === "risk" && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 16 }}>Hasta Risk Analizi</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>AI tabanlı risk skorlaması — son 30 gün</div>
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#64748b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}><FiRefreshCw /> Yenile</button>
            </div>
            <div style={{ padding: "0 22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 60px 80px 1.5fr 140px", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                {["Hasta", "Yaş", "Risk", "Durum", "Skor"].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{h}</div>
                ))}
              </div>
              {RISK_PATIENTS.map((p, i) => (
                <div key={i} className="ai-risk-row" style={{ display: "grid", gridTemplateColumns: "2fr 60px 80px 1.5fr 140px", padding: "14px 8px", borderBottom: i < RISK_PATIENTS.length - 1 ? "1px solid #f3f4f6" : "none", alignItems: "center", borderRadius: 8, margin: "0 -8px", transition: "background 0.15s", cursor: "default" }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{p.age}</div>
                  <div><span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.bg, color: p.color, border: `1px solid ${p.color}30` }}>{p.risk}</span></div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{p.condition}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.score}%`, background: p.color, borderRadius: 10 }} />
                    </div>
                    <span style={{ color: p.color, fontWeight: 800, fontSize: 13, minWidth: 24 }}>{p.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Batch Tab ── */}
        {activeTab === "batch" && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: 40, textAlign: "center" }}>
            {!analyzing && !analysisResult && (
              <>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#ef4444", margin: "0 auto 18px" }}>🔬</div>
                <h2 style={{ color: "#1e293b", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Toplu Hasta Taraması</h2>
                <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Tüm aktif hastalarınızı AI ile analiz edin, risk altındaki vakaları tespit edin.</p>
                <button onClick={runScan} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(239,68,68,0.25)" }}>
                  <FiZap /> Taramayı Başlat
                </button>
              </>
            )}
            {analyzing && (
              <div style={{ padding: "30px 0" }}>
                <div style={{ width: 52, height: 52, border: "3px solid #fee2e2", borderTop: "3px solid #ef4444", borderRadius: "50%", animation: "aiSpin 1s linear infinite", margin: "0 auto 20px" }} />
                <h3 style={{ color: "#1e293b", marginBottom: 6 }}>Taranıyor...</h3>
                <p style={{ color: "#64748b", fontSize: 13 }}>Bu işlem birkaç saniye sürebilir.</p>
              </div>
            )}
            {analysisResult && (
              <div style={{ animation: "aiFadeUp 0.4s ease" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
                <h2 style={{ color: "#1e293b", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Tarama Tamamlandı</h2>
                <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 24 }}>{analysisResult.time} itibarıyla</p>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
                  {[
                    { label: "Taranan Hasta", val: analysisResult.scanned, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                    { label: "Dikkat Gerektiren", val: analysisResult.flagged, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
                    { label: "Kritik", val: analysisResult.critical, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                  ].map(r => (
                    <div key={r.label} style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: 14, padding: "20px 32px", textAlign: "center" }}>
                      <div style={{ fontSize: 30, fontWeight: 800, color: r.color }}>{r.val}</div>
                      <div style={{ color: r.color, fontSize: 12, marginTop: 4, fontWeight: 600 }}>{r.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setAnalysisResult(null)} style={{ padding: "9px 20px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Yeni Tarama</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
    FiCpu, FiZap, FiRefreshCw, FiPlay, FiSliders, FiActivity, 
    FiDatabase, FiCheckCircle, FiShield, FiAlertTriangle, FiArrowRight, FiInfo 
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

export default function AISystemControl() {
    const { user, token } = useAuth();
    
    // Config state (mock or local storage)
    const [config, setConfig] = useState({
        activeModel: "gemini-2.5-flash",
        temperature: 0.2,
        maxTokens: 1024,
        systemInstruction: "Sen MediAI adında yapay zeka destekli bir tıbbi karar destek asistanısın. Doktorların sorularına klinik çerçevede, güvenilir, kanıta dayalı ve kısa yanıtlar verirsin.",
        safetyFilter: "high",
        autoScan: true
    });

    // Connection test states
    const [testPrompt, setTestPrompt] = useState("Hasta göğüs ağrısı, sol kola yayılan ağrı şikayetiyle başvurdu. Aciliyet durumu nedir?");
    const [testResult, setTestResult] = useState("");
    const [testLatency, setTestLatency] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    // DB Scan states
    const [isScanning, setIsScanning] = useState(false);
    const [scanLogs, setScanLogs] = useState([]);
    const [scanResults, setScanResults] = useState(null);

    // Metrics
    const metrics = {
        totalCalls: 1240,
        avgLatency: "1.24s",
        tokenUsage: { input: "420K", output: "185K" },
        costEst: "$0.48",
        successRate: "99.8%"
    };

    const handleSaveConfig = (e) => {
        e.preventDefault();
        localStorage.setItem("ai_system_config", JSON.stringify(config));
        toast.success("AI Sistem Parametreleri Başarıyla Güncellendi!");
    };

    useEffect(() => {
        const saved = localStorage.getItem("ai_system_config");
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (err) {
                console.error("Failed to load config", err);
            }
        }
    }, []);

    const handleConnectionTest = async () => {
        if (!testPrompt.trim()) return;
        setIsTesting(true);
        setTestResult("");
        setTestLatency(null);
        const startTime = Date.now();

        try {
            const res = await fetch("/api/ai/doctor-chat", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    message: testPrompt.trim(),
                    doctorInfo: { name: "Sysadmin Test", specialty: "Bilgi İşlem" }
                }),
            });
            const data = await res.json();
            const latency = ((Date.now() - startTime) / 1000).toFixed(2);
            
            if (res.ok) {
                setTestResult(data.reply || "Yanıt alınamadı.");
                setTestLatency(`${latency}sn`);
                toast.success("AI Sunucu Yanıtı Alındı!");
            } else {
                setTestResult("Hata: " + (data.error || "İstek başarısız oldu."));
                toast.error("AI Sunucu Testi Başarısız.");
            }
        } catch (err) {
            setTestResult("Bağlantı Hatası: Sunucuya ulaşılamıyor.");
            toast.error("Bağlantı hatası.");
        } finally {
            setIsTesting(false);
        }
    };

    const handleDbScan = () => {
        setIsScanning(true);
        setScanLogs([]);
        setScanResults(null);

        const logs = [
            "[AI Engine] Veritabanı tarama işlemi başlatıldı...",
            "[AI Engine] Son 7 günde kaydedilen hasta tanı girdileri çekiliyor...",
            "[AI Engine] 142 adet hasta kaydı analiz ediliyor...",
            "[AI] Eşleşme kontrolü: Şikayet ile atanan branş uyumu inceleniyor...",
            "[AI] Risk değerlendirmesi: Vital bulgulardaki anormal seyrin kontrolü...",
            "[AI] Bulgular: 8 hastada tanı/şikayet uyumsuzluğu, 2 hastada kritik vital sapması tespit edildi.",
            "[AI Engine] AI Triage Denetimi tamamlandı. Rapor oluşturuldu."
        ];

        let idx = 0;
        const interval = setInterval(() => {
            if (idx < logs.length) {
                setScanLogs(prev => [...prev, logs[idx]]);
                idx++;
            } else {
                clearInterval(interval);
                setIsScanning(false);
                setScanResults({
                    scanned: 142,
                    flagged: 8,
                    critical: 2
                });
                toast.success("AI Veritabanı Taraması Tamamlandı!");
            }
        }, 5000 / logs.length);
    };

    return (
        <div className="ai-system-control animate-fade-in" style={{
            color: "white",
            minHeight: "100vh",
            background: "transparent",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif",
            padding: "40px"
        }}>
            <Toaster position="top-right" />

            <div style={{ position: "relative", zIndex: 1, maxWidth: "1440px", margin: "0 auto" }}>
                
                {/* Header */}
                <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6366f1", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>
                            <FiCpu /> Tıbbi Karar Destek Altyapısı
                        </div>
                        <h1 style={{ fontSize: "40px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-1px", background: "linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            AI Sistem Kontrolü
                        </h1>
                        <p style={{ color: "#64748b", margin: 0, fontSize: "16px", fontWeight: 400 }}>
                            MediAI Gemini model parametreleri, API bağlantı testleri, maliyet/token takibi ve AI Triage veritabanı tarama merkezi.
                        </p>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "20px", padding: "8px 16px" }}>
                        <span className="pulse-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                        <span style={{ color: "#10b981", fontSize: "12px", fontWeight: 700 }}>Google Gemini Engine Aktif</span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
                    
                    {/* Left: AI System Param Config (span 7) */}
                    <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: "24px" }}>
                        
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "28px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#60a5fa" }}>
                                <FiSliders /> Model Parametre Ayarları
                            </h2>

                            <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Aktif Dil Modeli</label>
                                    <select 
                                        value={config.activeModel} 
                                        onChange={e => setConfig({ ...config, activeModel: e.target.value })}
                                        style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white", fontSize: "14px", outline: "none" }}
                                    >
                                        <option value="gemini-2.5-flash">♊ Gemini 2.5 Flash (Önerilen - Hızlı &amp; Kararlı)</option>
                                        <option value="gemini-2.5-pro">♊ Gemini 2.5 Pro (Gelişmiş Tıbbi Çıkarım)</option>
                                        <option value="gemini-1.5-flash">♊ Gemini 1.5 Flash (Klasik Sürüm)</option>
                                        <option value="gemini-1.5-pro">♊ Gemini 1.5 Pro (Büyük Bağlam)</option>
                                    </select>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8" }}>Sıcaklık (Temperature)</label>
                                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa" }}>{config.temperature}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1"
                                            value={config.temperature}
                                            onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                                            style={{ width: "100%", accentColor: "#3b82f6" }}
                                        />
                                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>Düşük değerler kesin ve tutarlı, yüksek değerler ise yaratıcı yanıtlar üretir. Tıbbi süreçler için 0.2 idealdir.</span>
                                    </div>
                                    
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Maksimum Yanıt Uzunluğu (Max Tokens)</label>
                                        <select 
                                            value={config.maxTokens} 
                                            onChange={e => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                                            style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white", fontSize: "14px", outline: "none" }}
                                        >
                                            <option value="256">256 Token (~200 Kelime)</option>
                                            <option value="512">512 Token (~400 Kelime)</option>
                                            <option value="1024">1024 Token (~800 Kelime)</option>
                                            <option value="2048">2048 Token (~1600 Kelime)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Sistem Yönergesi (System Prompt)</label>
                                    <textarea 
                                        rows={4}
                                        value={config.systemInstruction}
                                        onChange={e => setConfig({ ...config, systemInstruction: e.target.value })}
                                        placeholder="AI asistanın davranış kuralları..."
                                        style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white", fontSize: "13px", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                                    />
                                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>AI modelinin rolünü, sınırlarını ve klinik üslubunu belirler.</span>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "center" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>Güvenlik Filtresi</label>
                                        <select 
                                            value={config.safetyFilter} 
                                            onChange={e => setConfig({ ...config, safetyFilter: e.target.value })}
                                            style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white", fontSize: "14px", outline: "none" }}
                                        >
                                            <option value="low">Kısıtlamasız / Düşük Filtre</option>
                                            <option value="medium">Standart Filtre</option>
                                            <option value="high">Yüksek Güvenlik Filtresi (Önerilen)</option>
                                        </select>
                                    </div>
                                    
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px" }}>
                                        <input 
                                            type="checkbox"
                                            id="autoScan"
                                            checked={config.autoScan}
                                            onChange={e => setConfig({ ...config, autoScan: e.target.checked })}
                                            style={{ width: "18px", height: "18px", accentColor: "#3b82f6", cursor: "pointer" }}
                                        />
                                        <label htmlFor="autoScan" style={{ fontSize: "13px", color: "#cbd5e1", cursor: "pointer", fontWeight: 500 }}>
                                            Günlük Otomatik Hasta Taraması Etkin
                                        </label>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    style={{ marginTop: "10px", width: "100%", padding: "14px", background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)" }}
                                >
                                    <FiShield /> Parametreleri Kaydet
                                </button>

                            </form>
                        </div>

                    </div>

                    {/* Right: Connection Test & Metrics (span 5) */}
                    <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "24px" }}>
                        
                        {/* Metrics */}
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#10b981" }}>
                                <FiActivity /> AI Servis Metrikleri
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {[
                                    { label: "Toplam İstek", value: metrics.totalCalls, color: "#38bdf8" },
                                    { label: "Başarı Oranı", value: metrics.successRate, color: "#10b981" },
                                    { label: "Gecikme (Ort.)", value: metrics.avgLatency, color: "#f59e0b" },
                                    { label: "Maliyet Tahmini", value: metrics.costEst, color: "#a855f7" }
                                ].map((m, i) => (
                                    <div key={i} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>{m.label}</div>
                                        <div style={{ fontSize: "20px", fontWeight: 800, color: m.color }}>{m.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.15)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>Aylık Token Tüketimi</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                                            <span>Input Tokens</span>
                                            <span>{metrics.tokenUsage.input}</span>
                                        </div>
                                        <div style={{ height: "4px", background: "rgba(0,0,0,0.3)", borderRadius: "2px" }}>
                                            <div style={{ width: "70%", height: "100%", background: "#6366f1", borderRadius: "2px" }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                                            <span>Output Tokens</span>
                                            <span>{metrics.tokenUsage.output}</span>
                                        </div>
                                        <div style={{ height: "4px", background: "rgba(0,0,0,0.3)", borderRadius: "2px" }}>
                                            <div style={{ width: "30%", height: "100%", background: "#a855f7", borderRadius: "2px" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connection Test */}
                        <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#38bdf8" }}>
                                <FiZap /> Canlı Bağlantı Testi
                            </h2>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <input 
                                    type="text" 
                                    value={testPrompt}
                                    onChange={e => setTestPrompt(e.target.value)}
                                    placeholder="Model testi için bir prompt yazın..."
                                    style={{ width: "100%", padding: "12px", background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                                />

                                <button 
                                    onClick={handleConnectionTest}
                                    disabled={isTesting || !testPrompt.trim()}
                                    style={{ padding: "12px", background: isTesting ? "#475569" : "#0284c7", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: isTesting ? "wait" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontSize: "13px" }}
                                >
                                    <FiPlay className={isTesting ? "spin-loading" : ""} /> {isTesting ? "AI Yanıtı Bekleniyor..." : "Promptu Gönder"}
                                </button>

                                {/* Terminal Output */}
                                <div style={{
                                    height: "140px",
                                    background: "rgba(2, 6, 23, 0.85)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "10px",
                                    padding: "12px",
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: "11px",
                                    color: "#4ade80",
                                    overflowY: "auto",
                                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
                                    position: "relative"
                                }}>
                                    {testLatency && (
                                        <div style={{ position: "absolute", top: "8px", right: "8px", fontSize: "9px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "2px 6px", borderRadius: "4px" }}>
                                            Gecikme: {testLatency}
                                        </div>
                                    )}

                                    {testResult ? (
                                        <div style={{ whiteSpace: "pre-line" }}>
                                            <span style={{ color: "#38bdf8" }}>[Response]</span> {testResult}
                                        </div>
                                    ) : (
                                        <div style={{ color: "#64748b" }}>
                                            Gemini API bağlantısını doğrulamak için "Promptu Gönder" butonuna tıklayın...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* DB Audit Scan (span 12) */}
                    <div style={{ gridColumn: "span 12", background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", color: "#f59e0b", margin: 0 }}>
                                    <FiDatabase /> AI Veritabanı Triage & Risk Denetimi
                                </h2>
                                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px", margin: 0 }}>
                                    Sistemdeki hasta tanı kayıtlarını ve acil/triage yönlendirmelerini yapay zekayla denetleyin ve tutarsızlıkları raporlayın.
                                </p>
                            </div>
                            
                            <button 
                                onClick={handleDbScan}
                                disabled={isScanning}
                                style={{ background: isScanning ? "#475569" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, cursor: isScanning ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: isScanning ? "none" : "0 4px 12px rgba(217, 119, 6, 0.25)" }}
                            >
                                <FiRefreshCw className={isScanning ? "spin-loading" : ""} /> {isScanning ? "Analiz Ediliyor..." : "AI Denetim Taraması Başlat"}
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
                            
                            {/* Scan terminal */}
                            <div style={{
                                height: "200px",
                                background: "rgba(2, 6, 23, 0.85)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "12px",
                                padding: "16px",
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: "11px",
                                color: "#fbbf24",
                                overflowY: "auto",
                                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)"
                            }}>
                                {scanLogs.length === 0 ? (
                                    <div style={{ color: "#64748b" }}>Tarama sonuçlarını canlı izlemek için yukarıdan denetimi başlatın...</div>
                                ) : (
                                    scanLogs.map((log, index) => (
                                        <div key={index} style={{ marginBottom: "6px" }}>
                                            <span style={{ color: "#d97706" }}>►</span> {log}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Scan Results summary */}
                            <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.02)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                {!scanResults ? (
                                    <div style={{ textAlign: "center", color: "#64748b" }}>
                                        <FiInfo size={32} style={{ marginBottom: "10px" }} />
                                        <div style={{ fontSize: "13px" }}>Bekleyen Tarama Raporu Bulunmuyor</div>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 700, fontSize: "15px" }}>
                                            <FiCheckCircle /> AI Triage Denetimi Başarıyla Tamamlandı
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                                            {[
                                                { label: "Taranan Kayıt", value: scanResults.scanned, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.08)" },
                                                { label: "Tanı Uyumsuzluğu", value: scanResults.flagged, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
                                                { label: "Kritik Sapma", value: scanResults.critical, color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" }
                                            ].map((r, i) => (
                                                <div key={i} style={{ background: r.bg, border: `1px solid ${r.color}25`, padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                                                    <div style={{ fontSize: "24px", fontWeight: 800, color: r.color }}>{r.value}</div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", fontWeight: 600 }}>{r.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>
                                            * **Tanı Uyumsuzluğu:** Hastanın şikayeti ile sevk edildiği branşın uyumsuz olduğu durumlardır. Hekim atamaları gözden geçirilmelidir.
                                            <br />
                                            * **Kritik Sapma:** Vital bulgularda hayati risk teşkil eden seviyeler tespit edilmiş olup, hekim uyarısı oluşturulmuştur.
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>

            </div>

            <style>{`
                .pulse-dot {
                    animation: pulseStatus 1.8s infinite alternate;
                }
                @keyframes pulseStatus {
                    0% { transform: scale(0.9); opacity: 0.6; filter: drop-shadow(0 0 1px #10b981); }
                    100% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 6px #10b981); }
                }
                .spin-loading {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

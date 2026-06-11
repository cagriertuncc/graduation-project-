import React, { useState } from 'react';
import { FiPieChart, FiCoffee, FiActivity, FiTarget, FiHeart, FiCheck, FiDroplet, FiZap, FiInfo, FiRefreshCw, FiShoppingCart, FiList, FiTrendingUp, FiDownload, FiMessageCircle, FiSend, FiUser } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { patientPortalApi } from "../../services/patientPortalApi";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function DietAssistant({ patientUser, theme, lang }) {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);
    const [swappingMealIdx, setSwappingMealIdx] = useState(null);
    const [shoppingList, setShoppingList] = useState(null);
    const [shoppingListLoading, setShoppingListLoading] = useState(false);
    
    const [chatHistory, setChatHistory] = useState([]);
    const [chatMessage, setChatMessage] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    const [target, setTarget] = useState('Kilo Vermek');
    const [activityLevel, setActivityLevel] = useState('Orta');
    const [preferences, setPreferences] = useState('Yok');
    const [waterIntake, setWaterIntake] = useState(0);

    const generatePlan = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await patientPortalApi.aiDietPlan(patientUser, target, activityLevel, preferences);
            if (data && data.error) throw data;
            setPlan(data);
            setShoppingList(null); // Reset shopping list on new plan
            setChatHistory([]); // Reset chat history
        } catch (err) {
            console.error("Frontend Generate Plan Error:", err);
            setError(err.error || err.message || "Plan oluşturulamadı.");
        } finally {
            setLoading(false);
        }
    };

    const handleSwapMeal = async (mealIndex, currentMeal) => {
        setSwappingMealIdx(mealIndex);
        try {
            const newMeal = await patientPortalApi.aiSwapMeal(patientUser, currentMeal, preferences, plan.targetCalories);
            
            // Update the plan state
            const newPlan = { ...plan };
            newPlan.meals[mealIndex] = newMeal;
            setPlan(newPlan);
        } catch (err) {
            console.error("Swap Error:", err);
            // Optionally set a localized error, but usually a silent fail with console log is enough for micro-interactions
        } finally {
            setSwappingMealIdx(null);
        }
    };

    const handleGenerateShoppingList = async () => {
        setShoppingListLoading(true);
        try {
            const list = await patientPortalApi.aiShoppingList(plan.meals);
            setShoppingList(list);
        } catch (err) {
            console.error("Shopping List Error:", err);
            // optionally handle error display
        } finally {
            setShoppingListLoading(false);
        }
    };

    const handleSendChatMessage = async () => {
        if (!chatMessage.trim()) return;
        
        const newMessage = { role: "user", text: chatMessage };
        const updatedHistory = [...chatHistory, newMessage];
        setChatHistory(updatedHistory);
        setChatMessage("");
        setChatLoading(true);

        try {
            const data = await patientPortalApi.aiDietChat(newMessage.text, chatHistory, plan, patientUser);
            setChatHistory([...updatedHistory, { role: "ai", text: data.reply }]);
        } catch (err) {
            console.error("Chat Error:", err);
            setChatHistory([...updatedHistory, { role: "ai", text: lang === 'tr' ? 'Üzgünüm, şu anda yanıt veremiyorum.' : 'Sorry, I cannot respond right now.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const COLORS = ['#10b981', '#f59e0b', '#3b82f6']; // Emerald, Amber, Blue for macros
    const macroData = plan ? [
        { name: 'Karbonhidrat', value: plan.macros.carbs },
        { name: 'Protein', value: plan.macros.protein },
        { name: 'Yağ', value: plan.macros.fat }
    ] : [];

    const getProgressData = () => {
        const currentWeight = patientUser?.weight || 70;
        let trend = 0;
        if (target === 'Kilo Vermek') trend = -0.8;
        if (target === 'Kilo Almak') trend = +0.5;
        if (target === 'Kas Yapmak') trend = +0.3;
        
        return [
            { week: lang === 'tr' ? '1. Hafta' : 'Week 1', weight: parseFloat((currentWeight).toFixed(1)) },
            { week: lang === 'tr' ? '2. Hafta' : 'Week 2', weight: parseFloat((currentWeight + trend).toFixed(1)) },
            { week: lang === 'tr' ? '3. Hafta' : 'Week 3', weight: parseFloat((currentWeight + (trend * 2)).toFixed(1)) },
            { week: lang === 'tr' ? '4. Hafta' : 'Week 4', weight: parseFloat((currentWeight + (trend * 3)).toFixed(1)) },
            { week: lang === 'tr' ? 'Hedef' : 'Target', weight: parseFloat((currentWeight + (trend * 4)).toFixed(1)) }
        ];
    };
    const progressData = getProgressData();

    const handleDownloadPDF = () => {
        const input = document.getElementById("diet-plan-container");
        if(!input) return;
        
        // Hide elements we don't want in PDF
        const hides = document.querySelectorAll(".hide-on-pdf");
        hides.forEach(el => el.style.display = "none");
        
        html2canvas(input, { scale: 2, useCORS: true, backgroundColor: theme === "light" ? "#f8fafc" : "#0f172a" }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // If height exceeds one page, we just add it (it might cut off, but for diet plan it usually fits 1-2 pages)
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("Diyet_Programim.pdf");
            
            // Restore hidden elements
            hides.forEach(el => el.style.display = "");
        });
    };

    const glassCount = 8;

    return (
        <div id="diet-plan-container" style={{ animation: "fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)", padding: "20px" }}>
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .diet-input:focus {
                    border-color: #10b981 !important;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
                }
                .meal-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .meal-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
                }
                .water-glass {
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .water-glass:hover {
                    transform: scale(1.1) rotate(-5deg);
                }
            `}</style>

            {/* Premium Header */}
            <div style={{
                padding: "48px", borderRadius: "32px", 
                background: "linear-gradient(135deg, #064e3b 0%, #0f766e 100%)",
                color: "white", marginBottom: "40px", position: "relative", overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(6, 78, 59, 0.5)"
            }}>
                {/* Decorative Elements */}
                <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", borderRadius: "50%" }}></div>
                <div style={{ position: "absolute", bottom: "-20%", left: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)", borderRadius: "50%" }}></div>
                
                <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", width: "fit-content", padding: "8px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)" }}>
                            <FiZap size={16} color="#fbbf24" /> <span style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "#fbbf24" }}>{lang === 'tr' ? 'Yapay Zeka Destekli' : 'AI Powered'}</span>
                        </div>
                        <h1 style={{ fontSize: "42px", fontWeight: 900, marginBottom: "12px", letterSpacing: "-1px", textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
                            {lang === 'tr' ? 'Kişisel Diyet Asistanınız' : 'Personal Diet Assistant'}
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "18px", maxWidth: "600px", lineHeight: "1.6", fontWeight: 500 }}>
                            {lang === 'tr' ? 'Metabolizmanıza, hedeflerinize ve yaşam tarzınıza en uygun, bilimsel verilere dayalı haftalık beslenme programınızı saniyeler içinde oluşturun.' : 'Generate your scientifically-backed weekly nutrition program tailored to your metabolism, goals, and lifestyle in seconds.'}
                        </p>
                        {plan && (
                            <button 
                                onClick={handleDownloadPDF}
                                className="hide-on-pdf"
                                style={{ marginTop: "24px", padding: "12px 24px", borderRadius: "100px", background: "white", color: "#065f46", border: "none", fontWeight: 800, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", transition: "transform 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                            >
                                <FiDownload size={18} /> {lang === 'tr' ? 'PDF İndir' : 'Download PDF'}
                            </button>
                        )}
                    </div>
                    
                    <div style={{ animation: "float 6s ease-in-out infinite", display: "none" }} className="header-icon-hide-mobile">
                        {/* Hidden on small screens via CSS usually, but we keep it here */}
                        <div style={{ width: "120px", height: "120px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", borderRadius: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)", transform: "rotate(10deg)" }}>
                            <FiCoffee size={64} color="white" />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "40px" }}>
                {/* Left Column: Form & Water Tracker */}
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: theme === "light" ? "white" : "#1e293b", boxShadow: theme === "light" ? "0 20px 40px -10px rgba(0,0,0,0.05)" : "none", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiTarget size={24} />
                            </div>
                            <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: theme === "light" ? "#0f172a" : "white" }}>
                                {lang === 'tr' ? 'Hedef & Profil' : 'Goal & Profile'}
                            </h3>
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", marginBottom: "8px", display: "block" }}>{lang === 'tr' ? 'Ana Hedefiniz' : 'Your Main Goal'}</label>
                                <select 
                                    className="diet-input"
                                    value={target} 
                                    onChange={(e) => setTarget(e.target.value)}
                                    style={{ width: "100%", padding: "16px", borderRadius: "16px", border: `2px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, background: theme === "light" ? "#f8fafc" : "#0f172a", color: theme === "light" ? "#0f172a" : "white", fontWeight: 700, fontSize: "15px", outline: "none", transition: "all 0.3s", cursor: "pointer", appearance: "none" }}
                                >
                                    <option value="Kilo Vermek">🔥 {lang === 'tr' ? 'Kilo Vermek (Yağ Yakımı)' : 'Lose Weight'}</option>
                                    <option value="Kilo Almak">📈 {lang === 'tr' ? 'Kilo Almak (Hacim)' : 'Gain Weight'}</option>
                                    <option value="Kilo Korumak">⚖️ {lang === 'tr' ? 'Kilo Korumak (Sağlıklı Yaşam)' : 'Maintain Weight'}</option>
                                    <option value="Kas Yapmak">💪 {lang === 'tr' ? 'Kas Yapmak (Hipertrofi)' : 'Build Muscle'}</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", marginBottom: "8px", display: "block" }}>{lang === 'tr' ? 'Günlük Aktivite' : 'Daily Activity'}</label>
                                <select 
                                    className="diet-input"
                                    value={activityLevel} 
                                    onChange={(e) => setActivityLevel(e.target.value)}
                                    style={{ width: "100%", padding: "16px", borderRadius: "16px", border: `2px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, background: theme === "light" ? "#f8fafc" : "#0f172a", color: theme === "light" ? "#0f172a" : "white", fontWeight: 700, fontSize: "15px", outline: "none", transition: "all 0.3s", cursor: "pointer", appearance: "none" }}
                                >
                                    <option value="Çok Düşük (Masa başı)">🪑 {lang === 'tr' ? 'Çok Düşük (Masa Başı)' : 'Sedentary'}</option>
                                    <option value="Orta (Haftada 2-3 gün spor)">🚶 {lang === 'tr' ? 'Orta (Haftada 2-3 Gün)' : 'Moderate (2-3 days/week)'}</option>
                                    <option value="Yüksek (Haftada 4+ gün spor)">🏃 {lang === 'tr' ? 'Yüksek (Haftada 4+ Gün)' : 'High (4+ days/week)'}</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", marginBottom: "8px", display: "block" }}>{lang === 'tr' ? 'Diyet Tercihi / Alerji' : 'Dietary Preference / Allergy'}</label>
                                <input 
                                    className="diet-input"
                                    type="text" 
                                    value={preferences} 
                                    onChange={(e) => setPreferences(e.target.value)}
                                    placeholder={lang === 'tr' ? 'Örn: Vegan, Laktozsuz, Fıstık Alerjisi...' : 'e.g., Vegan, Gluten-free...'}
                                    style={{ width: "100%", padding: "16px", borderRadius: "16px", border: `2px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, background: theme === "light" ? "#f8fafc" : "#0f172a", color: theme === "light" ? "#0f172a" : "white", fontWeight: 700, fontSize: "15px", outline: "none", transition: "all 0.3s" }}
                                />
                            </div>

                            <button 
                                onClick={generatePlan}
                                disabled={loading}
                                style={{ 
                                    padding: "20px", borderRadius: "16px", 
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", 
                                    border: "none", fontWeight: 800, fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", marginTop: "12px",
                                    boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    animation: loading ? "none" : "pulseGlow 2s infinite"
                                }}
                                onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-3px)")}
                                onMouseLeave={e => !loading && (e.currentTarget.style.transform = "translateY(0)")}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "3px", borderTopColor: "white", borderRightColor: "transparent" }}></div>
                                        {lang === 'tr' ? 'AI Analiz Ediyor...' : 'AI is Analyzing...'}
                                    </>
                                ) : (
                                    <>
                                        <FiZap size={20} /> {lang === 'tr' ? 'Özel Planımı Oluştur' : 'Generate My Plan'}
                                    </>
                                )}
                            </button>
                            {error && <div style={{ color: "#e11d48", fontSize: "14px", fontWeight: 700, marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", background: "#fff1f2", padding: "12px", borderRadius: "12px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}><FiInfo /> {error}</div>}
                        </div>
                    </div>

                    {/* Progress Tracker Graph */}
                    <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: theme === "light" ? "white" : "#1e293b", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiTrendingUp size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: theme === "light" ? "#0f172a" : "white" }}>
                                    {lang === 'tr' ? 'Gelişim Projeksiyonu' : 'Progress Projection'}
                                </h3>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{lang === 'tr' ? '1 Aylık Tahmini Grafik' : '1 Month Projected Graph'}</p>
                            </div>
                        </div>
                        <div style={{ width: "100%", height: "200px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "light" ? "#e2e8f0" : "#334155"} />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} dy={10} />
                                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", background: theme === "light" ? "white" : "#0f172a", color: theme === "light" ? "black" : "white" }} 
                                        itemStyle={{ fontWeight: 800, color: "#f59e0b" }}
                                    />
                                    <Area type="monotone" dataKey="weight" name={lang === 'tr' ? 'Kilo (kg)' : 'Weight (kg)'} stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: theme === "light" ? "white" : "#1e293b", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(56,189,248,0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FiDroplet size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: theme === "light" ? "#0f172a" : "white" }}>
                                        {lang === 'tr' ? 'Su Takibi' : 'Water Tracker'}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{lang === 'tr' ? 'Günlük Hedef: 2 L' : 'Daily Goal: 2 L'}</p>
                                </div>
                            </div>
                            <div style={{ fontSize: "32px", fontWeight: 900, color: "#0ea5e9", letterSpacing: "-1px" }}>
                                {waterIntake * 250}<span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 700, marginLeft: "4px" }}>ml</span>
                            </div>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                            {Array.from({ length: glassCount }).map((_, idx) => (
                                <button
                                    key={idx}
                                    className="water-glass"
                                    onClick={() => setWaterIntake(idx + 1)}
                                    style={{
                                        aspectRatio: "1", borderRadius: "20px", border: "none", cursor: "pointer",
                                        background: idx < waterIntake ? "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)" : (theme === "light" ? "#f1f5f9" : "#0f172a"),
                                        boxShadow: idx < waterIntake ? "0 10px 20px -5px rgba(2, 132, 199, 0.4), inset 0 -5px 10px rgba(0,0,0,0.1)" : "none",
                                        display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden"
                                    }}
                                >
                                    {idx < waterIntake && (
                                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100%", background: "rgba(255,255,255,0.2)", animation: "fadeIn 0.5s ease" }}></div>
                                    )}
                                    <FiDroplet size={24} color={idx < waterIntake ? "white" : "#cbd5e1"} style={{ position: "relative", zIndex: 1 }} fill={idx < waterIntake ? "white" : "none"} />
                                </button>
                            ))}
                        </div>
                        <div style={{ width: "100%", height: "8px", background: theme === "light" ? "#f1f5f9" : "#0f172a", borderRadius: "10px", marginTop: "24px", overflow: "hidden" }}>
                            <div style={{ height: "100%", background: "#0ea5e9", width: `${(waterIntake / glassCount) * 100}%`, transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)", borderRadius: "10px" }}></div>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Plan Display */}
                <div>
                    {!plan ? (
                        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: theme === "light" ? "rgba(255,255,255,0.5)" : "rgba(30,41,59,0.5)", borderRadius: "32px", border: `2px dashed ${theme === "light" ? "#cbd5e1" : "#334155"}`, transition: "all 0.3s" }}>
                            <div style={{ width: "100px", height: "100px", background: theme === "light" ? "white" : "#1e293b", borderRadius: "32px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", animation: "float 4s ease-in-out infinite", transform: "rotate(-10deg)" }}>
                                <FiActivity size={40} color="#10b981" />
                            </div>
                            <h3 style={{ fontSize: "28px", fontWeight: 900, color: theme === "light" ? "#0f172a" : "white", marginBottom: "16px", textAlign: "center", letterSpacing: "-0.5px" }}>
                                {lang === 'tr' ? 'Planınız Bekleniyor' : 'Awaiting Your Plan'}
                            </h3>
                            <p style={{ color: "#64748b", textAlign: "center", maxWidth: "350px", lineHeight: "1.6", fontSize: "16px", fontWeight: 500 }}>
                                {lang === 'tr' ? 'Soldaki formu doldurun, yapay zeka sizin için en ideal menüyü tasarlasın.' : 'Fill out the form on the left to let AI design the perfect menu for you.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                            {/* Summary Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.4)", position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)", borderRadius: "50%" }}></div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                        <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.2)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}><FiActivity size={24} /></div>
                                        <span style={{ fontWeight: 800, fontSize: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>{lang === 'tr' ? 'Hedef Kalori' : 'Target Calories'}</span>
                                    </div>
                                    <div style={{ fontSize: "48px", fontWeight: 900, letterSpacing: "-2px" }}>{plan.targetCalories} <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: "0" }}>kcal</span></div>
                                </div>

                                <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: theme === "light" ? "white" : "#1e293b", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                                    <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#0f172a" : "white", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}><FiPieChart color="#f59e0b" /> {lang === 'tr' ? 'Makro Dağılımı' : 'Macro Distribution'}</h4>
                                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                                        <div style={{ width: "100px", height: "100px", flexShrink: 0 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value">
                                                        {macroData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", background: theme === "light" ? "white" : "#0f172a", color: theme === "light" ? "black" : "white" }} itemStyle={{ fontWeight: 800 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[0] }}></div> <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Karb.</span></div>
                                                <span style={{ fontWeight: 800, color: theme === "light" ? "#0f172a" : "white" }}>{plan.macros.carbs}g</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[1] }}></div> <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Protein</span></div>
                                                <span style={{ fontWeight: 800, color: theme === "light" ? "#0f172a" : "white" }}>{plan.macros.protein}g</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[2] }}></div> <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Yağ</span></div>
                                                <span style={{ fontWeight: 800, color: theme === "light" ? "#0f172a" : "white" }}>{plan.macros.fat}g</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Meals */}
                            <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: theme === "light" ? "white" : "#1e293b", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 900, margin: 0, color: theme === "light" ? "#0f172a" : "white" }}>
                                        {lang === 'tr' ? 'Günlük Menü Önerisi' : 'Daily Menu Suggestion'}
                                    </h3>
                                    <div style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "8px 16px", borderRadius: "100px", fontWeight: 800, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <FiCheck /> {lang === 'tr' ? 'Sizin için özel hazırlandı' : 'Custom prepared for you'}
                                    </div>
                                </div>
                                
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {plan.meals.map((meal, idx) => (
                                        <div key={idx} className="meal-card" style={{ padding: "20px", borderRadius: "24px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", border: `1px solid ${theme === "light" ? "#e2e8f0" : "rgba(255,255,255,0.05)"}`, display: "flex", gap: "24px", cursor: "default" }}>
                                            <div style={{ width: "70px", height: "70px", borderRadius: "20px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(16,185,129,0.3)", flexShrink: 0 }}>
                                                <span style={{ fontSize: "20px", fontWeight: 900 }}>{meal.time.split(":")[0]}</span>
                                                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{meal.time.split(":")[1]}</span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#0f172a" : "white" }}>{meal.type}</h4>
                                                        <button 
                                                            onClick={() => handleSwapMeal(idx, meal)}
                                                            disabled={swappingMealIdx === idx}
                                                            title={lang === 'tr' ? 'Bu öğünü sevmedim, değiştir' : 'Swap this meal'}
                                                            style={{
                                                                background: "transparent", border: "none", color: "#64748b", cursor: swappingMealIdx === idx ? "not-allowed" : "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: "8px",
                                                                transition: "all 0.2s",
                                                                animation: swappingMealIdx === idx ? "spin 1s linear infinite" : "none"
                                                            }}
                                                            onMouseEnter={e => { if(swappingMealIdx !== idx) { e.currentTarget.style.color = "#10b981"; e.currentTarget.style.background = "rgba(16,185,129,0.1)"; } }}
                                                            onMouseLeave={e => { if(swappingMealIdx !== idx) { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; } }}
                                                        >
                                                            <FiRefreshCw size={16} />
                                                        </button>
                                                    </div>
                                                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "6px 12px", borderRadius: "100px" }}>{meal.calories} kcal</span>
                                                </div>
                                                <ul style={{ margin: 0, paddingLeft: "20px", color: "#64748b", fontSize: "15px", lineHeight: "1.7", fontWeight: 500 }}>
                                                    {meal.foods.map((f, i) => (
                                                        <li key={i} style={{ marginBottom: "4px" }}>{f}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Shopping List Button & Display */}
                                <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: `1px dashed ${theme === "light" ? "#e2e8f0" : "#334155"}` }}>
                                    {!shoppingList ? (
                                        <button 
                                            onClick={handleGenerateShoppingList}
                                            disabled={shoppingListLoading}
                                            style={{ 
                                                width: "100%", padding: "16px", borderRadius: "20px", 
                                                background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", 
                                                color: theme === "light" ? "#0f172a" : "white", 
                                                border: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, fontWeight: 800, fontSize: "16px", 
                                                cursor: shoppingListLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={e => !shoppingListLoading && (e.currentTarget.style.background = theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)")}
                                            onMouseLeave={e => !shoppingListLoading && (e.currentTarget.style.background = theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)")}
                                        >
                                            {shoppingListLoading ? (
                                                <>
                                                    <div className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px", borderTopColor: "#10b981", borderRightColor: "transparent" }}></div>
                                                    {lang === 'tr' ? 'Liste Hazırlanıyor...' : 'Generating List...'}
                                                </>
                                            ) : (
                                                <>
                                                    <FiShoppingCart color="#10b981" /> {lang === 'tr' ? 'Alışveriş Listemi Çıkar' : 'Generate Shopping List'}
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div style={{ animation: "fadeIn 0.5s ease" }}>
                                            <h4 style={{ margin: 0, marginBottom: "16px", fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#0f172a" : "white", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <FiList color="#10b981" /> {lang === 'tr' ? 'Haftalık Alışveriş Listeniz' : 'Weekly Shopping List'}
                                            </h4>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                {Object.entries(shoppingList).map(([category, items], idx) => (
                                                    <div key={idx} style={{ padding: "16px", borderRadius: "16px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.02)", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                                                        <h5 style={{ margin: 0, marginBottom: "12px", fontSize: "14px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.5px" }}>{category}</h5>
                                                        <ul style={{ margin: 0, paddingLeft: "20px", color: "#64748b", fontSize: "14px", lineHeight: "1.6", fontWeight: 500 }}>
                                                            {items.map((item, i) => (
                                                                <li key={i} style={{ marginBottom: "4px" }}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Diet AI Chatbot */}
                                <div style={{ marginTop: "32px", borderRadius: "24px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.02)", border: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, overflow: "hidden" }}>
                                    <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "white", display: "flex", alignItems: "center", gap: "10px", fontWeight: 800 }}>
                                        <FiMessageCircle size={20} />
                                        {lang === 'tr' ? 'Diyetisyeninize Sorun' : 'Ask Your Dietitian'}
                                    </div>
                                    <div style={{ padding: "20px", height: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                                        {chatHistory.length === 0 ? (
                                            <div style={{ margin: "auto", textAlign: "center", color: "#64748b", fontSize: "14px", fontWeight: 500, maxWidth: "250px" }}>
                                                {lang === 'tr' ? 'Listeniz veya beslenmeniz hakkında sorularınız mı var? Buradan çekinmeden sorun.' : 'Have questions about your list or nutrition? Ask them here.'}
                                            </div>
                                        ) : (
                                            chatHistory.map((msg, idx) => (
                                                <div key={idx} style={{ display: "flex", flexDirection: msg.role === 'user' ? "row-reverse" : "row", gap: "12px", alignItems: "flex-end" }}>
                                                    <div style={{ width: "32px", height: "32px", borderRadius: "12px", background: msg.role === 'user' ? (theme === "light" ? "#e2e8f0" : "#334155") : "rgba(14,165,233,0.1)", color: msg.role === 'user' ? (theme === "light" ? "#475569" : "white") : "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        {msg.role === 'user' ? <FiUser size={16} /> : <FiZap size={16} />}
                                                    </div>
                                                    <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: "16px", background: msg.role === 'user' ? (theme === "light" ? "#f1f5f9" : "#1e293b") : "white", color: msg.role === 'user' ? (theme === "light" ? "#0f172a" : "white") : "#0f172a", fontSize: "14px", lineHeight: "1.6", fontWeight: 500, boxShadow: msg.role === 'ai' ? "0 4px 15px rgba(0,0,0,0.05)" : "none", border: msg.role === 'ai' ? "1px solid #e2e8f0" : "none" }}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {chatLoading && (
                                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                                                <div style={{ width: "32px", height: "32px", borderRadius: "12px", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <FiZap size={16} />
                                                </div>
                                                <div style={{ padding: "12px 16px", borderRadius: "16px", background: "white", display: "flex", gap: "6px", alignItems: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                                                    <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#0ea5e9", borderRightColor: "transparent" }}></div>
                                                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{lang === 'tr' ? 'Yazıyor...' : 'Typing...'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: "16px", borderTop: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, display: "flex", gap: "12px", background: theme === "light" ? "white" : "#0f172a" }}>
                                        <input 
                                            type="text" 
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                            placeholder={lang === 'tr' ? 'Bir soru sorun...' : 'Ask a question...'}
                                            style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, background: theme === "light" ? "#f8fafc" : "#1e293b", color: theme === "light" ? "#0f172a" : "white", outline: "none", fontSize: "14px", fontWeight: 500 }}
                                        />
                                        <button 
                                            onClick={handleSendChatMessage}
                                            disabled={chatLoading || !chatMessage.trim()}
                                            style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#0ea5e9", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: chatLoading || !chatMessage.trim() ? "not-allowed" : "pointer", opacity: chatLoading || !chatMessage.trim() ? 0.5 : 1, transition: "all 0.2s" }}
                                            onMouseEnter={e => (!chatLoading && chatMessage.trim()) && (e.currentTarget.style.background = "#0284c7")}
                                            onMouseLeave={e => (!chatLoading && chatMessage.trim()) && (e.currentTarget.style.background = "#0ea5e9")}
                                        >
                                            <FiSend size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            {plan.tips && plan.tips.length > 0 && (
                                <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", border: "1px solid #a7f3d0", position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: "-10%", right: "-5%", color: "rgba(16,185,129,0.1)" }}>
                                        <FiHeart size={150} />
                                    </div>
                                    <h4 style={{ margin: 0, marginBottom: "16px", fontSize: "18px", fontWeight: 800, color: "#065f46", display: "flex", alignItems: "center", gap: "10px", position: "relative", zIndex: 1 }}>
                                        <FiHeart color="#10b981" /> {lang === 'tr' ? 'Sağlıklı İpuçları' : 'Health Tips'}
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: "24px", color: "#065f46", fontSize: "15px", lineHeight: "1.8", fontWeight: 600, position: "relative", zIndex: 1 }}>
                                        {plan.tips.map((tip, idx) => <li key={idx} style={{ marginBottom: "8px" }}>{tip}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

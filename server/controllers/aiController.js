import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("AI Controller Initialization - Attempting to load .env from:", path.join(__dirname, "../.env"));

if (process.env.GEMINI_API_KEY) {
    console.log("✅ GEMINI_API_KEY loaded successfully.");
    console.log("   Length:", process.env.GEMINI_API_KEY.length);
    console.log("   Prefix:", process.env.GEMINI_API_KEY.substring(0, 7) + "...");
} else {
    console.error("❌ GEMINI_API_KEY NOT FOUND in process.env!");
}

const apiKey = (process.env.GEMINI_API_KEY || "PLACEHOLDER_KEY").trim();
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const aiController = {
    chat: async (req, res) => {
        try {
            const { message, history, patientInfo } = req.body;

            if (!message) {
                return res.status(400).json({ error: "Mesaj alanı boş olamaz." });
            }

            const prompt = `
                Sen bir sağlık asistanısın. Adın MediTrack AI. 
                Aşağıdaki hasta bilgilerine sahip bir kullanıcıyla konuşuyorsun:
                Yaş: ${patientInfo?.age || "Bilinmiyor"}
                Boy: ${patientInfo?.height || "Bilinmiyor"}
                Kilo: ${patientInfo?.weight || "Bilinmiyor"}
                Kronik Hastalıklar: ${patientInfo?.chronicDiseases || "Yok"}
                Alerjiler: ${patientInfo?.allergies || "Yok"}

                Kullanıcının sorusu: "${message}"

                Kurallar:
                1. Tıbbi tavsiye verirken mutlaka bir doktora danışılması gerektiğini hatırlat.
                2. Yanıtların kısa, öz ve yardımsever olsun.
                3. Eğer bir branş önerisi gerekirse, belirtilen belirtilere göre doğru tıbbi bölümü öner.
                4. Türkçe cevap ver.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            res.json({ reply: text });
        } catch (err) {
            console.error("AI Chat Error:", err);
            res.status(500).json({ error: "Yapay zeka yanıt veremedi.", details: err.message });
        }
    },

    explainLabResults: async (req, res) => {
        try {
            const { results, patientInfo } = req.body;

            if (!results || !Array.isArray(results)) {
                return res.status(400).json({ error: "Geçerli laboratuvar sonuçları bulunamadı." });
            }

            const resultsText = results.map(r => `${r.parameter}: ${r.value} ${r.unit} (Normal: ${r.referenceRange})`).join("\n");

            const prompt = `
                Bir hastanın laboratuvar sonuçlarını sade ve anlaşılır bir dille açıkla.
                Hasta Bilgileri:
                Yaş: ${patientInfo?.age || "Bilinmiyor"}
                Kronik Hastalıklar: ${patientInfo?.chronicDiseases || "Yok"}

                Sonuçlar:
                ${resultsText}

                Lütfen bu sonuçları tıbbi terimlerden kaçınarak bir hastanın anlayabileceği şekilde yorumla. 
                Hangi değerlerin düşük veya yüksek olduğunu ve ne anlama gelebileceğini belirt.
                Sonunda mutlaka "Bu yorumlar genel bilgilendirme amaçlıdır, kesin tanı için doktorunuzla görüşünüz" uyarısını ekle.
                Türkçe cevap ver.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            res.json({ explanation: text });
        } catch (err) {
            console.error("AI Results Explanation Error:", err);
            res.status(500).json({ error: "Sonuçlar açıklanamadı.", details: err.message });
        }
    },

    healthSummary: async (req, res) => {
        try {
            const { patientInfo, labs, meds } = req.body;

            const labsText = labs?.map(l => `${l.testName} (${new Date(l.date).toLocaleDateString()}): ${l.status}`).join(", ") || "Yok";
            const medsText = meds?.map(m => m.medications.map(med => med.name).join(", ")).join(", ") || "Yok";

            const prompt = `
                Bir hastanın sağlık durumunun kısa ve anlamlı bir özetini çıkar.
                Hasta Bilgileri: Yaş ${patientInfo?.age}, Boy ${patientInfo?.height}, Kilo ${patientInfo?.weight}, Kronik: ${patientInfo?.chronicDiseases}
                Son Laboratuvarlar: ${labsText}
                Aktif Reçeteler/İlaçlar: ${medsText}

                Lütfen şu formatta kısa bir özet ver (Maksimum 3-4 cümle):
                - Genel durum değerlendirmesi.
                - Varsa dikkat çeken riskler veya olumlu gelişmeler.
                - Küçük bir tavsiye.

                Türkçe cevap ver.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            res.json({ summary: response.text() });
        } catch (err) {
            console.error("AI Health Summary Error:", err);
            res.status(500).json({ error: "Sağlık özeti oluşturulamadı." });
        }
    },

    triage: async (req, res) => {
        try {
            const { symptoms, patientInfo } = req.body;

            const prompt = `
                Sen bir sağlık asistanısın. Bir hastanın şikayetlerine göre hangi tıbbi birime (branş) gitmesi gerektiğini, aciliyet durumunu ve acil bir durum olup olmadığını belirle.
                
                Hasta Bilgileri:
                Yaş: ${patientInfo?.age || "Bilinmiyor"}
                Şikayet: "${symptoms}"

                Kurallar:
                1. Eğer şikayet hayati tehlike arz ediyorsa (göğüs ağrısı, nefes darlığı, ağır kanama vb.) 'isEmergency' değerini true yap.
                2. Yanıtını tam olarak şu JSON formatında ver, başka metin ekleme:
                {
                    "suggestedSpecialty": "Bölüm Adı",
                    "urgency": "Düşük/Orta/Yüksek",
                    "reason": "Kısa açıklama",
                    "isEmergency": true/false,
                    "warning": "Eğer acilse 'Acil servise gitmelisiniz' uyarısını buraya yaz, değilse boş bırak."
                }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            res.json(aiController._parseAIResponse(text));
        } catch (err) {
            console.error("AI Triage Error:", err);
            res.json({
                suggestedSpecialty: "Dahiliye",
                urgency: "Orta",
                reason: "AI analizi sırasında bir hata oluştu, genel muayene önerilir.",
                isEmergency: false,
                warning: ""
            });
        }
    },

    analyzeVitals: async (req, res) => {
        try {
            const { vitals, patientInfo } = req.body;
            console.log("AnalyzeVitals Request - Vitals Count:", vitals?.length);
            console.log("AnalyzeVitals Request - PatientInfo:", patientInfo);

            if (!vitals || !Array.isArray(vitals) || vitals.length === 0) {
                return res.status(400).json({ error: "Analiz için sağlık verisi bulunamadı." });
            }

            const vitalsText = vitals.map(v => `${new Date(v.date).toLocaleDateString()}: ${v.type} = ${v.value} ${v.unit}`).join("\n");

            const prompt = `
                Aşağıdaki hastanın geçmiş sağlık verilerini analiz et. 
                Artış/düşüş trendlerini belirle ve herhangi bir sağlık riski varsa uyar.
                
                Hasta Bilgileri:
                Yaş: ${patientInfo?.age || "Bilinmiyor"}
                Kronik Hastalıklar: ${patientInfo?.chronicDiseases || "Yok"}

                Sağlık Verileri:
                ${vitalsText}

                Yanıtını tam olarak şu JSON formatında ver:
                {
                    "analysis": "Genel trend analizi ve özet (1-2 cümle)",
                    "risks": ["Risk 1", "Risk 2"], // Risk yoksa boş liste
                    "recommendations": ["Tavsiye 1", "Tavsiye 2"],
                    "status": "Normal/Dikkat/Riskli"
                }
                Türkçe cevap ver.
            `;

            console.log("Calling Gemini API for Vitals Analysis...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log("Gemini Raw Response:", text);

            const parsed = aiController._parseAIResponse(text);
            console.log("Parsed AI Response:", parsed);
            res.json(parsed);
        } catch (err) {
            console.error("AI Vital Analysis Error Full:", err);
            res.status(500).json({ error: "Veri analizi yapılamadı.", details: err.message });
        }
    },

    generateDietPlan: async (req, res) => {
        try {
            const { patientInfo, target, activityLevel, dietaryPreferences } = req.body;

            const prompt = `
                Sen uzman bir diyetisyen ve beslenme uzmanısın. Hastanın kişisel verilerine ve hedeflerine göre günlük bir diyet planı oluştur.
                
                Hasta Bilgileri:
                Yaş: ${patientInfo?.age || "Bilinmiyor"}
                Boy: ${patientInfo?.height || "Bilinmiyor"} cm
                Kilo: ${patientInfo?.weight || "Bilinmiyor"} kg
                Hedef: ${target || "Sağlıklı beslenme"}
                Aktivite Seviyesi: ${activityLevel || "Orta"}
                Tercih/Alerjiler: ${dietaryPreferences || "Yok"}
                Kronik Hastalıklar: ${patientInfo?.chronicDiseases || "Yok"}

                Lütfen şu JSON formatında bir günlük diyet planı oluştur. Yalnızca geçerli bir JSON döndür, markdown formatı ekleme.
                {
                    "targetCalories": 2000,
                    "macros": {
                        "protein": 120,
                        "carbs": 200,
                        "fat": 65
                    },
                    "waterRecommendation": "Günlük 2.5 Litre",
                    "meals": [
                        { "type": "Kahvaltı", "time": "08:00", "foods": ["2 haşlanmış yumurta", "1 dilim tam buğday ekmeği", "Yeşillik"], "calories": 350 },
                        { "type": "Ara Öğün", "time": "11:00", "foods": ["1 porsiyon meyve", "10 çiğ badem"], "calories": 150 },
                        { "type": "Öğle", "time": "13:30", "foods": ["Izgara tavuk salata", "1 bardak ayran"], "calories": 450 },
                        { "type": "Ara Öğün", "time": "16:00", "foods": ["1 kase yoğurt", "Yulaf ezmesi"], "calories": 200 },
                        { "type": "Akşam", "time": "19:00", "foods": ["Izgara somon", "Buharda brokoli", "Kinoa"], "calories": 500 }
                    ],
                    "tips": ["Şeker tüketimini azaltın", "Yemekleri yavaş yiyin"]
                }
            `;

            console.log("Calling Gemini API for Diet Plan...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log("Gemini Diet Plan Response:", text);

            const parsed = aiController._parseAIResponse(text);
            res.json(parsed);
        } catch (err) {
            console.error("AI Diet Plan Error Full:", err);
            res.status(500).json({ error: "Diyet planı oluşturulamadı.", details: err.message });
        }
    },

    swapMeal: async (req, res) => {
        try {
            const { patientInfo, currentMeal, dietaryPreferences, targetCalories } = req.body;

            const prompt = `
                Sen uzman bir diyetisyen ve beslenme uzmanısın. Hasta mevcut menüsündeki bir öğünü sevmedi ve alternatif istiyor.
                
                Hasta Bilgileri:
                Alerjiler / Tercihler: ${dietaryPreferences || "Yok"}
                Kronik Hastalıklar: ${patientInfo?.chronicDiseases || "Yok"}

                Değiştirilecek Öğün Türü: ${currentMeal.type}
                Şu anki Yemekler: ${currentMeal.foods.join(", ")}
                Hedef Kalori (bu öğün için): ~${currentMeal.calories} kcal
                (Toplam menü hedef kalorisi: ${targetCalories} kcal)

                Lütfen TAMAMEN YENİ, farklı malzemeler içeren ama yaklaşık olarak AYNı kaloriye (${currentMeal.calories} kcal) sahip alternatif bir ${currentMeal.type} öğünü oluştur.
                Hastanın alerji ve tercihlerine DİKKAT et.

                Yanıtını SADECE şu JSON formatında döndür, markdown veya başka metin ekleme:
                {
                    "type": "${currentMeal.type}",
                    "time": "${currentMeal.time}",
                    "foods": ["Yeni Yemek 1", "Yeni Yemek 2"],
                    "calories": ${currentMeal.calories}
                }
            `;

            console.log("Calling Gemini API for Meal Swap...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log("Gemini Swap Meal Response:", text);

            const parsed = aiController._parseAIResponse(text);
            res.json(parsed);
        } catch (err) {
            console.error("AI Meal Swap Error:", err);
            res.status(500).json({ error: "Öğün değiştirilemedi.", details: err.message });
        }
    },

    generateShoppingList: async (req, res) => {
        try {
            const { meals } = req.body;

            const prompt = `
                Sen uzman bir diyetisyen asistanısın. Aşağıda kullanıcının günlük diyet planındaki öğünler ve içindeki yiyecekler listelenmiştir:
                ${JSON.stringify(meals)}

                Bu yiyecekleri analiz et ve kullanıcı için bir market alışveriş listesi çıkar. 
                Aynı türden malzemeleri (örneğin 2 öğünde yumurta varsa) toplayarak yaz.
                Kategorileri tam olarak şu isimlerle oluştur: "Sebze ve Meyve", "Et ve Protein", "Süt Ürünleri", "Kuru Gıda ve Bakliyat", "Diğer"

                Yanıtını SADECE şu JSON formatında döndür:
                {
                    "Sebze ve Meyve": ["2 Adet Domates", "1 Demet Yeşillik"],
                    "Et ve Protein": ["200g Tavuk Göğsü", "4 Adet Yumurta"],
                    "Süt Ürünleri": ["500ml Süt", "Dil Peyniri"],
                    "Kuru Gıda ve Bakliyat": ["Yulaf Ezmesi", "Ceviz"],
                    "Diğer": ["Zeytinyağı"]
                }
            `;

            console.log("Calling Gemini API for Shopping List...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log("Gemini Shopping List Response:", text);

            const parsed = aiController._parseAIResponse(text);
            res.json(parsed);
        } catch (err) {
            console.error("AI Shopping List Error:", err);
            res.status(500).json({ error: "Alışveriş listesi oluşturulamadı.", details: err.message });
        }
    },

    dietChat: async (req, res) => {
        try {
            const { message, history, currentPlan, patientInfo } = req.body;
            
            let historyText = "";
            if (history && history.length > 0) {
                historyText = history.map(h => `${h.role === 'user' ? 'Hasta' : 'Diyetisyen'}: ${h.text}`).join('\n');
            }

            const prompt = `
                Sen uzman bir diyetisyen ve beslenme danışmanısın. Hasta mevcut diyet programı hakkında sana sorular soruyor. 
                Amacın, hastayı motive etmek, sorularına bilimsel ve anlaşılır yanıtlar vermek ve alternatifler sunmaktır. 
                SADECE sağlıklı beslenme, mevcut diyet planı ve hastanın kişisel sağlığı hakkında konuş. Başka konulara girme.

                Hastanın Bilgileri:
                ${patientInfo ? `Yaş: ${patientInfo.age || 'Bilinmiyor'}, Boy: ${patientInfo.height || 'Bilinmiyor'} cm, Kilo: ${patientInfo.weight || 'Bilinmiyor'} kg` : ''}
                
                Hastanın Mevcut Diyet Planı (BAĞLAM / CONTEXT):
                ${currentPlan ? JSON.stringify(currentPlan) : 'Şu an aktif bir diyet planı oluşturulmamış.'}

                Geçmiş Sohbet:
                ${historyText}

                Hasta: ${message}
                Diyetisyen:
            `;

            console.log("Calling Gemini API for Diet Chat...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            res.json({ reply: text.trim() });
        } catch (err) {
            console.error("AI Diet Chat Error:", err);
            res.status(500).json({ error: "Yapay zeka asistanı şu anda yanıt veremiyor.", details: err.message });
        }
    },

    doctorChat: async (req, res) => {
        try {
            const { message, doctorInfo, history } = req.body;

            if (!message) {
                return res.status(400).json({ error: "Mesaj alanı boş olamaz." });
            }

            const historyText = (history || [])
                .map(h => `${h.role === "user" ? "Doktor" : "Asistan"}: ${h.text}`)
                .join("\n");

            const prompt = `
                Sen MediAI adlı bir tıbbi karar destek asistanısın.
                Hekim bilgileri:
                Ad: ${doctorInfo?.name || "Doktor"}
                Uzmanlık: ${doctorInfo?.specialty || "Belirtilmemiş"}

                ${historyText ? `Önceki konuşma:\n${historyText}\n` : ""}
                Doktorun sorusu: "${message}"

                Kurallar:
                1. Klinik bilgi, ayırıcı tanı, ilaç etkileşimi ve tedavi protokolleri hakkında destekleyici bilgi ver.
                2. Yanıtları **kalın** başlıklar ve maddeler halinde düzenle.
                3. Her zaman "Klinik karar nihai olarak hekime aittir" uyarısını ekle.
                4. Türkçe cevap ver.
                5. Yanıtını kısa ve öz tut (maksimum 4-5 cümle veya madde).
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            res.json({ reply: response.text() });
        } catch (err) {
            console.error("Doctor AI Chat Error:", err);
            res.status(500).json({ error: "Yapay zeka yanıt veremedi.", details: err.message });
        }
    },

    // Helper to clean and parse AI JSON responses
    _parseAIResponse: (text) => {
        try {
            // Remove markdown code blocks if present
            let cleaned = text.trim();
            if (cleaned.includes("```json")) {
                cleaned = cleaned.split("```json")[1].split("```")[0].trim();
            } else if (cleaned.includes("```")) {
                cleaned = cleaned.split("```")[1].split("```")[0].trim();
            }
            return JSON.parse(cleaned);
        } catch (err) {
            console.error("Failed to parse AI response:", text);
            throw new Error("Geçersiz AI yanıt formatı");
        }
    }
};

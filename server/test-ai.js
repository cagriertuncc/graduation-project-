import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY || "PLACEHOLDER_KEY";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
    const prompt = `
        Sen uzman bir diyetisyen ve beslenme uzmanısın. Hastanın kişisel verilerine ve hedeflerine göre günlük bir diyet planı oluştur.
        
        Hasta Bilgileri:
        Yaş: 30
        Boy: 180 cm
        Kilo: 80 kg
        Hedef: Kilo Vermek
        Aktivite Seviyesi: Orta
        Tercih/Alerjiler: Yok
        Kronik Hastalıklar: Yok

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
                { "type": "Kahvaltı", "time": "08:00", "foods": ["2 haşlanmış yumurta", "1 dilim tam buğday ekmeği", "Yeşillik"], "calories": 350 }
            ],
            "tips": ["Şeker tüketimini azaltın", "Yemekleri yavaş yiyin"]
        }
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("RESPONSE:", response.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();

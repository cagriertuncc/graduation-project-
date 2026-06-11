import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../server/.env") });

async function testKey() {
    const key = (process.env.GEMINI_API_KEY || "").trim();
    console.log("Testing Key:", key.substring(0, 7) + "...");
    console.log("Length:", key.length);

    if (!key) {
        console.error("No API key found in server/.env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Merhaba, bu bir test mesajıdır. Lütfen 'OK' yaz.");
        const response = await result.response;
        console.log("✅ Success! Response:", response.text());
    } catch (err) {
        console.error("❌ API Error Detail:");
        console.error(err);
        if (err.status) console.error("Status:", err.status);
    }
}

testKey();

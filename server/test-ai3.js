import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY || "PLACEHOLDER_KEY";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function test() {
    const prompt = "Hello";
    try {
        const result = await model.generateContent(prompt);
        console.log("RESPONSE:", await result.response.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY || "PLACEHOLDER_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        const fetch = globalThis.fetch;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        console.log(data.models?.map(m => m.name).join("\n"));
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();

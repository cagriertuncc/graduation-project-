import mongoose from "mongoose";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    await connectDB();
    const db = mongoose.connection.db;
    try {
        await db.collection("doctors").dropIndex("email_1");
        console.log("✅ 'email_1' index dropped on doctors collection");
    } catch (e) {
        console.log("Index might not exist or another error:", e.message);
    }
    try {
        await db.collection("patients").dropIndex("email_1");
        console.log("✅ 'email_1' index dropped on patients collection");
    } catch (e) {
        console.log("Index might not exist or another error:", e.message);
    }
    process.exit(0);
}
run();

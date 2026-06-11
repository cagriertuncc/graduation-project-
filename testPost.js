import mongoose from "mongoose";
import dotenv from "dotenv";
import JobPosting from "./server/models/JobPosting.js";
import User from "./server/models/User.js";

dotenv.config({ path: "./server/.env" });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const hrUser = await User.findOne({ role: "hr" }) || await User.findOne({ role: "admin" });
    if (!hrUser) {
        console.log("No HR user found");
        process.exit(1);
    }

    try {
        const posting = await JobPosting.create({
            title: "Test Posting",
            department: "Test Dep",
            type: "Tam Zamanlı",
            location: "Merkez Şube",
            description: "İlan açıklaması",
            createdBy: hrUser._id
        });
        console.log("Success");
    } catch (err) {
        console.log("Error:", err.message);
    }
    process.exit(0);
}
run();

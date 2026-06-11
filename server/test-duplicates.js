import mongoose from "mongoose";
import Doctor from "./models/Doctor.js";

async function run() {
    await mongoose.connect("mongodb://127.0.0.1:27017/meditrack");
    const docs = await Doctor.find({});
    
    const nameCounts = {};
    docs.forEach(d => Object.assign(nameCounts, {[d.name]: (nameCounts[d.name] || 0) + 1}));
    
    console.log("Duplicate names:");
    Object.entries(nameCounts).filter(([n, c]) => c > 1).forEach(([n, c]) => console.log(`${n}: ${c}`));
    process.exit(0);
}
run();

import mongoose from "mongoose";
import Doctor from "./models/Doctor.js";

async function run() {
    await mongoose.connect("mongodb://127.0.0.1:27017/meditrack");
    const result = await Doctor.updateMany({}, { $set: { isActive: true } });
    console.log("Updated docs:", result.modifiedCount);
    process.exit(0);
}
run();

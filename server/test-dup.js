import mongoose from "mongoose";
import Doctor from "./models/Doctor.js";

async function run() {
    await mongoose.connect("mongodb://127.0.0.1:27017/meditrack");
    const docs = await Doctor.find({});
    console.log("Found:", docs.length);
    docs.filter(d => !d.name.toLowerCase().includes("admin")).slice(0, 15).forEach(d => console.log(d.name, d._id.toString()));
    process.exit(0);
}
run();

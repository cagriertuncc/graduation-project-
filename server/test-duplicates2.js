import mongoose from "mongoose";
import Doctor from "./models/Doctor.js";

async function run() {
    await mongoose.connect("mongodb://127.0.0.1:27017/meditrack");
    const docs = await Doctor.find({});
    console.log("Total doctors:", docs.length);
    docs.filter(d => !d.name.toLowerCase().includes("admin")).slice(0,10).forEach(d => console.log(d.name, "-", String(d._id)));
    process.exit(0);
}
run();

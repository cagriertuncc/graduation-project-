import mongoose from "mongoose";

async function run() {
    await mongoose.connect("mongodb://127.0.0.1:27017/meditrack");
    const docs = await mongoose.connection.collection("doctors").find({}).toArray();
    console.log("Docs with 'admin' in name:", docs.filter(d => d.name && d.name.toLowerCase().includes("admin")).map(d => ({name: d.name, role: d.role})));
    console.log("A typical doctor:", docs.find(d => !d.name.toLowerCase().includes("admin")));
    process.exit(0);
}
run();

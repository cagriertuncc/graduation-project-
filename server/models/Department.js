import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "inactive", "maintenance"], default: "active" },
    doctorCount: { type: Number, default: 0 },
    patientCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Department", DepartmentSchema);

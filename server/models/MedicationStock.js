import mongoose from "mongoose";

const medicationStockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "İlaç adı zorunludur"],
        unique: true,
        trim: true,
    },
    stock: {
        type: Number,
        required: [true, "Stok miktarı zorunludur"],
        min: [0, "Stok 0'dan küçük olamaz"],
        default: 0,
    },
    criticalLimit: {
        type: Number,
        required: [true, "Kritik limit zorunludur"],
        min: [0, "Kritik limit 0'dan küçük olamaz"],
        default: 10,
    },
    unit: {
        type: String,
        default: "Kutu",
        trim: true,
    },
    expiryDate: {
        type: Date,
    }
}, { timestamps: true });

export default mongoose.model("MedicationStock", medicationStockSchema);

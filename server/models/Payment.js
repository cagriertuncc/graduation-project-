import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "TRY",
    },
    status: {
        type: String,
        enum: ["success", "failed", "pending"],
        default: "success",
    },
    paymentMethod: {
        type: String,
        default: "Credit Card",
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);

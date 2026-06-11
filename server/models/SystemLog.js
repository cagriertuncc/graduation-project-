import mongoose from "mongoose";

const SystemLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true,
        default: "Sistem Yöneticisi"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    details: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ["success", "warning", "info", "error"],
        default: "info"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("SystemLog", SystemLogSchema);

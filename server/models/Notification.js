import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "receiverModel"
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ["User", "Patient"]
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["message", "labResult", "appointment", "file"],
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String, // URL relative to dashboard for navigation
    },
    date: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

notificationSchema.index({ receiverId: 1, isRead: 1, date: -1 });

export default mongoose.model("Notification", notificationSchema);

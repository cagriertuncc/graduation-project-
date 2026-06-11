import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "senderModel",
        required: true,
    },
    senderModel: {
        type: String,
        required: true,
        enum: ["User", "Patient"]
    },
    senderRole: {
        type: String,
        enum: ["doctor", "admin", "patient"],
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "receiverModel",
        required: true,
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ["User", "Patient"]
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

messageSchema.index({ receiverId: 1, date: -1 });

export default mongoose.model("Message", messageSchema);

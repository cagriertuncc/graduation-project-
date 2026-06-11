import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
        mood: {
            type: String,
            default: "😊",
        },
        tags: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

export default mongoose.model("JournalEntry", journalEntrySchema);

import mongoose from "mongoose";

const radiologySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    imagingType: {
        type: String,
        enum: ["Röntgen", "MR", "BT", "Ultrason", "Diğer"],
        required: [true, "Görüntüleme türü zorunludur"],
    },
    bodyPart: {
        type: String,
        required: [true, "İncelenen bölge zorunludur"],
        trim: true, // "Göğüs", "Beyin", "Karın" vb.
    },
    status: {
        type: String,
        enum: ["beklemede", "tamamlandı", "anormal"],
        default: "beklemede",
    },
    findings: {
        type: String,
        trim: true, // Bulgular
    },
    impression: {
        type: String,
        trim: true, // İzlenim / Yorum
    },
    notes: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

radiologySchema.index({ doctorId: 1, date: -1 });
radiologySchema.index({ patientId: 1 });

export default mongoose.model("Radiology", radiologySchema);

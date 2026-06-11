import mongoose from "mongoose";

const ITRequestSchema = new mongoose.Schema({
    requestId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        enum: ["Yazılım", "Donanım", "Yetkilendirme", "Ağ/İnternet", "Diğer"], 
        default: "Yazılım" 
    },
    priority: { 
        type: String, 
        enum: ["Düşük", "Orta", "Yüksek", "Kritik"], 
        default: "Orta" 
    },
    status: { 
        type: String, 
        enum: ["Açık", "İnceleniyor", "Çözüldü"], 
        default: "Açık" 
    },
    assignee: { 
        type: String, 
        default: "Atanmamış" 
    },
    createdBy: { 
        type: String, 
        required: true 
    },
    createdById: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

export default mongoose.model("ITRequest", ITRequestSchema);

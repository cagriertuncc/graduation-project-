import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    type: {
        type: String,
        enum: ["water", "steps", "sleep", "weight", "calories", "custom"],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    target: {
        type: Number,
        required: true,
        min: [0, "Hedef 0'dan küçük olamaz"],
    },
    current: {
        type: Number,
        default: 0,
        min: [0, "Mevcut değer 0'dan küçük olamaz"],
    },
    unit: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// Pre-save middleware to automatically mark completion status
goalSchema.pre("save", function(next) {
    this.isCompleted = this.current >= this.target;
    next();
});

// Pre-update middleware to automatically mark completion status
goalSchema.pre("findOneAndUpdate", function(next) {
    const update = this.getUpdate();
    if (update.current !== undefined || update.target !== undefined) {
        // If updating current/target directly in the update doc
        const current = update.current !== undefined ? update.current : this._update?.current;
        const target = update.target !== undefined ? update.target : this._update?.target;
        if (current !== undefined && target !== undefined) {
            update.isCompleted = current >= target;
        }
    }
    next();
});

// Index by patient and date
goalSchema.index({ patientId: 1, date: -1 });

export default mongoose.model("Goal", goalSchema);

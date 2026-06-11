import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email zorunludur"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Şifre zorunludur"],
        minlength: 6,
        select: false, // default olarak sorguya dahil etme
    },
    role: {
        type: String,
        enum: ["admin", "doctor", "patient", "staff", "accountant", "hr", "technician", "pharmacist", "receptionist", "director"],
        required: true,
    },
    profileModel: {
        type: String,
        enum: ["Doctor", "Patient"],
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "profileModel",
    }
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);

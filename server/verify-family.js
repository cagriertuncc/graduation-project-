import mongoose from "mongoose";
import Patient from "./models/Patient.js";
import Appointment from "./models/Appointment.js";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const verifyFamilyFeature = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const mainPatientTC = "12345678901";
        const mainPatient = await Patient.findOne({ tc: mainPatientTC });

        if (!mainPatient) {
            console.error("Main patient not found. Run debug-login.js first.");
            process.exit(1);
        }

        console.log(`Found main patient: ${mainPatient.name} (${mainPatient._id})`);

        // 1. Add Family Member
        const childTC = "99988877766";
        await Patient.deleteOne({ tc: childTC }); // Clean up

        const child = await Patient.create({
            tc: childTC,
            name: "Küçük Test Can",
            age: 8,
            gender: "Erkek",
            parentId: mainPatient._id,
            role: "patient"
        });

        console.log(`Added family member: ${child.name} (${child._id}) linked to ${mainPatient.name}`);

        // 2. Verify link
        const familyMembers = await Patient.find({ parentId: mainPatient._id });
        console.log(`Verified: Main patient has ${familyMembers.length} family member(s).`);

        // 3. Test Booking for Family Member
        const doctor = await User.findOne({ role: "doctor" });
        if (!doctor) {
            console.error("No doctor found for booking test.");
        } else {
            const appointment = await Appointment.create({
                patientId: child._id,
                doctorId: doctor._id,
                date: "2026-03-01",
                time: "10:00",
                type: "Kontrol",
                status: "bekliyor"
            });
            console.log(`Successfully booked appointment for child: ${appointment._id}`);

            // Cleanup test appointment
            // await Appointment.deleteOne({ _id: appointment._id });
        }

        console.log("Verification script completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
};

verifyFamilyFeature();

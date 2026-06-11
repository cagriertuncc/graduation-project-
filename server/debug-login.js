import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './models/Patient.js';
import bcrypt from 'bcrypt';

dotenv.config();

const updateTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/meditrack');
        console.log('Connected to MongoDB');

        const tc = "12345678901";
        const password = "password123";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await Patient.findOneAndUpdate(
            { tc },
            { password: hashedPassword },
            { new: true }
        );

        if (result) {
            console.log(`Successfully updated password for ${result.name} (TC: ${tc})`);
            console.log(`Email: ${result.email}`);
            console.log(`New Password: ${password}`);
        } else {
            console.log(`User with TC ${tc} not found. Creating a new one...`);
            const newPatient = await Patient.create({
                name: "Test Patient",
                tc: tc,
                email: "test@meditrack.com",
                password: hashedPassword,
                age: 30,
                gender: "Erkek",
                role: "patient"
            });
            console.log(`Created new patient: ${newPatient.name}`);
            console.log(`TC: ${tc}, Password: ${password}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

updateTestUser();

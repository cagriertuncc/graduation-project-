import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './models/Patient.js';

dotenv.config();

const checkPatients = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/meditrack');
        console.log('Connected to MongoDB');

        const patients = await Patient.find({});
        console.log(`Found ${patients.length} patients:`);
        patients.forEach(p => {
            console.log(`- Name: ${p.name}, Email: ${p.email}, TC: ${p.tc}`);
        });

        if (patients.length === 0) {
            console.log('No patients found. You might need to register first.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkPatients();

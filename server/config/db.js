import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URI || "mongodb://localhost:27017/meditrack"
        );
        console.log(`✅ MongoDB bağlandı: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB bağlantı hatası: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;

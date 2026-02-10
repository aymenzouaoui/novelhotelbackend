const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novoteldb');
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:");
    console.error(err); // log complet
    process.exit(1);
  }
};

module.exports = connectDB;


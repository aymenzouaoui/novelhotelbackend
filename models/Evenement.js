const mongoose = require("mongoose");

const evenementSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" }, // Cloudinary URL or local path
  price: { type: Number, required: true } // 👈 New field added here
}, { timestamps: true });

module.exports = mongoose.model("Evenement", evenementSchema);

const mongoose = require("mongoose");

const loisirSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" }, // Cloudinary URL
  ouverture: { type: Date, default: null }, // New nullable date field
  fermeture: { type: Date, default: null }  // New nullable date field
}, { timestamps: true });

module.exports = mongoose.model("Loisir", loisirSchema);

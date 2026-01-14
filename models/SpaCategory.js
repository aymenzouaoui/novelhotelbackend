const mongoose = require("mongoose");

// Service schema
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },   // e.g. "SILHOUETTE FINE 90MN"
  description: { type: String, default: "" },           // e.g. "Gommage / Scrub + ..."
  duration: { type: String, default: "" },              // e.g. "90mn" or "1H25"
  prices: {
    TND: { type: Number, required: true },             // local currency
    EUR: { type: Number, required: true }              // second currency
  },
  reservable: { type: Boolean, default: true }          // moved here per service
});

// Spa Category schema
const spaCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },  // e.g. "FORFAITS / PACKAGE"
  services: [serviceSchema],
  image: {
    type: String,
    default: "" // Cloudinary URL or local path
  }
}, { timestamps: true });

module.exports = mongoose.model("SpaCategory", spaCategorySchema);

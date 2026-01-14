const mongoose = require("mongoose");

const spaServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },   // e.g. "SILHOUETTE FINE 90MN"
  description: { type: String, default: "" },           // e.g. "Gommage / Scrub + ..."
  duration: { type: String, default: "" },              // e.g. "90mn" or "1H25"
  prices: {
    TND: { type: Number, required: true },             // local currency
    EUR: { type: Number, required: true }              // second currency
  },
  reservable: { type: Boolean, default: true }          // moved here per service
});

const spaCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },  // e.g. "FORFAITS / PACKAGE"
  services: [spaServiceSchema],
    image: {
    type: String,
    default: "" // Cloudinary URL or local path
  },
});

const spaSchema = new mongoose.Schema(
  {
    categories: [spaCategorySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Spa", spaSchema);

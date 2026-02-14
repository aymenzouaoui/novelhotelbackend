const mongoose = require("mongoose");

// Service schema
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  duration: { type: String, default: "" },
  prices: {
    TND: { type: Number, required: true },
    EUR: { type: Number, required: true },
  },
  reservable: { type: Boolean, default: true },
  translations: {
    fr: { name: { type: String, default: "" }, description: { type: String, default: "" } },
    ar: { name: { type: String, default: "" }, description: { type: String, default: "" } },
  },
});

// Spa Category schema
const spaCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  services: [serviceSchema],
  image: { type: String, default: "" },
  // Traductions fr / ar
  translations: {
    fr: { title: { type: String, default: "", trim: true } },
    ar: { title: { type: String, default: "", trim: true } },
  },
}, { timestamps: true });

module.exports = mongoose.model("SpaCategory", spaCategorySchema);

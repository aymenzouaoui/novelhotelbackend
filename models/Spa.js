const mongoose = require("mongoose");

const spaServiceSchema = new mongoose.Schema({
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

const spaCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  services: [spaServiceSchema],
  image: { type: String, default: "" },
  translations: {
    fr: { title: { type: String, default: "", trim: true } },
    ar: { title: { type: String, default: "", trim: true } },
  },
});

const spaSchema = new mongoose.Schema(
  {
    categories: [spaCategorySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Spa", spaSchema);

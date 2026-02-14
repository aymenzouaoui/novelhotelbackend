const mongoose = require("mongoose");

const loisirSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" }, // Cloudinary URL
  ouverture: { type: Date, default: null },
  fermeture: { type: Date, default: null },
  // Traductions fr / ar
  translations: {
    fr: {
      name: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
    ar: {
      name: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
  },
}, { timestamps: true });

module.exports = mongoose.model("Loisir", loisirSchema);

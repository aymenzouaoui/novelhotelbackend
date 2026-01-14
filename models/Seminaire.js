const mongoose = require("mongoose");

const seminaireSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  capacite: { type: Number, required: true },
  superficie: { type: Number, required: true },
  hauteur: { type: Number, required: true },
  image: { type: String, default: "" }, // Cloudinary URL
  fiche: { type: String, default: "" } // PDF URL
}, { timestamps: true });

module.exports = mongoose.model("Seminaire", seminaireSchema);

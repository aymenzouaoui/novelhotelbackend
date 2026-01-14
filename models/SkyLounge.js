const mongoose = require("mongoose");

const skyLoungeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" }, // lien vers l’image (Cloudinary ou dossier uploads)
  menus: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu"
    }
  ],
  reservable: {
    type: Boolean,
    default: true // true means users can reserve by default
  }
}, { timestamps: true });

module.exports = mongoose.model("SkyLounge", skyLoungeSchema);

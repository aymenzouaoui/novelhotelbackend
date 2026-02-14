const mongoose = require("mongoose");

const categoryBoissonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    default: ""
  },
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

module.exports = mongoose.model("CategoryBoisson", categoryBoissonSchema);

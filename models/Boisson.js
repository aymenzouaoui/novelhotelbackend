const mongoose = require("mongoose");

const boissonSchema = new mongoose.Schema({
  order: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: false
  },
  description: {
    type: String,
    default: ""
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryBoisson",
    required: true
  },
  image: {
    type: String,
    default: "",
  },
  // Traductions fr / ar
  translations: {
    fr: {
      title: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
    ar: {
      title: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
  },
}, { timestamps: true });

module.exports = mongoose.model("Boisson", boissonSchema);

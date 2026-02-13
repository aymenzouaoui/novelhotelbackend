const mongoose = require("mongoose");

const offreSpecialeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  discountPercentage: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: "" // Cloudinary URL or local path (deprecated, use media instead)
  },
  media: {
    type: String,
    default: "" // URL for image or video
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    default: null // "image" or "video" or null if no media
  }
}, { timestamps: true });

module.exports = mongoose.model("OffreSpeciale", offreSpecialeSchema);

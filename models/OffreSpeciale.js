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
  // Legacy single image field (kept for backward compatibility)
  image: {
    type: String,
    default: "" // Cloudinary URL or local path (deprecated, use media/images instead)
  },
  // Generic single media URL (first image or video)
  media: {
    type: String,
    default: "" // URL for image or video (first media)
  },
  // Type of the single media
  mediaType: {
    type: String,
    enum: ["image", "video"],
    default: null // "image" or "video" or null if no media
  },
  // NEW: support multiple images
  images: [{
    type: String, // URLs for all images of the offer
  }],
  // NEW: dedicated video URL
  video: {
    type: String,
    default: "" // URL for video file if any
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

module.exports = mongoose.model("OffreSpeciale", offreSpecialeSchema);

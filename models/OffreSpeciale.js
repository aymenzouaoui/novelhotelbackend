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
    default: "" // Cloudinary URL or local path
  }
}, { timestamps: true });

module.exports = mongoose.model("OffreSpeciale", offreSpecialeSchema);

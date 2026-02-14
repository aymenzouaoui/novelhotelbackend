const mongoose = require("mongoose");

const pageContentSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "", // optional
  },
  // Traductions fr / ar
  translations: {
    fr: {
      pageName: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
    ar: {
      pageName: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
  },
}, { timestamps: true });

module.exports = mongoose.model("PageContent", pageContentSchema);

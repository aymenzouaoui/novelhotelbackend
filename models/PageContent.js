const mongoose = require("mongoose");

const pageContentSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: true,
    unique: true, // each page only has 1 content
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
}, { timestamps: true });

module.exports = mongoose.model("PageContent", pageContentSchema);

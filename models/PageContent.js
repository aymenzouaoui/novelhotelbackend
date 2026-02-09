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
}, { timestamps: true });

module.exports = mongoose.model("PageContent", pageContentSchema);

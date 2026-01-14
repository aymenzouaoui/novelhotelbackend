const mongoose = require("mongoose");

const presentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Presentation", presentationSchema);

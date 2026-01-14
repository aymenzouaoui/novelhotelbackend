const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
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
  reservable: {
    type: Boolean,
    default: true // true means users can reserve by default
  }
}, { timestamps: true });

module.exports = mongoose.model("Restaurant", restaurantSchema);

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  location: String,
  price: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ""
  },
  
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);

const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  from: {
    type: Date,
    required: true
  },
  to: {
    type: Date,
    required: true
  },
  people: {
    type: Number,
    required: true,
    min: 1
  },
  mail: {
    type: String,
    trim: true,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: null
  },
  service: {
    type: String,
    trim: true,
    default: null
  },
    room: {
    type: String,
    trim: true,
    default: null
  },
  status: {
  type: String,
  enum: ["pending", "confirmed", "cancelled"], // optional: restrict values
  default: "pending"
},

  serviceDetails: {
    type: String,
    trim: true,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);

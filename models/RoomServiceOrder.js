const mongoose = require("mongoose");

const roomServiceOrderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    room: { type: String, required: true, trim: true },
    service: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    isValidated: {
      type: Boolean,
      default: false, // starts as false until validated
    },
    serviceDetails: { type: String, required: true, trim: true },
    time: { type: String, trim: true, default: null }, // optional and can be null
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomServiceOrder", roomServiceOrderSchema);

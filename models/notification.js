const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      trim: true,
      default: null,
    },
    service: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

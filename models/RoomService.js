const mongoose = require("mongoose");

const roomServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  // Traductions fr / ar
  translations: {
    fr: {
      name: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
    ar: {
      name: { type: String, default: "", trim: true },
      description: { type: String, default: "" },
    },
  },
  menus: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu"
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("RoomService", roomServiceSchema);

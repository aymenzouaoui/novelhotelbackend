const mongoose = require("mongoose");

const nettoyageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  room: { type: String, required: true, trim: true },
  disponibleDe: { type: Date, required: true },  // Start of availability
  disponibleA: { type: Date, required: true }    // End of availability
}, { timestamps: true });

module.exports = mongoose.model("Nettoyage", nettoyageSchema);

const mongoose = require("mongoose");

const skipCleanSchema = new mongoose.Schema(
  {
    date: { type: Date },   // Date when cleaning is skipped
    room: { type: String }, // Room number or identifier
    name: { type: String }, // Guest's name
    email: { type: String } // Guest's email
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("SkipClean", skipCleanSchema);

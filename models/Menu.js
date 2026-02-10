const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  isVegetarian: {
    type: Boolean,
    default: false,
  },
  isOrganic: {
    type: Boolean,
    default: false,
  },
  isLocal: {
    type: Boolean,
    default: false,
  },
  // 14 allergènes majeurs (réglementation UE) — sans gluten = !allergenGluten, sans lactose = !allergenLait
  allergenArachide: {
    type: Boolean,
    default: false,
  },
  allergenCeleri: {
    type: Boolean,
    default: false,
  },
  allergenCrustaces: {
    type: Boolean,
    default: false,
  },
  allergenGluten: {
    type: Boolean,
    default: false,
  },
  allergenFruitsANoque: {
    type: Boolean,
    default: false,
  },
  allergenLait: {
    type: Boolean,
    default: false,
  },
  allergenLupin: {
    type: Boolean,
    default: false,
  },
  allergenOeuf: {
    type: Boolean,
    default: false,
  },
  allergenPoisson: {
    type: Boolean,
    default: false,
  },
  allergenMollusques: {
    type: Boolean,
    default: false,
  },
  allergenMoutarde: {
    type: Boolean,
    default: false,
  },
  allergenSesame: {
    type: Boolean,
    default: false,
  },
  allergenSoja: {
    type: Boolean,
    default: false,
  },
  allergenSulfites: {
    type: Boolean,
    default: false,
  },
  isAvailable24_7: {
    type: Boolean,
    default: false,
  },
  commandable: {
    type: Boolean,
    default: true,
  },
});


const menuSchema = new mongoose.Schema({
  order: {
    type: Number,
    default: 0,
  },
  title: { type: String, required: true },
  images: {
    type: [String], // array of image paths
    default: [],
  },
  items: [itemSchema],
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: false,
  },
  roomService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoomService",
    required: false,
  },
  skyLounge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SkyLounge",
    required: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("Menu", menuSchema);

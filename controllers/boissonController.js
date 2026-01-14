const Boisson = require("../models/Boisson");

// CREATE
exports.createBoisson = async (req, res) => {
  try {
    const { title, price, quantity, description, category } = req.body;
    const image = req.file ? req.file.path : "";

    const boisson = new Boisson({ title, price, quantity, description, category, image });
    await boisson.save();

    const io = req.app.get("io");
    io.emit("boissonCreated", boisson);

    res.status(201).json(boisson);
  } catch (err) {
    console.error("❌ Error creating boisson:", err.message);
    res.status(500).json({ message: err.message });
  }
};
exports.getAllBoissons = async (req, res) => {
  try {
    const boissons = await Boisson.find().populate("category", "name"); // Populate category name
    res.status(200).json(boissons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBoissonById = async (req, res) => {
  try {
    const boisson = await Boisson.findById(req.params.id).populate("category", "name");
    if (!boisson) return res.status(404).json({ message: "Boisson not found" });
    res.status(200).json(boisson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updateBoisson = async (req, res) => {
  try {
    const { title, price, quantity, description, category } = req.body;
    const updateFields = { title, price, quantity, description, category };

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const boisson = await Boisson.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!boisson) return res.status(404).json({ message: "Boisson not found" });

    const io = req.app.get("io");
    io.emit("boissonUpdated", boisson);

    res.status(200).json(boisson);
  } catch (err) {
    console.error("❌ Error updating boisson:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBoisson = async (req, res) => {
  try {
    const boisson = await Boisson.findByIdAndDelete(req.params.id);
    if (!boisson) return res.status(404).json({ message: "Boisson not found" });

    const io = req.app.get("io");
    io.emit("boissonDeleted", boisson._id);

    res.status(200).json({ message: "Boisson deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Evenement = require("../models/Evenement");

exports.createEvenement = async (req, res) => {
  try {
    const { name, description, price } = req.body; // ✅ include price
    const image = req.file ? req.file.path : "";

    const evenement = new Evenement({ name, description, price, image }); // ✅ add price here
    await evenement.save();

    const io = req.app.get("io");
    io.emit("evenementCreated", evenement);

    res.status(201).json(evenement);
  } catch (err) {
    console.error("❌ Error creating evenement:", err.message);
    res.status(500).json({ message: err.message });
  }
};
exports.getAllEvenements = async (req, res) => {
  try {
    const evenements = await Evenement.find();
    res.status(200).json(evenements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEvenementById = async (req, res) => {
  try {
    const evenement = await Evenement.findById(req.params.id);
    if (!evenement) return res.status(404).json({ message: "Evenement not found" });
    res.status(200).json(evenement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEvenement = async (req, res) => {
  try {
    const { name, description, price } = req.body; // ✅ include price
    const updateFields = { name, description, price }; // ✅ include price

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const evenement = await Evenement.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!evenement) return res.status(404).json({ message: "Evenement not found" });

    const io = req.app.get("io");
    io.emit("evenementUpdated", evenement);

    res.status(200).json(evenement);
  } catch (err) {
    console.error("❌ Error updating evenement:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEvenement = async (req, res) => {
  try {
    const evenement = await Evenement.findByIdAndDelete(req.params.id);
    if (!evenement) return res.status(404).json({ message: "Evenement not found" });

    const io = req.app.get("io");
    io.emit("evenementDeleted", evenement._id);

    res.status(200).json({ message: "Evenement deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

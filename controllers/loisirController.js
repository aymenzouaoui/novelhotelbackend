const Loisir = require("../models/Loisir");

exports.createLoisir = async (req, res) => {
  try {
    const { name, description, ouverture, fermeture } = req.body;
    const image = req.file ? req.file.path : "";

    const loisir = new Loisir({
      name,
      description,
      image,
      ouverture: ouverture ? new Date(ouverture) : null,
      fermeture: fermeture ? new Date(fermeture) : null
    });

    await loisir.save();

    const io = req.app.get("io");
    io.emit("loisirCreated", loisir);

    res.status(201).json(loisir);
  } catch (err) {
    console.error("❌ Error creating loisir:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllLoisirs = async (req, res) => {
  try {
    const loisirs = await Loisir.find();
    res.status(200).json(loisirs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLoisirById = async (req, res) => {
  try {
    const loisir = await Loisir.findById(req.params.id);
    if (!loisir) return res.status(404).json({ message: "Loisir not found" });
    res.status(200).json(loisir);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLoisir = async (req, res) => {
  try {
    const { name, description, ouverture, fermeture } = req.body;

    const updateFields = {
      name,
      description,
      ouverture: ouverture ? new Date(ouverture) : null,
      fermeture: fermeture ? new Date(fermeture) : null
    };

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const loisir = await Loisir.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!loisir) return res.status(404).json({ message: "Loisir not found" });

    const io = req.app.get("io");
    io.emit("loisirUpdated", loisir);

    res.status(200).json(loisir);
  } catch (err) {
    console.error("❌ Error updating loisir:", err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.deleteLoisir = async (req, res) => {
  try {
    const loisir = await Loisir.findByIdAndDelete(req.params.id);
    if (!loisir) return res.status(404).json({ message: "Loisir not found" });

    const io = req.app.get("io");
    io.emit("loisirDeleted", loisir._id);

    res.status(200).json({ message: "Loisir deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

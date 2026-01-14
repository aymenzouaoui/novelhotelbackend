const Seminaire = require("../models/Seminaire");

exports.createSeminaire = async (req, res) => {
  try {
    const { nom, capacite, superficie, hauteur } = req.body;
    let image = "";
    let fiche = "";

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        image = req.files.image[0].path;
      }
      if (req.files.fiche && req.files.fiche[0]) {
        fiche = req.files.fiche[0].path;
      }
    }

    const seminaire = new Seminaire({ nom, capacite, superficie, hauteur, image, fiche });
    await seminaire.save();

    const io = req.app.get("io");
    io.emit("seminaireCreated", seminaire);

    res.status(201).json(seminaire);
  } catch (err) {
    console.error("❌ Error creating seminaire:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSeminaires = async (req, res) => {
  try {
    const seminaires = await Seminaire.find();
    res.status(200).json(seminaires);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSeminaireById = async (req, res) => {
  try {
    const seminaire = await Seminaire.findById(req.params.id);
    if (!seminaire) return res.status(404).json({ message: "Seminaire not found" });
    res.status(200).json(seminaire);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSeminaire = async (req, res) => {
  try {
    const { nom, capacite, superficie, hauteur } = req.body;
    let updateFields = { nom, capacite, superficie, hauteur };

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        updateFields.image = req.files.image[0].path;
      }
      if (req.files.fiche && req.files.fiche[0]) {
        updateFields.fiche = req.files.fiche[0].path;
      }
    }

    const seminaire = await Seminaire.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!seminaire) return res.status(404).json({ message: "Seminaire not found" });

    const io = req.app.get("io");
    io.emit("seminaireUpdated", seminaire);

    res.status(200).json(seminaire);
  } catch (err) {
    console.error("❌ Error updating seminaire:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSeminaire = async (req, res) => {
  try {
    const seminaire = await Seminaire.findByIdAndDelete(req.params.id);
    if (!seminaire) return res.status(404).json({ message: "Seminaire not found" });

    const io = req.app.get("io");
    io.emit("seminaireDeleted", seminaire._id);

    res.status(200).json({ message: "Seminaire deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const OffreSpeciale = require("../models/OffreSpeciale");

exports.createOffre = async (req, res) => {
  try {
    const { title, description, discountPercentage, startDate, endDate, active } = req.body;
    const image = req.file ? req.file.path : "";

    const offre = new OffreSpeciale({
      title,
      description,
      discountPercentage,
      startDate,
      endDate,
      active,
      image,
    });

    await offre.save();

    const io = req.app.get("io");
    io.emit("offreCreated", offre);

    res.status(201).json(offre);
  } catch (err) {
    console.error("❌ Error creating offer:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllOffres = async (req, res) => {
  try {
    const offres = await OffreSpeciale.find();
    res.status(200).json(offres);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOffreById = async (req, res) => {
  try {
    const offre = await OffreSpeciale.findById(req.params.id);
    if (!offre) return res.status(404).json({ message: "Offre not found" });
    res.status(200).json(offre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOffre = async (req, res) => {
  try {
    const updateFields = {
      title: req.body.title,
      description: req.body.description,
      discountPercentage: req.body.discountPercentage,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      active: req.body.active,
    };

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const offre = await OffreSpeciale.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!offre) return res.status(404).json({ message: "Offre not found" });

    const io = req.app.get("io");
    io.emit("offreUpdated", offre);

    res.status(200).json(offre);
  } catch (err) {
    console.error("❌ Error updating offer:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteOffre = async (req, res) => {
  try {
    const offre = await OffreSpeciale.findByIdAndDelete(req.params.id);
    if (!offre) return res.status(404).json({ message: "Offre not found" });

    // 🟠 Emit deletion
    const io = req.app.get("io");
    io.emit("offreDeleted", offre._id);

    res.status(200).json({ message: "Offre deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

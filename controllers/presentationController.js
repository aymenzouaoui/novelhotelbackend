const Presentation = require("../models/Presentation");

exports.createPresentation = async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file ? req.file.path : ""; // ✅ Cloudinary image URL

    const presentation = new Presentation({
      title,
      content,
      image,
    });

    await presentation.save();

    const io = req.app.get("io");
    io.emit("presentationCreated", presentation);

    res.status(201).json(presentation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPresentations = async (req, res) => {
  try {
    const presentations = await Presentation.find();
    res.status(200).json(presentations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPresentationById = async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) return res.status(404).json({ message: "Presentation not found" });
    res.status(200).json(presentation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePresentation = async (req, res) => {
  try {
    const { title, content } = req.body;

    const updateFields = {
      title,
      content,
    };

    if (req.file) {
      updateFields.image = req.file.path; // ✅ Cloudinary image URL
    }

    const presentation = await Presentation.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!presentation) return res.status(404).json({ message: "Presentation not found" });

    const io = req.app.get("io");
    io.emit("presentationUpdated", presentation);

    res.status(200).json(presentation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePresentation = async (req, res) => {
  try {
    const presentation = await Presentation.findByIdAndDelete(req.params.id);
    if (!presentation) return res.status(404).json({ message: "Presentation not found" });

    const io = req.app.get("io");
    io.emit("presentationDeleted", presentation._id);

    res.status(200).json({ message: "Presentation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

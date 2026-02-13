const OffreSpeciale = require("../models/OffreSpeciale");

// Helper function to detect media type from file extension
function detectMediaType(filename) {
  if (!filename) return null;
  const ext = filename.toLowerCase().split('.').pop();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return null;
}

exports.createOffre = async (req, res) => {
  try {
    const { title, description, discountPercentage, startDate, endDate, active } = req.body;
    const media = req.file ? req.file.path : "";
    const mediaType = req.file ? detectMediaType(req.file.originalname) : null;

    const offre = new OffreSpeciale({
      title,
      description,
      discountPercentage,
      startDate,
      endDate,
      active,
      media,
      mediaType,
      // Keep image for backward compatibility
      image: media && mediaType === 'image' ? media : "",
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
      const mediaType = detectMediaType(req.file.originalname);
      updateFields.media = req.file.path;
      updateFields.mediaType = mediaType;
      // Keep image for backward compatibility if it's an image
      if (mediaType === 'image') {
        updateFields.image = req.file.path;
      } else {
        updateFields.image = "";
      }
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

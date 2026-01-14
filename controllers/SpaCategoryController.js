const SpaCategory = require("../models/SpaCategory");

// Create a new Spa Category
exports.createSpaCategory = async (req, res) => {
  try {
    const { title, services } = req.body;
    const image = req.file ? req.file.path : "";

    // Parse services if sent as JSON string
    let parsedServices = [];
    if (services) {
      parsedServices = typeof services === "string" ? JSON.parse(services) : services;
    }

    const spaCategory = new SpaCategory({
      title,
      services: parsedServices,
      image,
    });

    await spaCategory.save();

    res.status(201).json(spaCategory);
    
  } catch (err) {
    console.error("❌ Error creating spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get all Spa Categories
exports.getAllSpaCategories = async (req, res) => {
  try {
    const categories = await SpaCategory.find();
    res.status(200).json(categories);
  } catch (err) {
    console.error("❌ Error fetching spa categories:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get a Spa Category by ID
exports.getSpaCategoryById = async (req, res) => {
  try {
    const category = await SpaCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Spa category not found" });
    res.status(200).json(category);
  } catch (err) {
    console.error("❌ Error fetching spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Update a Spa Category
exports.updateSpaCategory = async (req, res) => {
  try {
    const updateFields = {
      title: req.body.title,
    };

    // Parse services if sent
    if (req.body.services) {
      updateFields.services = typeof req.body.services === "string" ? JSON.parse(req.body.services) : req.body.services;
    }

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const category = await SpaCategory.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!category) return res.status(404).json({ message: "Spa category not found" });

    res.status(200).json(category);
  } catch (err) {
    console.error("❌ Error updating spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Delete a Spa Category
exports.deleteSpaCategory = async (req, res) => {
  try {
    const category = await SpaCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Spa category not found" });

    res.status(200).json({ message: "Spa category deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};

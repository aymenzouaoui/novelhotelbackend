const PageContent = require("../models/PageContent");

// CREATE
exports.createPageContent = async (req, res) => {
  try {
    const { pageName, description } = req.body;
    const image = req.file ? req.file.path : "";

    const pageContent = new PageContent({ pageName, description, image });
    await pageContent.save();

    res.status(201).json(pageContent);
  } catch (err) {
    console.error("❌ Error creating page content:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL
exports.getAllPageContents = async (req, res) => {
  try {
    const contents = await PageContent.find();
    res.status(200).json(contents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY ID
exports.getPageContentById = async (req, res) => {
  try {
    const content = await PageContent.findById(req.params.id);
    if (!content) return res.status(404).json({ message: "Page content not found" });
    res.status(200).json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY PAGE NAME
exports.getPageContentByPageName = async (req, res) => {
  try {
    const content = await PageContent.findOne({ pageName: req.params.pageName });
    if (!content) return res.status(404).json({ message: "Page content not found" });
    res.status(200).json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updatePageContent = async (req, res) => {
  try {
    const { description } = req.body;
    const updateFields = { description };

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const content = await PageContent.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!content) return res.status(404).json({ message: "Page content not found" });

    res.status(200).json(content);
  } catch (err) {
    console.error("❌ Error updating page content:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.deletePageContent = async (req, res) => {
  try {
    const content = await PageContent.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ message: "Page content not found" });

    res.status(200).json({ message: "Page content deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

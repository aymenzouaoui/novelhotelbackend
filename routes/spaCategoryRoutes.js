const express = require("express");
const upload = require("../middleware/upload"); // ✅ Your multer config

const router = express.Router();
const {
  createSpaCategory,
  getAllSpaCategories,
  getSpaCategoryById,
  updateSpaCategory,
  deleteSpaCategory
} = require("../controllers/SpaCategoryController");

// Create a new Spa Category (with image)
router.post("/", upload.single("image"), createSpaCategory);

// Update a Spa Category (with optional new image)
router.put("/:id", upload.single("image"), updateSpaCategory);

// Get all Spa Categories
router.get("/", getAllSpaCategories);

// Get a single Spa Category by ID
router.get("/:id", getSpaCategoryById);

// Delete a Spa Category
router.delete("/:id", deleteSpaCategory);

module.exports = router;
